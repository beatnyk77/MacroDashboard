-- =====================================================
-- Fed Monetization Monitor — FRED Metrics Registration
-- Purpose: Register WALCL, M2SL, and T10YIE series for ingestion
-- These series are fetched by the existing ingest-us-macro process
-- via metdata.fred_id filtering. No new ingestion code required.
-- =====================================================

DO $$
DECLARE
    fred_source_id integer;
BEGIN
    SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';

    -- Federal Reserve Balance Sheet (Total Assets)
    -- FRED Series: WALCL — Weekly Thursday snapshot, billions USD
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('FED_BALANCE_SHEET', 'Federal Reserve Balance Sheet', 'Total assets of the Federal Reserve System (FRED: WALCL)', fred_source_id, 'weekly', 'weekly', 'USD bn', 'billion USD', 'core', 'liquidity', 'FRED WALCL weekly Thursday values. Sum of all Fed assets.', 7, '{"fred_id": "WALCL"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id,
      metadata = EXCLUDED.metadata;

    -- M2 Money Supply (broad monetary aggregate)
    -- FRED Series: M2SL — Seasonally Adjusted M2, billions USD
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('US_M2', 'US M2 Money Supply', 'US M2 Money Stock (FRED: M2SL)', fred_source_id, 'weekly', 'weekly', 'USD bn', 'billion USD', 'core', 'macro_regime', 'FRED M2SL — seasonally adjusted M2 money supply in billions of dollars.', 7, '{"fred_id": "M2SL"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id,
      metadata = EXCLUDED.metadata;

    -- 10-Year Treasury Inflation-Indexed Security Yield
    -- FRED Series: T10YIE — Real yield (break-even inflation subtracted)
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('TIPS_10Y_YIELD', '10-Year TIPS Real Yield', '10-Year Treasury Inflation-Indexed Security Yield (FRED: T10YIE)', fred_source_id, 'daily', 'daily', '%', 'percent', 'core', 'inflation_regime', 'FRED T10YIE: constant maturity yield on TIPS securities — represents real (inflation-adjusted) Treasury borrowing cost.', 2, '{"fred_id": "T10YIE"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id,
      metadata = EXCLUDED.metadata;
END $$;

-- Optional: Trigger immediate refresh via cron? No — us-macro runs on its schedule.
-- These rows will be picked up on next ingest-us-macro run (daily via pg_cron).
