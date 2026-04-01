-- ============================================================
-- Migration: 20260402000015_missing_cie_tables.sql
-- Purpose: Add missing CIE tables that components query but were
--          not included in the 20260402000010_cie_schema.sql migration.
--          Also creates institutional_13f_holdings baseline schema
--          (already exists in production, IF NOT EXISTS makes it safe).
-- ============================================================

-- 1. CIE Bulk/Block Deals (queried by BulkBlockReport.tsx)
CREATE TABLE IF NOT EXISTS public.cie_bulk_block_deals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    date DATE NOT NULL,
    symbol TEXT NOT NULL,
    client_name TEXT,
    type TEXT CHECK (type IN ('BUY', 'SELL')),
    deal_type TEXT CHECK (deal_type IN ('BULK', 'BLOCK')) DEFAULT 'BULK',
    quantity BIGINT,
    price NUMERIC,
    equity_pct NUMERIC,
    source TEXT DEFAULT 'NSE',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cie_bulk_block_deals_date
    ON public.cie_bulk_block_deals(date DESC);
CREATE INDEX IF NOT EXISTS idx_cie_bulk_block_deals_symbol
    ON public.cie_bulk_block_deals(symbol);

ALTER TABLE public.cie_bulk_block_deals ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to cie_bulk_block_deals') THEN
        CREATE POLICY "Allow public read access to cie_bulk_block_deals"
            ON public.cie_bulk_block_deals FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write access to cie_bulk_block_deals') THEN
        CREATE POLICY "Service role write access to cie_bulk_block_deals"
            ON public.cie_bulk_block_deals FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 2. CIE Upcoming IPOs (queried by UpcomingIPOs.tsx)
CREATE TABLE IF NOT EXISTS public.cie_upcoming_ipos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    company_name TEXT NOT NULL,
    issue_size_cr NUMERIC,
    price_band_min NUMERIC,
    price_band_max NUMERIC,
    open_date DATE,
    close_date DATE,
    listing_date DATE,
    sector TEXT,
    macro_risk_score NUMERIC DEFAULT 50 CHECK (macro_risk_score BETWEEN 0 AND 100),
    exchange TEXT DEFAULT 'NSE',
    status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Open', 'Closed', 'Listed')),
    draft_prospectus_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cie_upcoming_ipos_open_date
    ON public.cie_upcoming_ipos(open_date ASC);
CREATE INDEX IF NOT EXISTS idx_cie_upcoming_ipos_status
    ON public.cie_upcoming_ipos(status);

ALTER TABLE public.cie_upcoming_ipos ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to cie_upcoming_ipos') THEN
        CREATE POLICY "Allow public read access to cie_upcoming_ipos"
            ON public.cie_upcoming_ipos FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write access to cie_upcoming_ipos') THEN
        CREATE POLICY "Service role write access to cie_upcoming_ipos"
            ON public.cie_upcoming_ipos FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 3. institutional_13f_holdings (already exists in production but not tracked in migrations)
--    Using IF NOT EXISTS to be safe — will no-op if table already has the base schema.
CREATE TABLE IF NOT EXISTS public.institutional_13f_holdings (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    cik TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    ticker TEXT,
    cusip TEXT,
    company_name TEXT,
    sector TEXT,
    shares_count BIGINT,
    shares_value NUMERIC,
    value_usd NUMERIC,
    as_of_date DATE NOT NULL,
    quarter TEXT,
    -- Extended analytics columns (mirroring extend migration)
    asset_class_allocation JSONB DEFAULT '{"equity_pct": 0, "bond_pct": 0, "gold_pct": 0, "other_pct": 0}'::jsonb,
    top_holdings JSONB DEFAULT '[]'::jsonb,
    concentration_score NUMERIC,
    sector_rotation_signal TEXT CHECK (sector_rotation_signal IN ('ACCUMULATE', 'REDUCE', 'NEUTRAL')),
    spy_comparison NUMERIC,
    tlt_comparison NUMERIC,
    gld_comparison NUMERIC,
    regime_z_score NUMERIC,
    historical_allocation JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institutional_13f_holdings_cik_date
    ON public.institutional_13f_holdings(cik, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_institutional_13f_holdings_date
    ON public.institutional_13f_holdings(as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_institutional_13f_holdings_value
    ON public.institutional_13f_holdings(value_usd DESC);

ALTER TABLE public.institutional_13f_holdings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to institutional_13f_holdings') THEN
        CREATE POLICY "Allow public read access to institutional_13f_holdings"
            ON public.institutional_13f_holdings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write access to institutional_13f_holdings') THEN
        CREATE POLICY "Service role write access to institutional_13f_holdings"
            ON public.institutional_13f_holdings FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
