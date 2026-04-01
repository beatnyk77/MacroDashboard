-- ============================================================
-- Migration: 20260402000020_equities_pipeline_final.sql
-- Purpose: Final consolidated hardening of the equities pipeline.
--          Syncs all schemas, adds missing tables, and seeds initial data.
-- ============================================================

-- 1. Schema Alignment (Ensuring consistency across envs)
ALTER TABLE public.us_companies ADD COLUMN IF NOT EXISTS cik TEXT;
ALTER TABLE public.us_companies ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
ALTER TABLE public.us_companies ADD COLUMN IF NOT EXISTS market_cap NUMERIC;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'us_companies_ticker_key') THEN
        ALTER TABLE public.us_companies ADD CONSTRAINT us_companies_ticker_key UNIQUE (ticker);
    END IF;
END $$;

ALTER TABLE public.us_fundamentals ADD COLUMN IF NOT EXISTS cik TEXT;
ALTER TABLE public.us_fundamentals ADD COLUMN IF NOT EXISTS accession_no TEXT;
ALTER TABLE public.us_filings ADD COLUMN IF NOT EXISTS cik TEXT;
ALTER TABLE public.us_filings ADD COLUMN IF NOT EXISTS accession_no TEXT;


-- 2. CIE Missing Tables
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

-- 3. Institutional Holdings Hardening
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS value_usd NUMERIC;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS shares_value NUMERIC;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS asset_class_allocation JSONB DEFAULT '{"equity_pct": 0, "bond_pct": 0, "gold_pct": 0, "other_pct": 0}'::jsonb;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS concentration_score NUMERIC;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS sector_rotation_signal TEXT CHECK (sector_rotation_signal IN ('ACCUMULATE', 'REDUCE', 'NEUTRAL'));
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS spy_comparison NUMERIC;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS tlt_comparison NUMERIC;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS gld_comparison NUMERIC;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS regime_z_score NUMERIC;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS historical_allocation JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.institutional_13f_holdings ADD COLUMN IF NOT EXISTS top_holdings JSONB DEFAULT '[]'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cie_bulk_block_deals_date ON public.cie_bulk_block_deals(date DESC);
CREATE INDEX IF NOT EXISTS idx_cie_upcoming_ipos_open_date ON public.cie_upcoming_ipos(open_date ASC);
CREATE INDEX IF NOT EXISTS idx_institutional_13f_holdings_value ON public.institutional_13f_holdings(value_usd DESC);

-- 4. Seed Data
-- US Leaders
INSERT INTO public.us_companies (ticker, name, sector, industry, exchange, country, market_cap, cik)
VALUES 
('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics', 'NASDAQ', 'US', 2800000000, '0000320193'),
('MSFT', 'Microsoft Corp.', 'Technology', 'Software—Infrastructure', 'NASDAQ', 'US', 3000000000, '0000789019'),
('NVDA', 'NVIDIA Corp.', 'Technology', 'Semiconductors', 'NASDAQ', 'US', 2200000000, '0001045810'),
('AMZN', 'Amazon.com Inc.', 'Consumer Cyclical', 'Internet Retail', 'NASDAQ', 'US', 1800000000, '0001018724'),
('GOOGL', 'Alphabet Inc.', 'Communication Services', 'Internet Content & Information', 'NASDAQ', 'US', 1700000000, '0001652044')
ON CONFLICT (ticker) DO NOTHING;


-- CIE Leaders
INSERT INTO public.cie_companies (ticker, name, sector, industry, state_hq)
VALUES 
('RELIANCE.NS', 'Reliance Industries Ltd', 'Energy', 'Oil & Gas', 'Maharashtra'),
('TCS.NS', 'Tata Consultancy Services', 'Technology', 'IT Services', 'Maharashtra'),
('HDFCBANK.NS', 'HDFC Bank Ltd', 'Financials', 'Banking', 'Maharashtra'),
('ICICIBANK.NS', 'ICICI Bank Ltd', 'Financials', 'Banking', 'Maharashtra'),
('INFY.NS', 'Infosys Ltd', 'Technology', 'IT Services', 'Karnataka')
ON CONFLICT (ticker) DO NOTHING;
