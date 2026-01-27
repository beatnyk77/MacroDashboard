-- =====================================================
-- BRICS Metrics Seeding
-- =====================================================

INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days) VALUES
  (
    'BRICS_USD_RESERVE_SHARE_PCT', 
    'BRICS+ USD Reserve Share', 
    'USD as % of allocated FX reserves for BRICS+ countries', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    '%', 
    'percent', 
    'core', 
    'de_dollarization', 
    'Weighted aggregate of BRICS+ USD reserve share from IMF COFER/member reports.', 
    120
  ),
  (
    'BRICS_GOLD_HOLDINGS_TONNES', 
    'BRICS+ Gold Holdings', 
    'Aggregate gold holdings for BRICS+ countries in metric tonnes', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    'Tonnes', 
    'tonnes', 
    'core', 
    'de_dollarization', 
    'Sum of official gold holdings for BRICS+ members.', 
    120
  ),
  (
    'BRICS_GOLD_SHARE_PCT', 
    'BRICS+ Gold Share (%)', 
    'Gold as % of total reserves for BRICS+ countries', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    '%', 
    'percent', 
    'core', 
    'de_dollarization', 
    'Gold value as percentage of total BRICS+ reserves.', 
    120
  ),
  (
    'BRICS_GDP_PPP_TN', 
    'BRICS+ GDP (PPP)', 
    'Aggregate GDP (PPP) for BRICS+ in USD trillions', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    'USD tn', 
    'trillion USD', 
    'secondary', 
    'macro_regime', 
    'Aggregate GDP adjusted for purchasing power parity.', 
    120
  ),
  (
    'BRICS_DEBT_GDP_PCT', 
    'BRICS+ Debt/GDP', 
    'Weighted average gross debt as % of GDP for BRICS+ countries', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    '%', 
    'percent', 
    'secondary', 
    'sovereign', 
    'Weighted by GDP.', 
    120
  ),
  (
    'BRICS_INFLATION_YOY', 
    'BRICS+ Inflation (YoY)', 
    'Weighted average CPI Inflation YoY % for BRICS+ countries', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'monthly', 
    'monthly', 
    '%', 
    'percent', 
    'core', 
    'macro_regime', 
    'Consumer Price Index change year-over-year.', 
    120
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  expected_interval_days = EXCLUDED.expected_interval_days,
  category = EXCLUDED.category;
