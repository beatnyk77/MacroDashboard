-- =====================================================
-- Funding Plumbing Stress Monitor — FRED Metrics Registration
-- Series: WLRRA (SRF), SWPT (FX Swaps), WTREGEN (TGA), RRPONTSYD (RRP)
-- =====================================================

DO $$
DECLARE
    fred_source_id integer;
BEGIN
    SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';

    -- Net Liquidity Buffer: Overnight Reverse Repo (ON RRP)
    -- FRED Series: RRPONTSYD — Daily, Millions of USD
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('REVERSE_REPO_OUTSTANDING', 'Net Liquidity Buffer', 'Overnight Reverse Repo Outstanding Amount (FRED: RRPONTSYD)', fred_source_id, 'daily', 'daily', 'USD mn', 'mn USD', 'core', 'liquidity', 'FRED RRPONTSYD daily values. Represents excess liquidity parked at the Fed.', 2, '{"fred_id": "RRPONTSYD"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      unit_label = EXCLUDED.unit_label,
      metadata = EXCLUDED.metadata;

    -- Fiscal Cash Buffer: Treasury General Account (TGA)
    -- FRED Series: WTREGEN — Weekly Wednesday, Millions of USD
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('TGA_BALANCE', 'Fiscal Cash Buffer', 'Treasury General Account (TGA) Balance (FRED: WTREGEN)', fred_source_id, 'weekly', 'weekly', 'USD mn', 'mn USD', 'core', 'liquidity', 'FRED WTREGEN weekly Wednesday values. The Treasury’s operating account at the Fed.', 7, '{"fred_id": "WTREGEN"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      unit_label = EXCLUDED.unit_label,
      metadata = EXCLUDED.metadata;

    -- Domestic Funding Stress: Standing Repo Facility (SRF)
    -- FRED Series: WLRRA — Weekly Wednesday, Millions of USD
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('SRF_USAGE', 'Domestic Funding Stress', 'Standing Repo Facility (SRF) Usage (FRED: WLRRA)', fred_source_id, 'weekly', 'weekly', 'USD mn', 'mn USD', 'core', 'liquidity', 'FRED WLRRA weekly Wednesday values. Assets: Other: Repurchase Agreements. Captures domestic liquidity injections via SRF.', 7, '{"fred_id": "WLRRA"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      unit_label = EXCLUDED.unit_label,
      metadata = EXCLUDED.metadata;

    -- Offshore Dollar Gap: Central Bank FX Liquidity Swaps
    -- FRED Series: SWPT — Weekly Wednesday, Millions of USD
    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
    VALUES
      ('FX_SWAP_LINES', 'Offshore Dollar Gap', 'Central Bank FX Liquidity Swaps (FRED: SWPT)', fred_source_id, 'weekly', 'weekly', 'USD mn', 'mn USD', 'core', 'liquidity', 'FRED SWPT weekly Wednesday values. Captures offshore dollar demand via central bank swap lines.', 7, '{"fred_id": "SWPT"}')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      unit_label = EXCLUDED.unit_label,
      metadata = EXCLUDED.metadata;

END $$;
