-- Migration: UK Trade Info Schema
-- Description: Tables and views for UK Trade Info API integration

-- Table: uk_trader_intelligence
-- Stores specific UK company intelligence for HS codes
CREATE TABLE IF NOT EXISTS public.uk_trader_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs_code TEXT NOT NULL,
    flow_type TEXT NOT NULL, -- 'Import' or 'Export'
    trader_id BIGINT,
    company_name TEXT NOT NULL,
    postcode TEXT,
    month_id INTEGER NOT NULL, -- Format: YYYYMM
    value_gbp NUMERIC,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hs_code, flow_type, trader_id, month_id)
);

CREATE INDEX IF NOT EXISTS idx_uk_trader_intel_hs_code ON public.uk_trader_intelligence(hs_code);
CREATE INDEX IF NOT EXISTS idx_uk_trader_intel_month_id ON public.uk_trader_intelligence(month_id);

-- Table: uk_ots_flows
-- Stores macro-level OTS and RTS flows for the UK
CREATE TABLE IF NOT EXISTS public.uk_ots_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs_code TEXT NOT NULL,
    month_id INTEGER NOT NULL, -- Format: YYYYMM
    flow_type TEXT NOT NULL, -- 'Import' or 'Export'
    partner_country_iso TEXT,
    region_id TEXT,
    port_id TEXT,
    value_gbp NUMERIC,
    net_mass_kg NUMERIC,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hs_code, month_id, flow_type, partner_country_iso, region_id, port_id)
);

CREATE INDEX IF NOT EXISTS idx_uk_ots_flows_hs_code ON public.uk_ots_flows(hs_code);
CREATE INDEX IF NOT EXISTS idx_uk_ots_flows_month_id ON public.uk_ots_flows(month_id);

-- View: vw_latest_uk_traders
-- Canonical view with staleness flag for the frontend hooks
CREATE OR REPLACE VIEW public.vw_latest_uk_traders AS
WITH latest_month AS (
    SELECT hs_code, MAX(month_id) as max_month_id
    FROM public.uk_trader_intelligence
    GROUP BY hs_code
)
SELECT 
    t.id,
    t.hs_code,
    t.flow_type,
    t.trader_id,
    t.company_name,
    t.postcode,
    t.month_id,
    t.value_gbp,
    t.last_updated,
    CASE 
        WHEN t.last_updated >= NOW() - INTERVAL '30 days' THEN 'fresh'
        WHEN t.last_updated >= NOW() - INTERVAL '90 days' THEN 'lagged'
        ELSE 'very_lagged'
    END AS staleness_flag
FROM 
    public.uk_trader_intelligence t
INNER JOIN 
    latest_month lm ON t.hs_code = lm.hs_code AND t.month_id = lm.max_month_id;

-- Enable RLS
ALTER TABLE public.uk_trader_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uk_ots_flows ENABLE ROW LEVEL SECURITY;

-- Create Policies (allow read access)
CREATE POLICY "Allow read access to all users for uk_trader_intelligence" 
    ON public.uk_trader_intelligence FOR SELECT USING (true);

CREATE POLICY "Allow read access to all users for uk_ots_flows" 
    ON public.uk_ots_flows FOR SELECT USING (true);
