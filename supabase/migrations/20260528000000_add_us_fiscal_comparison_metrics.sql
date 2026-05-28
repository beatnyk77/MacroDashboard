-- =====================================================
-- US Fiscal Comparison — Metric Definitions
-- =====================================================
-- Adds FRED-sourced metrics needed for the US Defense Spending vs Federal Debt Interest comparison.
-- Series: FDEFX (Defense Spending), A091RC1Q027SBEA (Federal Interest Payments)
-- =====================================================

DO $$
DECLARE
    fred_source_id integer;
BEGIN
    SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';

    -- US Defense Spending (FRED: FDEFX)
    INSERT INTO public.metrics (
        id, name, description, source_id, native_frequency, display_frequency,
        unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata
    ) VALUES (
        'US_DEFENSE_SPENDING',
        'US Defense Spending',
        'National Defense Consumption Expenditures and Gross Investment (FRED: FDEFX)',
        fred_source_id, 'quarterly', 'quarterly',
        'USD bn', 'billion USD', 'core', 'sovereign',
        'FRED series FDEFX: National Defense Consumption Expenditures and Gross Investment. Quarterly seasonally adjusted annual rate (SAAR) in billions of dollars.',
        40,
        '{"fred_id": "FDEFX"}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        source_id = EXCLUDED.source_id,
        native_frequency = EXCLUDED.native_frequency,
        display_frequency = EXCLUDED.display_frequency,
        unit = EXCLUDED.unit,
        unit_label = EXCLUDED.unit_label,
        tier = EXCLUDED.tier,
        category = EXCLUDED.category,
        methodology_note = EXCLUDED.methodology_note,
        expected_interval_days = EXCLUDED.expected_interval_days,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

    -- US Federal Interest Payments (FRED: A091RC1Q027SBEA)
    INSERT INTO public.metrics (
        id, name, description, source_id, native_frequency, display_frequency,
        unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata
    ) VALUES (
        'US_FEDERAL_INTEREST_PAYMENTS',
        'US Federal Interest Payments',
        'Federal government current interest payments (FRED: A091RC1Q027SBEA)',
        fred_source_id, 'quarterly', 'quarterly',
        'USD bn', 'billion USD', 'core', 'sovereign',
        'FRED series A091RC1Q027SBEA: Federal Government Current Interest Payments. Quarterly seasonally adjusted annual rate (SAAR) in billions of dollars.',
        40,
        '{"fred_id": "A091RC1Q027SBEA"}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        source_id = EXCLUDED.source_id,
        native_frequency = EXCLUDED.native_frequency,
        display_frequency = EXCLUDED.display_frequency,
        unit = EXCLUDED.unit,
        unit_label = EXCLUDED.unit_label,
        tier = EXCLUDED.tier,
        category = EXCLUDED.category,
        methodology_note = EXCLUDED.methodology_note,
        expected_interval_days = EXCLUDED.expected_interval_days,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

END $$;
