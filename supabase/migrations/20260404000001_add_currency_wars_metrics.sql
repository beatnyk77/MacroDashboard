-- Migration: Add Enhanced Currency Wars Metrics
-- Purpose: Register new metrics for EM currency comparisons, composite pressure index, and relative pressure

-- EM Currency Rates (from FRED DEX series)
INSERT INTO metrics (id, name, unit, description, native_frequency, display_frequency, expected_interval_days, category, source, metadata) VALUES
('USD_CNY_RATE', 'USD/CNY Spot Rate', 'index', 'US Dollar to Chinese Yuan exchange rate', 'daily', 'daily', 1, 'capital_flows', 'FRED', '{"fred_id": "DEXCHUS"}'),
('USD_BRL_RATE', 'USD/BRL Spot Rate', 'index', 'US Dollar to Brazilian Real exchange rate', 'daily', 'daily', 1, 'capital_flows', 'FRED', '{"fred_id": "DEXBZUS"}'),
('USD_MXN_RATE', 'USD/MXN Spot Rate', 'index', 'US Dollar to Mexican Peso exchange rate', 'daily', 'daily', 1, 'capital_flows', 'FRED', '{"fred_id": "DEXMXUS"}'),
('USD_TWD_RATE', 'USD/TWD Spot Rate', 'index', 'US Dollar to Taiwan New Dollar exchange rate', 'daily', 'daily', 1, 'capital_flows', 'FRED', '{"fred_id": "DEXTWUS"}'),
('USD_INR_RATE', 'Indian Rupee to US Dollar Spot Rate', 'index', 'Indian Rupee to US Dollar exchange rate (FRED: EXINUS)', 'daily', 'daily', 1, 'capital_flows', 'FRED', '{"fred_id": "EXINUS"}'),
('FED_FUNDS_RATE', 'Effective Federal Funds Rate', 'percent', 'Interest rate at which depository institutions trade federal funds (FRED: FEDFUNDS)', 'daily', 'daily', 1, 'monetary_policy', 'FRED', '{"fred_id": "FEDFUNDS"}'),
('IN_REPO_RATE', 'RBI Policy Repo Rate', 'percent', 'Immediate Rates (< 24 Hours): Central Bank Rates: Total for India (FRED: IRSTCB01INM156N)', 'daily', 'daily', 1, 'monetary_policy', 'FRED', '{"fred_id": "IRSTCB01INM156N"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  metadata = COALESCE(metrics.metadata, '{}'::jsonb) || EXCLUDED.metadata;

-- Enhanced Composite Pressure Index (0-100 scale)
INSERT INTO metrics (id, name, unit, description, native_frequency, display_frequency, expected_interval_days, category) VALUES
('COMPOSITE_PRESSURE_INDEX', 'Composite Rupee Pressure Index', 'index', 'Weighted composite (0-100) of FII/DII flows, INR volatility, and EM relative weakness. Higher values indicate greater pressure on INR and higher likelihood of RBI intervention', 'daily', 'daily', 1, 'capital_flows'),
('EM_RELATIVE_PRESSURE', 'EM Relative Pressure', 'bps', 'USD/INR percentage change minus EM (CNY,BRL,MXN,TWD) average change. Positive = INR underperforming peers', 'daily', 'daily', 1, 'capital_flows'),
('POLICY_DIVERGENCE_INDEX', 'Fed-RBI Policy Divergence', 'bps', 'Spread between Fed Funds Rate and RBI Repo Rate in basis points', 'daily', 'daily', 1, 'monetary_policy')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description;

-- Finalization
COMMENT ON COLUMN metrics.metadata IS 'JSON metadata for external source identifiers (FRED IDs, etc.)';
