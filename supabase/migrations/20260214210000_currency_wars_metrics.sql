-- Add metadata for Currency Wars metrics
INSERT INTO metrics (id, name, unit, description, native_frequency, display_frequency, expected_interval_days, category)
VALUES 
('USD_INR_RATE', 'USD/INR Spot rate', 'index', 'US Dollar to Indian Rupee exchange rate', 'daily', 'daily', 1, 'capital_flows'),
('POLICY_DIVERGENCE_INDEX', 'Policy Divergence Index', 'bps', 'Differential between Fed Funds Rate and RBI Repo Rate', 'daily', 'daily', 1, 'liquidity'),
('RUPEE_PRESSURE_SCORE', 'Rupee Pressure Score', 'index', 'Composite index of capital flows and FX movement', 'daily', 'daily', 1, 'capital_flows'),
('FLOW_TENSION_INDEX', 'Flow Tension Index', 'index', 'Scale of FII flow tension across segments', 'daily', 'daily', 1, 'capital_flows')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  native_frequency = EXCLUDED.native_frequency,
  display_frequency = EXCLUDED.display_frequency,
  expected_interval_days = EXCLUDED.expected_interval_days,
  category = EXCLUDED.category;
