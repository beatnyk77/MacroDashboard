-- =====================================================
-- Major Economies Metrics Seeding (CN, IN, JP, EU, RU)
-- =====================================================

INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days) VALUES
  -- CHINA (CN)
  ('CN_GDP_NOMINAL_TN', 'China GDP (Nominal)', 'China Nominal GDP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'core', 'macro_regime', 'IMF WEO Estimate', 100),
  ('CN_GDP_PPP_TN', 'China GDP (PPP)', 'China GDP PPP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'secondary', 'macro_regime', 'IMF WEO Estimate', 100),
  ('CN_GDP_GROWTH_YOY', 'China GDP Growth', 'China Real GDP Growth YoY %', 3, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'National Bureau of Statistics', 100),
  ('CN_CPI_YOY', 'China CPI', 'China CPI YoY %', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'National Bureau of Statistics', 35),
  ('CN_POLICY_RATE', 'China Policy Rate', 'PBOC 1-Year Loan Prime Rate (LPR)', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'sovereign', 'PBOC', 35),

  -- INDIA (IN)
  ('IN_GDP_NOMINAL_TN', 'India GDP (Nominal)', 'India Nominal GDP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'core', 'macro_regime', 'IMF WEO Estimate', 100),
  ('IN_GDP_PPP_TN', 'India GDP (PPP)', 'India GDP PPP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'secondary', 'macro_regime', 'IMF WEO Estimate', 100),
  ('IN_GDP_GROWTH_YOY', 'India GDP Growth', 'India Real GDP Growth YoY %', 3, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'MoSPI', 100),
  ('IN_CPI_YOY', 'India CPI', 'India CPI YoY %', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'MoSPI', 35),
  ('IN_POLICY_RATE', 'India Policy Rate', 'RBI Repurchase (Repo) Rate', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'sovereign', 'RBI', 35),

  -- JAPAN (JP)
  ('JP_GDP_NOMINAL_TN', 'Japan GDP (Nominal)', 'Japan Nominal GDP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'core', 'macro_regime', 'IMF WEO Estimate', 100),
  ('JP_GDP_PPP_TN', 'Japan GDP (PPP)', 'Japan GDP PPP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'secondary', 'macro_regime', 'IMF WEO Estimate', 100),
  ('JP_GDP_GROWTH_YOY', 'Japan GDP Growth', 'Japan Real GDP Growth YoY %', 3, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'Cabinet Office', 100),
  ('JP_CPI_YOY', 'Japan CPI', 'Japan CPI YoY %', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'Statistics Bureau', 35),
  ('JP_POLICY_RATE', 'Japan Policy Rate', 'BoJ Policy Rate Balance Rate', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'sovereign', 'BoJ', 35),

  -- EUROZONE (EU)
  ('EU_GDP_NOMINAL_TN', 'Eurozone GDP (Nominal)', 'Euro Area Nominal GDP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'core', 'macro_regime', 'IMF WEO Estimate', 100),
  ('EU_GDP_PPP_TN', 'Eurozone GDP (PPP)', 'Euro Area GDP PPP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'secondary', 'macro_regime', 'IMF WEO Estimate', 100),
  ('EU_GDP_GROWTH_YOY', 'Eurozone GDP Growth', 'Euro Area Real GDP Growth YoY %', 3, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'Eurostat', 100),
  ('EU_CPI_YOY', 'Eurozone CPI', 'Euro Area HICP YoY %', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'Eurostat', 35),
  ('EU_POLICY_RATE', 'Eurozone Policy Rate', 'ECB Deposit Facility Rate', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'sovereign', 'ECB', 35),

  -- RUSSIA (RU)
  ('RU_GDP_NOMINAL_TN', 'Russia GDP (Nominal)', 'Russia Nominal GDP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'core', 'macro_regime', 'IMF WEO Estimate', 100),
  ('RU_GDP_PPP_TN', 'Russia GDP (PPP)', 'Russia GDP PPP in USD Trillions', 3, 'quarterly', 'quarterly', 'USD tn', 'trillion USD', 'secondary', 'macro_regime', 'IMF WEO Estimate', 100),
  ('RU_GDP_GROWTH_YOY', 'Russia GDP Growth', 'Russia Real GDP Growth YoY %', 3, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'Rosstat', 100),
  ('RU_CPI_YOY', 'Russia CPI', 'Russia CPI YoY %', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'Rosstat', 35),
  ('RU_POLICY_RATE', 'Russia Policy Rate', 'CBR Key Rate', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'sovereign', 'CBR', 35)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_id = EXCLUDED.source_id,
  methodology_note = EXCLUDED.methodology_note;
