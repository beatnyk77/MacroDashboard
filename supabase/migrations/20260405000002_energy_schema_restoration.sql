-- =====================================================
-- Restoration: Energy & Commodities Lab Schema
-- Created: 2026-04-05
-- =====================================================

-- 1. Oil Data Schema
CREATE TABLE IF NOT EXISTS public.oil_refining_capacity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code text NOT NULL,
    country_name text NOT NULL,
    capacity_mbpd numeric NOT NULL,
    capacity_share_pct numeric,
    as_of_year int NOT NULL,
    last_updated_at timestamptz DEFAULT now(),
    source_id int REFERENCES public.data_sources(id),
    UNIQUE(country_code, as_of_year)
);

CREATE TABLE IF NOT EXISTS public.oil_imports_by_origin (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_country_code text NOT NULL,
    exporter_country_code text NOT NULL,
    exporter_country_name text,
    import_volume_mbbl numeric NOT NULL,
    as_of_date date NOT NULL,
    frequency text NOT NULL,
    last_updated_at timestamptz DEFAULT now(),
    source_id int REFERENCES public.data_sources(id),
    UNIQUE(importer_country_code, exporter_country_code, as_of_date)
);

-- 2. Commodity Imports (UN Comtrade)
CREATE TABLE IF NOT EXISTS public.commodity_imports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country text NOT NULL,
    year int NOT NULL,
    metal text NOT NULL,
    value_usd numeric,
    volume numeric,
    volume_unit text,
    top_partners_json jsonb DEFAULT '[]'::jsonb,
    last_updated_at timestamptz DEFAULT now(),
    UNIQUE(country, year, metal)
);

-- 3. Fuel Security - India
CREATE TABLE IF NOT EXISTS public.fuel_security_clock_india (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    as_of_date DATE NOT NULL,
    reserves_days_coverage NUMERIC,
    reserves_days_official NUMERIC,
    reserves_days_actual NUMERIC,
    deviation_pct NUMERIC,
    daily_consumption_mbpd NUMERIC,
    brent_price_usd NUMERIC,
    inr_per_barrel NUMERIC,
    active_tankers_count INTEGER DEFAULT 0,
    tanker_pipeline_json JSONB DEFAULT '[]'::jsonb,
    geopolitical_risk_score NUMERIC CHECK (geopolitical_risk_score >= 0 AND geopolitical_risk_score <= 100),
    scenario_baseline_days NUMERIC,
    scenario_disruption_days NUMERIC,
    scenario_rationing_days NUMERIC,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(as_of_date)
);

-- 4. Geopolitical Risk Events
CREATE TABLE IF NOT EXISTS public.geopolitical_risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    as_of_date DATE NOT NULL,
    chokepoint TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity NUMERIC NOT NULL,
    description TEXT,
    source_url TEXT,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(as_of_date, chokepoint, event_type)
);

-- 5. Views
CREATE OR REPLACE VIEW public.fuel_geopolitical_aggregated_score AS
SELECT
    as_of_date AS score_date,
    LEAST(100, SUM(severity * 2.5)) AS geopolitical_risk_score,
    COUNT(*) AS event_count
FROM public.geopolitical_risk_events
GROUP BY as_of_date;

-- 6. RLS
ALTER TABLE public.oil_refining_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_imports_by_origin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodity_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_security_clock_india ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geopolitical_risk_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'oil_refining_capacity') THEN
        CREATE POLICY "Allow public read access" ON public.oil_refining_capacity FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'oil_imports_by_origin') THEN
        CREATE POLICY "Allow public read access" ON public.oil_imports_by_origin FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'commodity_imports') THEN
        CREATE POLICY "Allow public read access" ON public.commodity_imports FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'fuel_security_clock_india') THEN
        CREATE POLICY "Allow public read access" ON public.fuel_security_clock_india FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'geopolitical_risk_events') THEN
        CREATE POLICY "Allow public read access" ON public.geopolitical_risk_events FOR SELECT USING (true);
    END IF;
END $$;
