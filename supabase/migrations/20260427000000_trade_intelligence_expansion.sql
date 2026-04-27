-- ============================================================
-- Trade Intelligence Expansion — Global Aggregates & Comparison
-- Date: 2026-04-27
-- ============================================================

-- 1. Global Aggregates (2-digit HS level for broad market analysis)
CREATE TABLE IF NOT EXISTS public.trade_global_aggregates (
    id                  BIGSERIAL    PRIMARY KEY,
    reporter_iso3       VARCHAR(3)   NOT NULL,
    hs_code             VARCHAR(2)   NOT NULL,   -- Chapter level
    year                INT          NOT NULL,
    export_value_usd    BIGINT,
    import_value_usd    BIGINT,
    yoy_growth_pct      DECIMAL(10,2),
    share_of_total_pct  DECIMAL(6,3),
    untapped_score      INT          DEFAULT 0,  -- Heuristic: Growth + Market Fragmented
    fetched_at          TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE(reporter_iso3, hs_code, year)
);

ALTER TABLE public.trade_global_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on trade_global_aggregates"
    ON public.trade_global_aggregates FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_tga_reporter_year ON public.trade_global_aggregates(reporter_iso3, year DESC);
CREATE INDEX IF NOT EXISTS idx_tga_hs_code ON public.trade_global_aggregates(hs_code);

-- 2. Monthly Cron Job for Trade Data Refresh
-- This handles the global pulse (2-digit) and specific deep dives (6-digit for key corridors)
SELECT cron.schedule(
    'ingest-trade-intelligence-pulse',
    '0 5 1 * *', -- 5:00 AM on the 1st of every month
    $$ SELECT net.http_get('https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-global-pulse') $$
);

-- 3. View: India vs China Comparison Helper
-- Joins demand cache for specific reporters to simplify frontend queries
CREATE OR REPLACE VIEW public.view_india_china_comparison AS
SELECT 
    t1.hs_code,
    m.description as hs_description,
    t1.year,
    -- India Stats
    MAX(CASE WHEN t1.reporter_iso3 = 'IND' THEN t1.import_value_usd END) as india_import_usd,
    MAX(CASE WHEN t1.reporter_iso3 = 'IND' THEN t1.qty_value END) as india_qty,
    -- China Stats
    MAX(CASE WHEN t1.reporter_iso3 = 'CHN' THEN t1.import_value_usd END) as china_import_usd,
    MAX(CASE WHEN t1.reporter_iso3 = 'CHN' THEN t1.qty_value END) as china_qty
FROM public.trade_demand_cache t1
LEFT JOIN public.hs_code_master m ON t1.hs_code = m.code
WHERE t1.reporter_iso3 IN ('IND', 'CHN')
GROUP BY t1.hs_code, m.description, t1.year;
