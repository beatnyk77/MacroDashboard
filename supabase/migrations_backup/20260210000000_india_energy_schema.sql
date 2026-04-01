-- Table: india_energy
-- Stores state-level energy production/consumption data
CREATE TABLE IF NOT EXISTS india_energy (
    id SERIAL PRIMARY KEY,
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('coal', 'renewable', 'electricity', 'oil', 'gas')),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('production', 'consumption', 'capacity')),
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    as_of_date DATE NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(state_code, year, source_type, metric_type)
);

-- Table: geojson_india
-- Stores India state boundaries for map visualization
CREATE TABLE IF NOT EXISTS geojson_india (
    state_code TEXT PRIMARY KEY,
    state_name TEXT NOT NULL,
    geojson JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add energy metrics to metrics table
-- Note: Re-using the MoSPI source ID for esankhyiki as they are related.
DO $$ 
DECLARE 
    mospi_source_id INTEGER;
BEGIN
    SELECT id INTO mospi_source_id FROM data_sources WHERE name = 'MoSPI';
    
    IF mospi_source_id IS NOT NULL THEN
        INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, tier, category, expected_interval_days) VALUES
            ('IN_ENERGY_COAL_PROD', 'India Coal Production', 'Total coal production across all states', mospi_source_id, 'monthly', 'monthly', 'Million Tonnes', 'secondary', 'macro_regime', 30),
            ('IN_ENERGY_RENEWABLE_SHARE', 'India Renewable Energy Share', 'Percentage of renewable energy in total production', mospi_source_id, 'quarterly', 'quarterly', '%', 'secondary', 'macro_regime', 90),
            ('IN_ENERGY_ELECTRICITY_CONS', 'India Electricity Consumption', 'Total electricity consumption', mospi_source_id, 'monthly', 'monthly', 'Billion kWh', 'secondary', 'macro_regime', 30)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_india_energy_state_year ON india_energy(state_code, year);
CREATE INDEX IF NOT EXISTS idx_india_energy_source ON india_energy(source_type, metric_type);
