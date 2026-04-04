-- Migration: Add Enhanced Currency Wars Metrics (Fixed)
-- Purpose: Register corrected metrics for EM currency comparisons, with valid columns and categories.

-- Select the FRED source ID dynamically
DO $$
DECLARE
    fred_id integer;
BEGIN
    SELECT id INTO fred_id FROM data_sources WHERE name = 'FRED';
    
    -- EM Currency Rates (from FRED DEX series)
    INSERT INTO metrics (id, name, unit, description, native_frequency, display_frequency, expected_interval_days, category, source_id) VALUES
    ('USD_CNY_RATE', 'USD/CNY Spot Rate', 'index', 'US Dollar to Chinese Yuan exchange rate', 'daily', 'daily', 1, 'capital_flows', fred_id),
    ('USD_BRL_RATE', 'USD/BRL Spot Rate', 'index', 'US Dollar to Brazilian Real exchange rate', 'daily', 'daily', 1, 'capital_flows', fred_id),
    ('USD_MXN_RATE', 'USD/MXN Spot Rate', 'index', 'US Dollar to Mexican Peso exchange rate', 'daily', 'daily', 1, 'capital_flows', fred_id),
    ('USD_TWD_RATE', 'USD/TWD Spot Rate', 'index', 'US Dollar to Taiwan New Dollar exchange rate', 'daily', 'daily', 1, 'capital_flows', fred_id),
    ('USD_INR_RATE', 'Indian Rupee to US Dollar Spot Rate', 'index', 'Indian Rupee to US Dollar exchange rate (FRED: EXINUS)', 'daily', 'daily', 1, 'capital_flows', fred_id),
    ('FED_FUNDS_RATE', 'Effective Federal Funds Rate', 'percent', 'Interest rate at which depository institutions trade federal funds (FRED: FEDFUNDS)', 'daily', 'daily', 1, 'liquidity', fred_id),
    ('IN_REPO_RATE', 'RBI Policy Repo Rate', 'percent', 'Immediate Rates (< 24 Hours): Central Bank Rates: Total for India (FRED: IRSTCB01INM156N)', 'daily', 'daily', 1, 'liquidity', fred_id)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      unit = EXCLUDED.unit,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id;

    -- Enhanced Composite Pressure Index (0-100 scale)
    INSERT INTO metrics (id, name, unit, description, native_frequency, display_frequency, expected_interval_days, category) VALUES
    ('COMPOSITE_PRESSURE_INDEX', 'Composite Rupee Pressure Index', 'index', 'Weighted composite (0-100) of FII/DII flows, INR volatility, and EM relative weakness.', 'daily', 'daily', 1, 'capital_flows'),
    ('EM_RELATIVE_PRESSURE', 'EM Relative Pressure', 'bps', 'USD/INR percentage change minus EM peer average change. Positive = INR underperforming peers', 'daily', 'daily', 1, 'capital_flows'),
    ('POLICY_DIVERGENCE_INDEX', 'Fed-RBI Policy Divergence', 'bps', 'Spread between Fed Funds Rate and RBI Repo Rate in basis points', 'daily', 'daily', 1, 'liquidity')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      unit = EXCLUDED.unit,
      description = EXCLUDED.description,
      category = EXCLUDED.category;
END $$;
