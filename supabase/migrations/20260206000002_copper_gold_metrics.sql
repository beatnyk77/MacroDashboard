-- =====================================================
-- Copper/Gold Ratio Metrics Migration
-- =====================================================

-- 1. Seed Copper/Gold Metrics
DO $$
DECLARE
  yahoo_source_id INTEGER;
BEGIN
  SELECT id INTO yahoo_source_id FROM data_sources WHERE name = 'Yahoo Finance';

  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    ('COPPER_PRICE_USD', 'Copper Price (COMEX)', 'Copper futures price in USD per pound', yahoo_source_id, 'daily', 'daily', 'USD', 'USD/lb', 'core', 'valuation', 2),
    ('COPPER_GOLD_RATIO', 'Copper/Gold Ratio', 'Ratio of Copper price to Gold price (HG=F / GC=F)', yahoo_source_id, 'daily', 'daily', 'ratio', 'Ratio', 'core', 'valuation', 2)
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
