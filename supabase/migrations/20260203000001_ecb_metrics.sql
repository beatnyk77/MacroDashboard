-- Register ECB metrics
INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata) VALUES
  ('ECB_TOTAL_ASSETS_MEUR', 'ECB Total Assets', 'Total assets of the Eurosystem (consolidated weekly financial statement)', 1, 'weekly', 'weekly', 'EUR mn', 'millions EUR', 'core', 'liquidity', 'Sourced from FRED (ECBTA). Proxy for ECB balance sheet size.', 8, '{"fred_id": "ECBTA"}'),
  ('ECB_MRO_OUTSTANDING_MEUR', 'ECB MRO Outstanding', 'ECB Main Refinancing Operations outstanding', 1, 'weekly', 'weekly', 'EUR mn', 'millions EUR', 'secondary', 'liquidity', 'Sourced from FRED (ECBMROW).', 8, '{"fred_id": "ECBMROW"}'),
  ('ECB_DF_OUTSTANDING_MEUR', 'ECB Deposit Facility', 'ECB Deposit Facility outstanding', 1, 'weekly', 'weekly', 'EUR mn', 'millions EUR', 'secondary', 'liquidity', 'Sourced from FRED (ECBDFW).', 8, '{"fred_id": "ECBDFW"}'),
  ('ECB_EXCESS_LIQUIDITY_MEUR', 'ECB Excess Liquidity', 'Proxy for ECB balance sheet expansion/contraction (Total Assets - Reserves - MRO)', 1, 'weekly', 'weekly', 'EUR mn', 'millions EUR', 'core', 'liquidity', 'Computed as: Total Assets - (Current Account + Deposit Facility). Sourced from FRED proxy (ECBEXLIQ or calculated).', 8, '{"fred_id": "ECBEXLIQ"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  methodology_note = EXCLUDED.methodology_note,
  metadata = EXCLUDED.metadata;
