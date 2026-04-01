-- ============================================================
-- Migration: 20260402000013_us_equities_schema.sql
-- Creates tables for US corporate fundamentals, SEC filings,
-- insider trades, and sector summaries.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.us_companies (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    ticker TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sector TEXT,
    industry TEXT,
    exchange TEXT DEFAULT 'NASDAQ',
    country TEXT DEFAULT 'US',
    market_cap NUMERIC,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.us_fundamentals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    company_id UUID REFERENCES public.us_companies(id) ON DELETE CASCADE,
    period_end DATE NOT NULL,
    period_type TEXT DEFAULT 'annual' CHECK (period_type IN ('annual', 'quarterly')),
    -- Income statement
    revenue NUMERIC,
    operating_income NUMERIC,
    net_income NUMERIC,
    ebitda NUMERIC,
    -- Cash flow
    free_cash_flow NUMERIC,
    -- Balance sheet
    total_assets NUMERIC,
    total_liabilities NUMERIC,
    equity NUMERIC,
    debt NUMERIC,
    -- Per share
    eps NUMERIC,
    shares_outstanding NUMERIC,
    -- Valuation ratios
    pe_ratio NUMERIC,
    pb_ratio NUMERIC,
    ev_ebitda NUMERIC,
    -- Profitability
    roe NUMERIC,
    operating_margin NUMERIC,
    fcf_yield NUMERIC,
    -- Leverage
    debt_equity NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, period_end)
);

CREATE TABLE IF NOT EXISTS public.us_filings (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    company_id UUID REFERENCES public.us_companies(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    form_type TEXT NOT NULL,
    filing_date DATE NOT NULL,
    description TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.us_insider_trades (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    company_id UUID REFERENCES public.us_companies(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    insider_name TEXT NOT NULL,
    insider_title TEXT,
    transaction_type TEXT CHECK (transaction_type IN ('BUY', 'SELL', 'OTHER')),
    transaction_date DATE NOT NULL,
    shares_traded INTEGER,
    price_per_share NUMERIC,
    total_value NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.us_sector_summary (
    sector TEXT PRIMARY KEY,
    company_count INTEGER DEFAULT 0,
    avg_pe NUMERIC,
    avg_pb NUMERIC,
    avg_roe NUMERIC,
    avg_debt_equity NUMERIC,
    avg_operating_margin NUMERIC,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_us_companies_ticker ON public.us_companies(ticker);
CREATE INDEX IF NOT EXISTS idx_us_companies_sector ON public.us_companies(sector);
CREATE INDEX IF NOT EXISTS idx_us_fundamentals_company ON public.us_fundamentals(company_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_us_filings_ticker ON public.us_filings(ticker, filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_us_insider_trades_ticker ON public.us_insider_trades(ticker, transaction_date DESC);

-- RLS
ALTER TABLE public.us_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_fundamentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_insider_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_sector_summary ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read us_companies') THEN
        CREATE POLICY "Allow public read us_companies" ON public.us_companies FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read us_fundamentals') THEN
        CREATE POLICY "Allow public read us_fundamentals" ON public.us_fundamentals FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read us_filings') THEN
        CREATE POLICY "Allow public read us_filings" ON public.us_filings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read us_insider_trades') THEN
        CREATE POLICY "Allow public read us_insider_trades" ON public.us_insider_trades FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read us_sector_summary') THEN
        CREATE POLICY "Allow public read us_sector_summary" ON public.us_sector_summary FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write us_companies') THEN
        CREATE POLICY "Service role write us_companies" ON public.us_companies FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write us_fundamentals') THEN
        CREATE POLICY "Service role write us_fundamentals" ON public.us_fundamentals FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write us_filings') THEN
        CREATE POLICY "Service role write us_filings" ON public.us_filings FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write us_insider_trades') THEN
        CREATE POLICY "Service role write us_insider_trades" ON public.us_insider_trades FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write us_sector_summary') THEN
        CREATE POLICY "Service role write us_sector_summary" ON public.us_sector_summary FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================
-- Stored Procedure: refresh_us_sector_summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_us_sector_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    TRUNCATE TABLE public.us_sector_summary;

    INSERT INTO public.us_sector_summary
    SELECT
        c.sector,
        COUNT(DISTINCT c.id) as company_count,
        AVG(f.pe_ratio) as avg_pe,
        AVG(f.pb_ratio) as avg_pb,
        AVG(f.roe) as avg_roe,
        AVG(f.debt_equity) as avg_debt_equity,
        AVG(f.operating_margin) as avg_operating_margin,
        NOW() as last_updated
    FROM public.us_companies c
    LEFT JOIN LATERAL (
        SELECT * FROM public.us_fundamentals uf
        WHERE uf.company_id = c.id
        ORDER BY uf.period_end DESC
        LIMIT 1
    ) f ON true
    WHERE c.sector IS NOT NULL
    GROUP BY c.sector;
END;
$$;
