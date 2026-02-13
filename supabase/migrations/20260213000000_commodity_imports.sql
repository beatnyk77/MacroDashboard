-- Migration: Create commodity_imports table
-- Metal tracking for India and China (2000-2025)

CREATE TABLE IF NOT EXISTS public.commodity_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country TEXT NOT NULL CHECK (country IN ('India', 'China')),
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2025),
    metal TEXT NOT NULL CHECK (metal IN ('Gold', 'Silver', 'Rare Earth Metals')),
    value_usd NUMERIC NOT NULL DEFAULT 0,
    volume NUMERIC DEFAULT 0,
    volume_unit TEXT CHECK (volume_unit IN ('tonnes', 'kg', 'grams')),
    top_partners_json JSONB DEFAULT '[]'::jsonB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(country, year, metal)
);

-- Enable RLS
ALTER TABLE public.commodity_imports ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Enable read access for all users" ON public.commodity_imports
    FOR SELECT USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_commodity_imports_lookup ON public.commodity_imports (country, metal, year);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_commodity_imports_updated_at
    BEFORE UPDATE ON public.commodity_imports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
