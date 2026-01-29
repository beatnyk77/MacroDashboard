-- =====================================================
-- China Macro Pulse Metrics Seeding
-- Adds high-frequency activity indicators for China
-- =====================================================

INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days) VALUES
  ('CN_PPI_YOY', 'China PPI', 'China Producer Price Index YoY %', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'National Bureau of Statistics', 35),
  ('CN_FAI_YOY', 'China Fixed Asset Inv', 'China Fixed Asset Investment YoY % (YTD)', 3, 'monthly', 'monthly', '%', 'percent', 'secondary', 'macro_regime', 'National Bureau of Statistics', 35),
  ('CN_IP_YOY', 'China Industrial Prod', 'China Industrial Production YoY %', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'National Bureau of Statistics', 35),
  ('CN_RETAIL_SALES_YOY', 'China Retail Sales', 'China Retail Sales YoY %', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'National Bureau of Statistics', 35),
  ('CN_CREDIT_IMPULSE', 'China Credit Impulse', 'China Credit Impulse (Bloomberg Proxy) % GDP', 3, 'monthly', 'monthly', '%', '% of GDP', 'core', 'liquidity', 'Change in new credit as % of GDP', 35)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_id = EXCLUDED.source_id,
  methodology_note = EXCLUDED.methodology_note;
