-- ============================================================
-- US Equities Core Schema
-- Migration: 20260402000013_us_equities_schema.sql
-- Creates tables for corporate fundamentals, SEC filings, insider trades, and sector summaries.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.us_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cik TEXT UNIQUE NOT NULL,
    ticker TEXT UNIQUE,
    name TEXT NOT NULL,
    sector TEXT,
    exchange TEXT DEFAULT 'US',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.us_fundamentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.us_companies(id) ON DELETE CASCADE,
    cik TEXT NOT NULL,
    period_end DATE NOT NULL,
    form_type TEXT CHECK (form_type IN ('10-K', '10-Q')),
    revenue NUMERIC,
    operating_income NUMERIC,
    net_income NUMERIC,
    eps_diluted NUMERIC,
    shares_outstanding NUMERIC,
    total_assets NUMERIC,
    total_debt NUMERIC,
    stockholders_equity NUMERIC,
    cash_equivalents NUMERIC,
    pe_ratio NUMERIC,
    pb_ratio NUMERIC,
    ev_ebitda NUMERIC,
    roe NUMERIC,
    operating_margin NUMERIC,
    debt_equity NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cik, period_end, form_type)
);

CREATE TABLE IF NOT EXISTS public.us_filings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.us_companies(id) ON DELETE SET NULL,
    cik TEXT NOT NULL,
    form_type TEXT NOT NULL,
    filing_date DATE NOT NULL,
    accession_no TEXT UNIQUE NOT NULL,
    description TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.us_insider_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.us_companies(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    insider_name TEXT NOT NULL,
    insider_title TEXT,
    transaction_type TEXT CHECK (transaction_type IN ('BUY', 'SELL', 'OTHER')),
    shares_traded INTEGER,
    total_value NUMERIC,
    transaction_date DATE NOT NULL,
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

-- ============================================================
-- Stored Procedure: refresh_us_sector_summary
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_us_sector_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Truncate existing summary
    TRUNCATE TABLE public.us_sector_summary;

    -- Insert fresh aggregates from us_fundamentals joined with us_companies
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
