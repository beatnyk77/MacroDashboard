-- ==============================================================================
-- GLOBAL REFINING CAPACITY & IMBALANCE METRICS
-- 
-- Tracks structural shift in global refining capacity (West vs East), capturing
-- capacity (mbpd), utilization, and refinery status (expansion, conversion, closure)
-- to be rendered on an interactive map.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.global_refining_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    as_of_date DATE NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL, -- 'West', 'East', 'Middle East', 'Other'
    facility_name VARCHAR(255) NOT NULL,
    capacity_mbpd NUMERIC(8,2) NOT NULL,
    utilization_pct NUMERIC(5,2),
    historical_median_pct NUMERIC(5,2),
    status VARCHAR(50) NOT NULL, -- 'Expansion', 'Conversion', 'Closure', 'Operating'
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    import_dependency_correlation NUMERIC(5,2), -- For India/China focus cards
    is_top_10 BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (as_of_date, facility_name, country)
);

-- Comments for documentation
COMMENT ON TABLE public.global_refining_capacity IS 'Logs global refining capacity, utilization, and structural shifts (closures vs expansions).';

-- Create index for faster querying
CREATE INDEX idx_global_refining_capacity_date ON public.global_refining_capacity(as_of_date DESC);
CREATE INDEX idx_global_refining_capacity_region ON public.global_refining_capacity(region);

-- Enable RLS
ALTER TABLE public.global_refining_capacity ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'global_refining_capacity' AND policyname = 'Allow anonymous read access on global_refining_capacity'
    ) THEN
        CREATE POLICY "Allow anonymous read access on global_refining_capacity" 
            ON public.global_refining_capacity FOR READ 
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'global_refining_capacity' AND policyname = 'Allow service role full access on global_refining_capacity'
    ) THEN
        CREATE POLICY "Allow service role full access on global_refining_capacity" 
            ON public.global_refining_capacity FOR ALL 
            USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- Create views for easy aggregations
CREATE OR REPLACE VIEW public.vw_regional_refining_imbalance AS
SELECT 
    as_of_date,
    region,
    COUNT(id) as total_facilities,
    SUM(capacity_mbpd) as total_capacity_mbpd,
    AVG(utilization_pct) as avg_utilization_pct,
    COUNT(CASE WHEN status = 'Closure' THEN 1 END) as closed_count,
    COUNT(CASE WHEN status = 'Expansion' THEN 1 END) as expanded_count,
    COUNT(CASE WHEN status = 'Conversion' THEN 1 END) as converted_count
FROM public.global_refining_capacity
GROUP BY as_of_date, region;

-- Update trigger
CREATE OR REPLACE FUNCTION update_global_refining_capacity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_global_refining_capacity_updated_at ON public.global_refining_capacity;
CREATE TRIGGER trg_global_refining_capacity_updated_at
BEFORE UPDATE ON public.global_refining_capacity
FOR EACH ROW
EXECUTE FUNCTION update_global_refining_capacity_updated_at();
