-- =====================================================
-- Migration: US Debt vs Gold Backing
-- =====================================================

-- 1. Seed Metrics
INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
  ('UST_DEBT_TOTAL', 'Total US Public Debt', 'Total outstanding federal debt. Daily from FiscalData.', 1, 'daily', 'daily', 'USD', 'USD', 'core', 'sovereign', 1),
  ('US_TREASURY_GOLD_TONNES', 'US Treasury Gold Reserves (t)', 'Official US government gold holdings in metric tonnes.', 2, 'annual', 'annual', 't', 'tonnes', 'core', 'sovereign', 365),
  ('CN_DEBT_USD_TN', 'China Total Debt', 'China Total General Government Debt in USD Trillions.', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'core', 'sovereign', 100),
  ('IN_DEBT_USD_TN', 'India Total Debt', 'India Total General Government Debt in USD Trillions.', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'core', 'sovereign', 100)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Initial Values (if no ingestion yet)
INSERT INTO metric_observations (metric_id, as_of_date, value) VALUES
  ('US_TREASURY_GOLD_TONNES', '2026-01-01', 8133.5),
  ('CN_DEBT_USD_TN', '2026-01-01', 19.45),
  ('IN_DEBT_USD_TN', '2026-01-01', 4.25)
ON CONFLICT (metric_id, as_of_date) DO NOTHING;

-- 3. Create View: vw_us_debt_gold_backing
CREATE OR REPLACE VIEW vw_us_debt_gold_backing AS
WITH latest_debt AS (
  SELECT value, as_of_date FROM metric_observations WHERE metric_id = 'UST_DEBT_TOTAL' ORDER BY as_of_date DESC LIMIT 1
),
latest_gold_reserves AS (
  SELECT value FROM metric_observations WHERE metric_id = 'US_TREASURY_GOLD_TONNES' ORDER BY as_of_date DESC LIMIT 1
),
latest_gold_price AS (
  SELECT value FROM metric_observations WHERE metric_id = 'GOLD_PRICE_USD' ORDER BY as_of_date DESC LIMIT 1
)
SELECT 
  d.as_of_date,
  d.value AS total_debt,
  g.value AS gold_tonnes,
  p.value AS gold_price_usd,
  -- 1 tonne = 32150.7466 troy ounces
  g.value * 32150.7466 AS gold_ounces,
  (g.value * 32150.7466 * p.value) AS gold_value_usd,
  d.value / (g.value * 32150.7466 * p.value) AS debt_gold_ratio
FROM latest_debt d
CROSS JOIN latest_gold_reserves g
CROSS JOIN latest_gold_price p;

COMMENT ON VIEW vw_us_debt_gold_backing IS 'US Debt to Gold Backing ratio calculation';
