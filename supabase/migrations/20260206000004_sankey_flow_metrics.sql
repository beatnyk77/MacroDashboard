-- =====================================================
-- Sankey Flow Metrics Migration
-- =====================================================
-- This migration registers all metrics for the Sankey Flow visualization
-- Data sources: FRED (primary), IMF BOP API (balance of payments)
-- Note: Some metrics use public API proxies instead of paid institutional sources

-- 1. Register Data Sources
INSERT INTO data_sources (name, api_endpoint, auth_type, metadata) VALUES
  ('FRED', 'https://api.stlouisfed.org/fred', 'api_key', '{"update_frequency": "daily", "note": "Federal Reserve Economic Data"}'),
  ('IMF_BOP_API', 'https://www.imf.org/external/datamapper/api/v1', 'none', '{"update_frequency": "quarterly", "note": "Balance of Payments Statistics"}')
ON CONFLICT (name) DO NOTHING;

-- 2. Expand Metrics Category Enum/Constraint
ALTER TABLE metrics DROP CONSTRAINT IF EXISTS metrics_category_check;
ALTER TABLE metrics ADD CONSTRAINT metrics_category_check CHECK (
  category = ANY (ARRAY[
    'liquidity', 'valuation', 'funding', 'de_dollarization', 'sovereign', 'macro_regime',
    'capital_flows', 'inflation_regime', 'balance_of_payments', 'housing_cycle', 'activity_regime', 'labor_market'
  ])
);

-- 3. Seed Sankey Flow Metrics
DO $$
DECLARE
  fred_source_id INTEGER;
  imf_source_id INTEGER;
  computed_source_id INTEGER;
BEGIN
  SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';
  SELECT id INTO imf_source_id FROM data_sources WHERE name = 'IMF_BOP_API';
  
  -- Get or create computed source for derived metrics
  INSERT INTO data_sources (name, api_endpoint, auth_type, metadata) VALUES
    ('COMPUTED', 'internal', 'none', '{"note": "Computed/derived metrics from other sources"}')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO computed_source_id FROM data_sources WHERE name = 'COMPUTED';

  -- ==========================================
  -- CAPITAL FLOWS / ETF FLOWS (Category 1)
  -- ==========================================
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    -- Source Nodes
    ('CAPITAL_FROM_TREASURIES_BN', 'Capital from US Treasuries', 'Net foreign holdings of US Treasury securities (FRED: FDHBFRBN)', fred_source_id, 'monthly', 'monthly', 'billions_usd', '$B', 'core', 'capital_flows', 35),
    ('CAPITAL_FROM_EM_DEBT_BN', 'Capital from EM Debt', 'Estimated flows into emerging market debt (proxy via bond fund flows)', fred_source_id, 'monthly', 'monthly', 'billions_usd', '$B', 'core', 'capital_flows', 35),
    ('CAPITAL_FROM_GOLD_ETF_BN', 'Capital from Gold ETFs', 'Estimated gold ETF inflows (GLD + IAU AUM change proxy)', fred_source_id, 'monthly', 'monthly', 'billions_usd', '$B', 'core', 'capital_flows', 35),
    ('CAPITAL_FROM_EQUITY_ETF_BN', 'Capital from Equity ETFs', 'Equity fund flows (FRED proxy: WLODLL scaled)', fred_source_id, 'monthly', 'monthly', 'billions_usd', '$B', 'core', 'capital_flows', 35),
    
    -- Sink Nodes
    ('FLOW_TO_RISK_ASSETS', 'Flow to Risk Assets', 'Aggregate capital flows to risk assets (equities, EM debt)', computed_source_id, 'monthly', 'monthly', 'billions_usd', '$B', 'core', 'capital_flows', 35),
    ('FLOW_TO_SAFE_HAVENS', 'Flow to Safe Havens', 'Aggregate capital flows to safe havens (treasuries, gold)', computed_source_id, 'monthly', 'monthly', 'billions_usd', '$B', 'core', 'capital_flows', 35),
    
    -- Flow Links
    ('FLOW_TREASURIES_TO_SAFE_HAVEN', 'Flow: Treasuries → Safe Haven', 'Magnitude of treasury flows to safe haven bucket', computed_source_id, 'monthly', 'monthly', 'billions_usd', '$B', 'core', 'capital_flows', 35),
    ('FLOW_EQUITY_TO_RISK_ASSETS', 'Flow: Equity → Risk Assets', 'Magnitude of equity flows to risk asset bucket', computed_source_id, 'monthly', 'monthly', 'billions_usd', '$B', 'core', 'capital_flows', 35)

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

  -- ==========================================
  -- INFLATION REGIME (Category 2)
  -- ==========================================
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    -- Source Nodes
    ('INFLATION_HEADLINE_YOY', 'Headline Inflation YoY', 'CPI All Items Year-over-Year (FRED: CPIAUCSL)', fred_source_id, 'monthly', 'monthly', 'percent', '%', 'core', 'inflation_regime', 35),
    ('INFLATION_CORE_YOY', 'Core Inflation YoY', 'Core CPI Year-over-Year (FRED: CPILFESL)', fred_source_id, 'monthly', 'monthly', 'percent', '%', 'core', 'inflation_regime', 35),
    ('INFLATION_BREAKEVEN_5Y', '5-Year Inflation Breakeven', '5-Year Treasury Inflation-Indexed Security Breakeven (FRED: T5YIFR)', fred_source_id, 'daily', 'monthly', 'percent', '%', 'core', 'inflation_regime', 7),
    ('INFLATION_EXPECTATIONS_UM', 'Inflation Expectations (UMich)', 'University of Michigan Inflation Expectations (FRED: MICH)', fred_source_id, 'monthly', 'monthly', 'percent', '%', 'core', 'inflation_regime', 35),
    
    -- Sink Node
    ('INFLATION_REGIME_SCORE', 'Inflation Regime Score', 'Composite inflation regime classification (0=low, 100=high)', computed_source_id, 'monthly', 'monthly', 'index', 'Score (0-100)', 'core', 'inflation_regime', 35),
    
    -- Flow Links
    ('FLOW_HEADLINE_TO_REGIME', 'Flow: Headline → Regime', 'Headline inflation component contribution', computed_source_id, 'monthly', 'monthly', 'percent', '%', 'core', 'inflation_regime', 35),
    ('FLOW_CORE_TO_REGIME', 'Flow: Core → Regime', 'Core inflation component contribution', computed_source_id, 'monthly', 'monthly', 'percent', '%', 'core', 'inflation_regime', 35)

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

  -- ==========================================
  -- BALANCE OF PAYMENTS / EXTERNAL VULNERABILITY (Category 3)
  -- ==========================================
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    -- Source Nodes
    ('BOP_CURRENT_ACCOUNT_GDP', 'Current Account / GDP', 'Current account balance as % of GDP (FRED: BOPGSTB)', fred_source_id, 'quarterly', 'quarterly', 'percent', '% of GDP', 'core', 'balance_of_payments', 95),
    ('BOP_RESERVES_MONTHS', 'Reserve Coverage (Months)', 'Foreign exchange reserves in months of imports', imf_source_id, 'quarterly', 'quarterly', 'months', 'Months', 'core', 'balance_of_payments', 95),
    ('BOP_SHORT_TERM_DEBT_GDP', 'Short-term Debt / GDP', 'Short-term external debt as % of GDP', imf_source_id, 'quarterly', 'quarterly', 'percent', '% of GDP', 'core', 'balance_of_payments', 95),
    
    -- Sink Node
    ('BOP_VULNERABILITY_SCORE', 'BOP Vulnerability Score', 'External vulnerability index (0=resilient, 100=vulnerable)', computed_source_id, 'quarterly', 'quarterly', 'index', 'Score (0-100)', 'core', 'balance_of_payments', 95)

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

  -- ==========================================
  -- HOUSING CYCLE (Category 4)
  -- ==========================================
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    -- Source Nodes
    ('HOUSING_PRICE_INDEX', 'Housing Price Index', 'S&P/Case-Shiller US National Home Price Index (FRED: CSUSHPISA)', fred_source_id, 'monthly', 'monthly', 'index', 'Index', 'core', 'housing_cycle', 35),
    ('HOUSING_MEDIAN_INCOME_RATIO', 'House Price / Income Ratio', 'Median home price to median income ratio proxy (FRED: MSPUS)', fred_source_id, 'quarterly', 'quarterly', 'ratio', 'Ratio', 'core', 'housing_cycle', 95),
    ('HOUSING_MORTGAGE_RATE_30Y', '30-Year Mortgage Rate', '30-year fixed-rate mortgage average (FRED: MORTGAGE30US)', fred_source_id, 'weekly', 'monthly', 'percent', '%', 'core', 'housing_cycle', 7),
    
    -- Sink Node
    ('HOUSING_REGIME_SCORE', 'Housing Regime Score', 'Housing cycle stress index (0=cool, 100=stressed)', computed_source_id, 'monthly', 'monthly', 'index', 'Score (0-100)', 'core', 'housing_cycle', 35),
    
    -- Flow Link
    ('FLOW_MORTGAGE_TO_HOUSING', 'Flow: Mortgage Rate → Housing', 'Mortgage rate impact on housing regime', computed_source_id, 'monthly', 'monthly', 'percent', '%', 'core', 'housing_cycle', 35)

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

  -- ==========================================
  -- GLOBAL PMI / ACTIVITY HEATMAP (Category 5)
  -- ==========================================
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    -- Source Nodes
    ('PMI_US_MFG', 'US Manufacturing PMI Proxy', 'ISM Manufacturing PMI proxy (FRED: MANEMP)', fred_source_id, 'monthly', 'monthly', 'index', 'Index', 'core', 'activity_regime', 35),
    ('PMI_US_SERVICES', 'US Services PMI Proxy', 'US Services PMI proxy via Leading Index (FRED: USSLIND)', fred_source_id, 'monthly', 'monthly', 'index', 'Index', 'core', 'activity_regime', 35),
    ('PMI_EA_COMPOSITE_PROXY', 'Euro Area Composite PMI Proxy', 'Euro Area PMI approximation (mock data)', computed_source_id, 'monthly', 'monthly', 'index', 'Index', 'core', 'activity_regime', 35),
    
    -- Sink Node
    ('ACTIVITY_REGIME_SCORE', 'Activity Regime Score', 'Global economic activity index (0=contraction, 100=expansion)', computed_source_id, 'monthly', 'monthly', 'index', 'Score (0-100)', 'core', 'activity_regime', 35)

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

  -- ==========================================
  -- LABOR MARKET TIGHTNESS (Category 6)
  -- ==========================================
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    -- Source Nodes
    ('LABOR_VACANCIES_JOLTS', 'Job Vacancies (JOLTS)', 'Job Openings in millions (FRED: JTSJOL)', fred_source_id, 'monthly', 'monthly', 'millions', 'M', 'core', 'labor_market', 35),
    ('LABOR_UNEMPLOYMENT_RATE', 'Unemployment Rate', 'U3 Unemployment Rate (FRED: UNRATE)', fred_source_id, 'monthly', 'monthly', 'percent', '%', 'core', 'labor_market', 35),
    ('LABOR_WAGE_GROWTH_YOY', 'Wage Growth YoY', 'Average hourly earnings YoY (FRED: CES0500000003)', fred_source_id, 'monthly', 'monthly', 'percent', '%', 'core', 'labor_market', 35),
    
    -- Sink Node
    ('LABOR_TIGHTNESS_SCORE', 'Labor Market Tightness Score', 'V/U ratio-based tightness index (0=slack, 100=tight)', computed_source_id, 'monthly', 'monthly', 'index', 'Score (0-100)', 'core', 'labor_market', 35),
    
    -- Flow Link
    ('FLOW_VACANCIES_TO_TIGHTNESS', 'Flow: Vacancies → Tightness', 'Job vacancy contribution to labor tightness', computed_source_id, 'monthly', 'monthly', 'millions', 'M', 'core', 'labor_market', 35)

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

-- 3. Schedule Cron Job for Daily Ingestion
SELECT cron.schedule(
  'ingest-sankey-flows-daily',
  '15 8 * * *',  -- 8:15 AM UTC daily (offset to avoid conflicts with other jobs)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/ingest-sankey-flows',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
