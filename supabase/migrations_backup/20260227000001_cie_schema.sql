-- CIE Schema Migration

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

-- 2. Fundamentals Table
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

-- 3. Macro Signals/Scores Table
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

-- 4. Watchlists Table
CREATE TABLE IF NOT EXISTS public.cie_watchlists (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cie_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_fundamentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_macro_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cie_watchlists ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to cie_companies') THEN
        CREATE POLICY "Allow public read access to cie_companies" ON public.cie_companies FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to cie_fundamentals') THEN
        CREATE POLICY "Allow public read access to cie_fundamentals" ON public.cie_fundamentals FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to cie_macro_signals') THEN
        CREATE POLICY "Allow public read access to cie_macro_signals" ON public.cie_macro_signals FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to manage their own watchlists') THEN
        CREATE POLICY "Allow users to manage their own watchlists" ON public.cie_watchlists FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_companies_updated_at') THEN
        CREATE TRIGGER update_cie_companies_updated_at BEFORE UPDATE ON public.cie_companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_fundamentals_updated_at') THEN
        CREATE TRIGGER update_cie_fundamentals_updated_at BEFORE UPDATE ON public.cie_fundamentals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_macro_signals_updated_at') THEN
        CREATE TRIGGER update_cie_macro_signals_updated_at BEFORE UPDATE ON public.cie_macro_signals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cie_watchlists_updated_at') THEN
        CREATE TRIGGER update_cie_watchlists_updated_at BEFORE UPDATE ON public.cie_watchlists FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
