-- ============================================================
-- CIE Schema: Corporate India Engine Tables
-- Migration: 20260402000010_cie_schema.sql
-- Adapted from: migrations_backup/20260227000001_cie_schema.sql
-- Context: Tables were previously deployed but not tracked in
-- active migrations. This migration uses IF NOT EXISTS guards
-- so it is safe to run against a live DB that already has them.
-- ============================================================

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS public.cie_companies (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    ticker TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sector TEXT,
    industry TEXT,
    state_hq TEXT,
    exchange TEXT DEFAULT 'NSE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fundamentals Table (quarterly financial data)
CREATE TABLE IF NOT EXISTS public.cie_fundamentals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    company_id UUID REFERENCES public.cie_companies(id) ON DELETE CASCADE,
    quarter_date DATE NOT NULL,
    revenue NUMERIC,
    net_profit NUMERIC,
    ebitda NUMERIC,
    capex NUMERIC,
    eps NUMERIC,
    operating_margin NUMERIC,
    total_assets NUMERIC,
    total_liabilities NUMERIC,
    debt_equity_ratio NUMERIC,
    return_on_equity NUMERIC,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, quarter_date)
);

-- 3. Macro Signals / Composite Scores Table (daily, per-company)
CREATE TABLE IF NOT EXISTS public.cie_macro_signals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    company_id UUID REFERENCES public.cie_companies(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL,
    macro_impact_score NUMERIC CHECK (macro_impact_score BETWEEN 0 AND 100),
    state_resilience NUMERIC,
    fiscal_exposure NUMERIC,
    oil_sensitivity NUMERIC,
    digitization_premium NUMERIC,
    formalization_premium NUMERIC,
    state_exposure_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, as_of_date)
);

-- 4. Watchlists Table (user-owned)
CREATE TABLE IF NOT EXISTS public.cie_watchlists (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS public.cie_alerts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.cie_companies(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    threshold NUMERIC,
    is_active BOOLEAN DEFAULT true,
    fired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Saved Views Table
CREATE TABLE IF NOT EXISTS public.cie_saved_views (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    sort_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_cie_macro_signals_company_date
    ON public.cie_macro_signals(company_id, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_cie_macro_signals_as_of_date
    ON public.cie_macro_signals(as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_cie_macro_signals_score
    ON public.cie_macro_signals(macro_impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_cie_fundamentals_company_quarter
    ON public.cie_fundamentals(company_id, quarter_date DESC);
CREATE INDEX IF NOT EXISTS idx_cie_companies_ticker
    ON public.cie_companies(ticker);
CREATE INDEX IF NOT EXISTS idx_cie_companies_sector
    ON public.cie_companies(sector);

-- Enable Row Level Security
ALTER TABLE public.cie_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_fundamentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_macro_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_saved_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to cie_companies') THEN
        CREATE POLICY "Allow public read access to cie_companies"
            ON public.cie_companies FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to cie_fundamentals') THEN
        CREATE POLICY "Allow public read access to cie_fundamentals"
            ON public.cie_fundamentals FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to cie_macro_signals') THEN
        CREATE POLICY "Allow public read access to cie_macro_signals"
            ON public.cie_macro_signals FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to manage their own watchlists') THEN
        CREATE POLICY "Allow users to manage their own watchlists"
            ON public.cie_watchlists FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to manage their own alerts') THEN
        CREATE POLICY "Allow users to manage their own alerts"
            ON public.cie_alerts FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to manage their own saved views') THEN
        CREATE POLICY "Allow users to manage their own saved views"
            ON public.cie_saved_views FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Service role write access (for Edge Function ingestion)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write access to cie_companies') THEN
        CREATE POLICY "Service role write access to cie_companies"
            ON public.cie_companies FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write access to cie_fundamentals') THEN
        CREATE POLICY "Service role write access to cie_fundamentals"
            ON public.cie_fundamentals FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write access to cie_macro_signals') THEN
        CREATE POLICY "Service role write access to cie_macro_signals"
            ON public.cie_macro_signals FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_cie_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_companies_updated_at') THEN
        CREATE TRIGGER update_cie_companies_updated_at
            BEFORE UPDATE ON public.cie_companies
            FOR EACH ROW EXECUTE PROCEDURE public.update_cie_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_fundamentals_updated_at') THEN
        CREATE TRIGGER update_cie_fundamentals_updated_at
            BEFORE UPDATE ON public.cie_fundamentals
            FOR EACH ROW EXECUTE PROCEDURE public.update_cie_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_macro_signals_updated_at') THEN
        CREATE TRIGGER update_cie_macro_signals_updated_at
            BEFORE UPDATE ON public.cie_macro_signals
            FOR EACH ROW EXECUTE PROCEDURE public.update_cie_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_watchlists_updated_at') THEN
        CREATE TRIGGER update_cie_watchlists_updated_at
            BEFORE UPDATE ON public.cie_watchlists
            FOR EACH ROW EXECUTE PROCEDURE public.update_cie_updated_at_column();
    END IF;
END $$;
