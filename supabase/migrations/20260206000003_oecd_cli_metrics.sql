-- =====================================================
-- OECD Leading Indicators Metrics Migration
-- =====================================================

-- 1. Register Data Sources
INSERT INTO data_sources (name, api_endpoint, auth_type, metadata) VALUES
  ('OECD', 'https://stats.oecd.org/restsdmx/sdmx.ashx/GetData/MEI_CLI', 'none', '{"update_frequency": "monthly"}')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed OECD Metrics
DO $$
DECLARE
  oecd_source_id INTEGER;
BEGIN
  SELECT id INTO oecd_source_id FROM data_sources WHERE name = 'OECD';

  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    ('OECD_CLI_US', 'OECD CLI - United States', 'OECD Composite Leading Indicator for United States (Ampli-filtered)', oecd_source_id, 'monthly', 'monthly', 'index', 'Index (Long-term average=100)', 'core', 'macro_regime', 35),
    ('OECD_CLI_EA', 'OECD CLI - Euro Area', 'OECD Composite Leading Indicator for Euro Area (Ampli-filtered)', oecd_source_id, 'monthly', 'monthly', 'index', 'Index (Long-term average=100)', 'core', 'macro_regime', 35),
    ('OECD_CLI_CN', 'OECD CLI - China', 'OECD Composite Leading Indicator for China (Ampli-filtered)', oecd_source_id, 'monthly', 'monthly', 'index', 'Index (Long-term average=100)', 'core', 'macro_regime', 35),
    ('OECD_CLI_IN', 'OECD CLI - India', 'OECD Composite Leading Indicator for India (Ampli-filtered)', oecd_source_id, 'monthly', 'monthly', 'index', 'Index (Long-term average=100)', 'core', 'macro_regime', 35)
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
