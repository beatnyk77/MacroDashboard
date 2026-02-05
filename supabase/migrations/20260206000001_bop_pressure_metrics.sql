-- =====================================================
-- Balance of Payments Pressure Metrics Migration
-- =====================================================

-- 1. Register Data Sources
INSERT INTO data_sources (name, api_endpoint, auth_type, metadata) VALUES
  ('BIS', 'https://data.bis.org/api/v1/data', 'none', '{"update_frequency": "monthly"}')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed BOP Metrics
DO $$
DECLARE
  bis_source_id INTEGER;
  imf_source_id INTEGER;
BEGIN
  SELECT id INTO bis_source_id FROM data_sources WHERE name = 'BIS';
  SELECT id INTO imf_source_id FROM data_sources WHERE name = 'IMF';

  -- REER (BIS)
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    ('REER_INDEX_IN', 'India REER', 'Real Effective Exchange Rate Index for India (Broad, CPI-based)', bis_source_id, 'monthly', 'monthly', 'index', 'Broad Index (2020=100)', 'core', 'sovereign', 35),
    ('REER_INDEX_CN', 'China REER', 'Real Effective Exchange Rate Index for China (Broad, CPI-based)', bis_source_id, 'monthly', 'monthly', 'index', 'Broad Index (2020=100)', 'core', 'sovereign', 35),
    ('REER_INDEX_BR', 'Brazil REER', 'Real Effective Exchange Rate Index for Brazil (Broad, CPI-based)', bis_source_id, 'monthly', 'monthly', 'index', 'Broad Index (2020=100)', 'core', 'sovereign', 35),
    ('REER_INDEX_TR', 'Turkey REER', 'Real Effective Exchange Rate Index for Turkey (Broad, CPI-based)', bis_source_id, 'monthly', 'monthly', 'index', 'Broad Index (2020=100)', 'core', 'sovereign', 35)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_id = EXCLUDED.source_id,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    unit = EXCLUDED.unit,
    unit_label = EXCLUDED.unit_label,
    tier = EXCLUDED.tier,
    category = EXCLUDED.category,
    expected_interval_days = EXCLUDED.expected_interval_days;

  -- Current Account % GDP (IMF)
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    ('CA_GDP_PCT_IN', 'India Current Account % GDP', 'Current Account balance as a percentage of GDP for India', imf_source_id, 'quarterly', 'quarterly', '%', '% of GDP', 'core', 'sovereign', 100),
    ('CA_GDP_PCT_CN', 'China Current Account % GDP', 'Current Account balance as a percentage of GDP for China', imf_source_id, 'quarterly', 'quarterly', '%', '% of GDP', 'core', 'sovereign', 100),
    ('CA_GDP_PCT_BR', 'Brazil Current Account % GDP', 'Current Account balance as a percentage of GDP for Brazil', imf_source_id, 'quarterly', 'quarterly', '%', '% of GDP', 'core', 'sovereign', 100),
    ('CA_GDP_PCT_TR', 'Turkey Current Account % GDP', 'Current Account balance as a percentage of GDP for Turkey', imf_source_id, 'quarterly', 'quarterly', '%', '% of GDP', 'core', 'sovereign', 100)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_id = EXCLUDED.source_id,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    unit = EXCLUDED.unit,
    unit_label = EXCLUDED.unit_label,
    tier = EXCLUDED.tier,
    category = EXCLUDED.category,
    expected_interval_days = EXCLUDED.expected_interval_days;
END $$;
