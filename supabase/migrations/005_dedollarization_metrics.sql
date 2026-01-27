-- =====================================================
-- De-Dollarization Metrics - IMF COFER Integration
-- =====================================================
-- Adds metrics for tracking global reserve currency composition
-- and gold accumulation trends from IMF COFER data
-- =====================================================

-- Add de-dollarization metrics
INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata) VALUES
  (
    'GLOBAL_USD_SHARE_PCT', 
    'Global USD Reserve Share', 
    'USD as % of allocated global FX reserves (IMF COFER)', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    '%', 
    'percent',
    'core', 
    'de_dollarization', 
    'IMF Currency Composition of Official Foreign Exchange Reserves (COFER). Allocated reserves only. Published quarterly with ~1 quarter lag.',
    90, 
    '{"cofer_series": "USD_SHARE", "data_url": "https://data.imf.org/?sk=E6A5F467-C14B-4AA8-9F6D-5A09EC4E62A4"}'::jsonb
  ),
  (
    'GLOBAL_EUR_SHARE_PCT', 
    'Global EUR Reserve Share', 
    'EUR as % of allocated global FX reserves (IMF COFER)', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    '%', 
    'percent',
    'secondary', 
    'de_dollarization', 
    'IMF COFER EUR share. Includes ECB and EU member state reserves.',
    90, 
    '{"cofer_series": "EUR_SHARE"}'::jsonb
  ),
  (
    'GLOBAL_RMB_SHARE_PCT', 
    'Global RMB Reserve Share', 
    'RMB as % of allocated global FX reserves (IMF COFER)', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    '%', 
    'percent',
    'core', 
    'de_dollarization', 
    'IMF COFER RMB/CNY share. Tracked separately since Q4 2016.',
    90, 
    '{"cofer_series": "RMB_SHARE"}'::jsonb
  ),
  (
    'GLOBAL_OTHER_SHARE_PCT', 
    'Global Other Currencies Share', 
    'Other currencies as % of allocated global FX reserves (IMF COFER)', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    '%', 
    'percent',
    'secondary', 
    'de_dollarization', 
    'IMF COFER other currencies (JPY, GBP, AUD, CAD, CHF, etc.)',
    90, 
    '{"cofer_series": "OTHER_SHARE"}'::jsonb
  ),
  (
    'GLOBAL_GOLD_SHARE_PCT', 
    'Global Gold Reserve Share', 
    'Gold as % of total global reserves (IMF COFER)', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    '%', 
    'percent',
    'core', 
    'de_dollarization', 
    'Gold (including gold deposits and gold swapped) as % of total reserves. IMF COFER data.',
    90, 
    '{"cofer_series": "GOLD_SHARE"}'::jsonb
  ),
  (
    'GLOBAL_GOLD_HOLDINGS_USD', 
    'Global Gold Holdings (USD)', 
    'Total global gold reserves valued in USD billions', 
    (SELECT id FROM data_sources WHERE name = 'IMF'), 
    'quarterly', 
    'quarterly', 
    'USD bn', 
    'billion USD',
    'secondary', 
    'de_dollarization', 
    'Total gold holdings in USD billions. Valued at market prices.',
    90, 
    '{"cofer_series": "GOLD_USD"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE metrics IS 'Canonical metric definitions with frequency and tier classification';
