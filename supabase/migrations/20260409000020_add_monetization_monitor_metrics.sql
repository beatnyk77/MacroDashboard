-- =====================================================
-- Fed Monetization Monitor — Additional FRED Metrics
-- =====================================================

DO $$
DECLARE
    fred_source_id integer;
BEGIN
    SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';

    -- Federal Reserve Holdings of U.S. Treasury Securities
    -- FRED Series: TREAST
    -- Units: Millions of USD
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('FED_TREASURY_HOLDINGS', 'Fed Holdings of US Treasuries', 'U.S. Treasury Securities Held by Federal Reserve (FRED: TREAST)', fred_source_id, 'weekly', 'weekly', 'USD mn', 'million USD', 'core', 'liquidity', 'FRED TREAST weekly values. Securities held outright.', 7, '{"fred_id": "TREAST"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id,
      metadata = EXCLUDED.metadata;

    -- Federal Debt Held by the Public
    -- FRED Series: FDHBPIN
    -- Units: Billions of Dollars
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('US_DEBT_HELD_BY_PUBLIC', 'Federal Debt Held by Public', 'Federal Debt Held by the Public (FRED: FDHBPIN)', fred_source_id, 'quarterly', 'quarterly', 'USD bn', 'billion USD', 'core', 'sovereign', 'FRED FDHBPIN.', 90, '{"fred_id": "FDHBPIN"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id,
      metadata = EXCLUDED.metadata;

    -- Consumer Price Index for All Urban Consumers
    -- FRED Series: CPIAUCSL (Note: using CPIAUCSL instead of CPIAUCSN for seasonally adjusted)
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('US_CPI_INDEX', 'US CPI Index', 'Consumer Price Index for All Urban Consumers (FRED: CPIAUCSL)', fred_source_id, 'monthly', 'monthly', 'Index', 'index', 'core', 'inflation_regime', 'FRED CPIAUCSL SA.', 30, '{"fred_id": "CPIAUCSL"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id,
      metadata = EXCLUDED.metadata;

    -- 10-Year TIPS Real Yield
    -- FRED Series: DFII10
    -- Units: Percent
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('US_TIPS_10Y_YIELD', '10-Year TIPS Real Yield', 'Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on Investment Basis, Inflation-Indexed (FRED: DFII10)', fred_source_id, 'daily', 'daily', '%', 'percent', 'core', 'inflation_regime', 'FRED DFII10.', 2, '{"fred_id": "DFII10"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      source_id = EXCLUDED.source_id,
      metadata = EXCLUDED.metadata;

END $$;
