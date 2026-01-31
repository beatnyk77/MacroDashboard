-- =====================================================
-- US Metrics for Major Economies Table
-- =====================================================
-- Adds US-specific metrics to enable US row in Major Economies overview.
-- Ensures consistency with other country metrics (CN, IN, JP, EU, RU).
-- =====================================================

INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days) VALUES
  -- GDP Metrics
  ('US_GDP_NOMINAL_TN', 'US GDP (Nominal)', 'United States Nominal GDP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'core', 'macro_regime', 'BEA National Accounts', 100),
  ('US_GDP_PPP_TN', 'US GDP (PPP)', 'United States GDP PPP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'secondary', 'macro_regime', 'IMF WEO Estimate', 100),
  ('US_GDP_GROWTH_YOY', 'US GDP Growth', 'United States Real GDP Growth YoY %', 1, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'BEA Real GDP - FRED:A191RL1Q225SBEA', 100),
  
  -- Inflation (CRITICAL FIX: YoY change, not raw index)
  ('US_CPI_YOY', 'US CPI Inflation', 'United States CPI Inflation YoY %', 1, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'FRED: CPIAUCSL YoY % change calculation, NOT raw index level', 35),
  
  -- Policy Rate
  ('US_POLICY_RATE', 'US Federal Funds Rate', 'Federal Funds Effective Rate', 1, 'daily', 'monthly', '%', 'percent', 'core', 'sovereign', 'FRED: FEDFUNDS (Federal Funds Effective Rate)', 35),
  
  -- Debt
  ('US_DEBT_USD_TN', 'US Total Public Debt', 'Total US Public Debt Outstanding in USD Trillions', 2, 'daily', 'monthly', 'USD tn', 'trillion USD', 'core', 'sovereign', 'US Treasury FiscalData (converted to trillions)', 35),
  
  -- Demographics
  ('US_DEPENDENCY_RATIO', 'US Dependency Ratio', 'Old-age dependency ratio (65+ / 15-64)', 3, 'annual', 'annual', '%', 'percent', 'secondary', 'macro_regime', 'World Bank / OECD demographic data', 365),
  
  -- Investment Metrics (GFCF)
  ('US_GFCF_GDP_PCT', 'US Investment % GDP', 'Gross Fixed Capital Formation as % of GDP', 1, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'BEA Fixed Investment / GDP ratio', 100),
  ('US_PRIVATE_GFCF_GDP_PCT', 'US Private Investment % GDP', 'Private Gross Fixed Capital Formation as % of GDP', 1, 'quarterly', 'quarterly', '%', 'percent', 'secondary', 'macro_regime', 'BEA Private Fixed Investment / GDP', 100)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_id = EXCLUDED.source_id,
  methodology_note = EXCLUDED.methodology_note,
  expected_interval_days = EXCLUDED.expected_interval_days;
