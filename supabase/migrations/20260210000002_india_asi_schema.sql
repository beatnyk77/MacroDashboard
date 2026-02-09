-- =====================================================
-- Annual Survey of Industries (ASI) Schema
-- =====================================================

-- Table for state-level industrial metrics
CREATE TABLE IF NOT EXISTS india_asi (
    id SERIAL PRIMARY KEY,
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    sector TEXT NOT NULL CHECK (sector IN ('manufacturing', 'mining', 'electricity', 'construction', 'all_industries')),
    
    -- Key Metrics
    gva_crores NUMERIC, -- Gross Value Added in Crores
    employment_thousands NUMERIC, -- Employment in thousands
    capacity_utilization_rate NUMERIC, -- Percentage (0-100)
    fixed_capital_crores NUMERIC, -- Fixed Capital in Crores
    output_crores NUMERIC, -- Gross Output in Crores
    
    -- Metadata
    unit TEXT DEFAULT 'crores',
    as_of_date DATE NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(state_code, year, sector)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_india_asi_state_year ON india_asi(state_code, year);
CREATE INDEX IF NOT EXISTS idx_india_asi_sector ON india_asi(sector);
CREATE INDEX IF NOT EXISTS idx_india_asi_year ON india_asi(year DESC);

-- Add ASI metrics to the metrics table
INSERT INTO public.metrics (id, name, description, frequency, native_frequency, display_frequency, source, unit, tier, category, expected_interval_days)
VALUES
    ('IN_ASI_GVA_TOTAL', 'India ASI - Total GVA', 'Gross Value Added from Annual Survey of Industries (All India)', 'annual', 'annual', 'annual', 'MoSPI ASI', 'crores', 'secondary', 'macro_regime', 365),
    ('IN_ASI_EMPLOYMENT_TOTAL', 'India ASI - Total Employment', 'Total Employment from Annual Survey of Industries (All India)', 'annual', 'annual', 'annual', 'MoSPI ASI', 'thousands', 'secondary', 'macro_regime', 365),
    ('IN_ASI_CAPACITY_UTIL', 'India ASI - Capacity Utilization', 'Average Capacity Utilization Rate from ASI', 'annual', 'annual', 'annual', 'MoSPI ASI', '%', 'secondary', 'macro_regime', 365)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    frequency = EXCLUDED.frequency,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    source = EXCLUDED.source,
    unit = EXCLUDED.unit,
    tier = EXCLUDED.tier,
    category = EXCLUDED.category,
    expected_interval_days = EXCLUDED.expected_interval_days;

-- Verify geojson_india table exists (created in energy migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'geojson_india') THEN
        RAISE NOTICE 'geojson_india table does not exist. Please run energy migration first.';
    END IF;
END $$;

COMMENT ON TABLE india_asi IS 'State-level industrial metrics from Annual Survey of Industries (ASI)';
COMMENT ON COLUMN india_asi.gva_crores IS 'Gross Value Added in Crores (₹10 million)';
COMMENT ON COLUMN india_asi.employment_thousands IS 'Total employment in thousands';
COMMENT ON COLUMN india_asi.capacity_utilization_rate IS 'Capacity utilization as percentage (0-100)';
