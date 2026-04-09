-- =====================================================
-- Fed Monetization Monitor — Finalize Consolidation
-- =====================================================

DO $$
DECLARE
    fred_source_id integer;
BEGIN
    SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';

    -- US_DGS10 - Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on Investment Basis
    -- Units: Percent
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('US_DGS10', '10-Year Treasury Yield', 'Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity (FRED: DGS10)', fred_source_id, 'daily', 'daily', '%', 'percent', 'core', 'yield_curve', 'FRED DGS10.', 2, '{"fred_id": "DGS10"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id,
      metadata = EXCLUDED.metadata;

    -- Map US_M2 back to M2SL explicitly (just in case)
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('US_M2', 'US M2 Money Supply', 'US M2 Money Stock (FRED: M2SL)', fred_source_id, 'weekly', 'weekly', 'USD bn', 'billion USD', 'core', 'macro_regime', 'FRED M2SL — seasonally adjusted.', 7, '{"fred_id": "M2SL"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      metadata = EXCLUDED.metadata;

END $$;
