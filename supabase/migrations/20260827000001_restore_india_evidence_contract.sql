-- Restore the canonical India evidence contract.
--
-- Existing FRED observations were written with provenance='api_live' but
-- without source_ref. The India cockpit intentionally rejects an untraceable
-- observation, so repair the metadata from the metric's verified fred_id.
-- New RBI DBIE credit observations use a dedicated canonical metric below.

DO $$
DECLARE
    fred_source_id INTEGER;
BEGIN
    SELECT id INTO fred_source_id
    FROM public.data_sources
    WHERE name = 'FRED';

    INSERT INTO public.metrics
        (id, name, description, source_id, native_frequency, display_frequency,
         unit, unit_label, tier, category, methodology_note,
         expected_interval_days, metadata)
    VALUES
        (
            'IN_BANK_CREDIT_GROWTH_YOY',
            'India Bank Credit Growth',
            'Year-over-year growth in scheduled commercial bank credit from RBI DBIE BSC1.',
            NULL,
            'monthly',
            'monthly',
            '%',
            'percent',
            'core',
            'macro_regime',
            'RBI DBIE BSC1. Computed from monthly aggregate credit levels using a 12-month lag.',
            45,
            '{"source_dataset":"RBI DBIE BSC1","adapter":"ingest-india-credit-cycle"}'::jsonb
        )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
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

    UPDATE public.metric_observations observation
    SET source_ref = 'live_api:fred:' || (metric.metadata ->> 'fred_id'),
        is_provisional = false
    FROM public.metrics metric
    WHERE metric.id = observation.metric_id
      AND metric.source_id = fred_source_id
      AND metric.metadata ? 'fred_id'
      AND observation.provenance = 'api_live'
      AND NULLIF(observation.source_ref, '') IS NULL;
END
$$;
