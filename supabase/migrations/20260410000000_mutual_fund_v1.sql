-- ============================================================
-- Bharat Investment Universe (BIU) v1 Schema
-- Migration: 20260410000000_mutual_fund_v1.sql
-- ============================================================

-- 1. Mutual Fund Assets Table
CREATE TABLE IF NOT EXISTS public.mutual_fund_assets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    scheme_code INTEGER UNIQUE NOT NULL,
    isin TEXT,
    name TEXT NOT NULL,
    category TEXT,
    fund_house TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Mutual Fund Observations Table (Daily NAV)
CREATE TABLE IF NOT EXISTS public.mutual_fund_observations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    asset_id UUID REFERENCES public.mutual_fund_assets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    nav NUMERIC NOT NULL,
    daily_return NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(asset_id, date)
);

-- 3. Indexes for fast performance
CREATE INDEX IF NOT EXISTS idx_mf_observations_date ON public.mutual_fund_observations(date DESC);
CREATE INDEX IF NOT EXISTS idx_mf_observations_asset_id ON public.mutual_fund_observations(asset_id);
CREATE INDEX IF NOT EXISTS idx_mf_assets_category ON public.mutual_fund_assets(category);
CREATE INDEX IF NOT EXISTS idx_mf_assets_scheme_code ON public.mutual_fund_assets(scheme_code);

-- 4. Unified View for Universe Analysis
CREATE OR REPLACE VIEW public.vw_mutual_fund_universe AS
WITH latest_obs AS (
    SELECT 
        asset_id,
        nav as current_nav,
        date as updated_at,
        ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY date DESC) as rn
    FROM public.mutual_fund_observations
),
obs_1y AS (
    SELECT 
        asset_id, 
        nav as nav_1y, 
        ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY ABS(EXTRACT(days FROM (date - (CURRENT_DATE - INTERVAL '1 year'))))) as rn
    FROM public.mutual_fund_observations
),
obs_3y AS (
    SELECT 
        asset_id, 
        nav as nav_3y, 
        ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY ABS(EXTRACT(days FROM (date - (CURRENT_DATE - INTERVAL '3 years'))))) as rn
    FROM public.mutual_fund_observations
),
obs_5y AS (
    SELECT 
        asset_id, 
        nav as nav_5y, 
        ROW_NUMBER() OVER(PARTITION BY asset_id ORDER BY ABS(EXTRACT(days FROM (date - (CURRENT_DATE - INTERVAL '5 years'))))) as rn
    FROM public.mutual_fund_observations
)
SELECT 
    a.id,
    a.scheme_code,
    a.isin,
    a.name,
    a.category,
    a.fund_house,
    lo.current_nav,
    lo.updated_at,
    ((lo.current_nav / NULLIF(o1.nav_1y, 0)) - 1) * 100 as return_1y,
    ((lo.current_nav / NULLIF(o3.nav_3y, 0)) - 1) * 100 as return_3y,
    ((lo.current_nav / NULLIF(o5.nav_5y, 0)) - 1) * 100 as return_5y,
    -- Macro Impact Score Placeholder
    CASE 
        WHEN a.category ILIKE '%Small Cap%' THEN 78
        WHEN a.category ILIKE '%Mid Cap%' THEN 65
        WHEN a.category ILIKE '%Large Cap%' THEN 52
        WHEN a.category ILIKE '%Liquid%' THEN 40
        ELSE 50
    END as macro_impact_score
FROM public.mutual_fund_assets a
JOIN latest_obs lo ON lo.asset_id = a.id AND lo.rn = 1
LEFT JOIN obs_1y o1 ON o1.asset_id = a.id AND o1.rn = 1
LEFT JOIN obs_3y o3 ON o3.asset_id = a.id AND o3.rn = 1
LEFT JOIN obs_5y o5 ON o5.asset_id = a.id AND o5.rn = 1;

-- 5. Enable RLS
ALTER TABLE public.mutual_fund_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutual_fund_observations ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to mutual_fund_assets') THEN
        CREATE POLICY "Allow public read access to mutual_fund_assets"
            ON public.mutual_fund_assets FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to mutual_fund_observations') THEN
        CREATE POLICY "Allow public read access to mutual_fund_observations"
            ON public.mutual_fund_observations FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write access to mutual_fund_assets') THEN
        CREATE POLICY "Service role write access to mutual_fund_assets"
            ON public.mutual_fund_assets FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role write access to mutual_fund_observations') THEN
        CREATE POLICY "Service role write access to mutual_fund_observations"
            ON public.mutual_fund_observations FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
