-- Stale-data audit 2026-10-26: ingest-central-banks upserts these FRED series, but they were
-- never registered in `metrics`, so every batch failed metric_observations_metric_id_fkey
-- (56 of 64 runs since Aug) and the registered metrics in the same run went stale too.

DO $$
DECLARE
  fred_source_id INTEGER;
BEGIN
  SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';

  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days, metadata) VALUES
    ('FX_EUR_USD', 'EUR/USD Exchange Rate', 'U.S. dollars to one euro, noon buying rate (FRED: DEXUSEU)', fred_source_id, 'daily', 'daily', 'USD', '$/€', 'secondary', 'funding', 5, '{"fred_id": "DEXUSEU"}'),
    ('FX_USD_JPY', 'USD/JPY Exchange Rate', 'Japanese yen to one U.S. dollar, noon buying rate (FRED: DEXJPUS)', fred_source_id, 'daily', 'daily', 'JPY', '¥/$', 'secondary', 'funding', 5, '{"fred_id": "DEXJPUS"}'),
    ('FX_GBP_USD', 'GBP/USD Exchange Rate', 'U.S. dollars to one British pound, noon buying rate (FRED: DEXUSUK)', fred_source_id, 'daily', 'daily', 'USD', '$/£', 'secondary', 'funding', 5, '{"fred_id": "DEXUSUK"}'),
    ('FX_USD_CNY', 'USD/CNY Exchange Rate', 'Chinese yuan to one U.S. dollar, noon buying rate (FRED: DEXCHUS)', fred_source_id, 'daily', 'daily', 'CNY', '¥/$', 'secondary', 'funding', 5, '{"fred_id": "DEXCHUS"}'),
    ('BOE_TOTAL_ASSETS_MN_GBP', 'Bank of England Total Assets', 'Bank of England total assets, millions of GBP (FRED: BOESITL)', fred_source_id, 'weekly', 'weekly', 'GBP mn', 'millions GBP', 'secondary', 'liquidity', 10, '{"fred_id": "BOESITL"}'),
    ('GLOBAL_NET_LIQUIDITY_USD_TR', 'G4 Central Bank Liquidity (USD)', 'Fed net liquidity (WALCL - RRP - TGA) plus ECB, BOJ and BOE balance sheets in USD trillions; written only when every input is a real observation', fred_source_id, 'weekly', 'weekly', 'USD tn', 'tn USD', 'secondary', 'liquidity', 10, '{"inputs": ["WALCL", "RRPONTSYD", "WTREGEN", "ECB_TOTAL_ASSETS_MEUR", "BOJ_TOTAL_ASSETS_TRJPY", "BOE_TOTAL_ASSETS_MN_GBP", "FX_EUR_USD", "FX_USD_JPY", "FX_GBP_USD"]}')
  ON CONFLICT (id) DO NOTHING;
END $$;
