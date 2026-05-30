-- =====================================================
-- Copper/Gold Ratio Metrics Migration
-- =====================================================

-- 1. Seed Copper/Gold Metrics
DO $$
DECLARE
  fred_source_id INTEGER;
BEGIN
  SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';

  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    ('COPPER_PRICE_USD', 'Copper Price (Global)', 'Global copper price in USD per metric ton (FRED: PCOPPUSDM)', fred_source_id, 'monthly', 'monthly', 'USD', 'USD/mt', 'core', 'valuation', 35),
    ('COPPER_GOLD_RATIO', 'Copper/Gold Ratio', 'Ratio of global copper price (USD/mt) to gold AM fix (USD/troy oz) — a growth proxy (FRED: PCOPPUSDM / GOLDAMGBD228NLBM)', fred_source_id, 'monthly', 'monthly', 'ratio', 'Ratio', 'core', 'valuation', 35)
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
