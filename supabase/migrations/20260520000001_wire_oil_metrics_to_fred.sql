-- ============================================================
-- Fix: Wire oil energy metrics to FRED series IDs
-- so ingest-fred picks them up daily.
-- 
-- WCRFPUS2  = Weekly U.S. Refinery Utilization (% of operable capacity)
-- WCRSTUS1  = Weekly U.S. Ending Stocks of Crude Oil in SPR (Thousand Barrels)
-- ============================================================

UPDATE public.metrics
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{fred_id}',
        '"WCRFPUS2"'
    ),
    is_active = true,
    updated_at = now()
WHERE id = 'OIL_REFINERY_UTILIZATION_US';

UPDATE public.metrics
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{fred_id}',
        '"WCRSTUS1"'
    ),
    is_active = true,
    updated_at = now()
WHERE id = 'OIL_SPR_LEVEL_US';

-- Note: OIL_REFINING_CAPACITY_US is annual data — sourced from ingest-oil-eia
-- directly, not FRED. Leave it as is but ensure it exists.
INSERT INTO public.metrics (id, name, description, category, source_id, display_frequency, is_active, metadata)
SELECT
    'OIL_REFINERY_UTILIZATION_US',
    'US Refinery Utilization Rate',
    'Weekly U.S. operable refinery utilization rate (% of capacity)',
    'energy',
    (SELECT id FROM public.data_sources WHERE name = 'FRED' LIMIT 1),
    'weekly',
    true,
    '{"fred_id": "WCRFPUS2"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.metrics WHERE id = 'OIL_REFINERY_UTILIZATION_US');

INSERT INTO public.metrics (id, name, description, category, source_id, display_frequency, is_active, metadata)
SELECT
    'OIL_SPR_LEVEL_US',
    'US Strategic Petroleum Reserve Level',
    'Weekly U.S. crude oil stocks in the Strategic Petroleum Reserve (thousand barrels)',
    'energy',
    (SELECT id FROM public.data_sources WHERE name = 'FRED' LIMIT 1),
    'weekly',
    true,
    '{"fred_id": "WCRSTUS1"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.metrics WHERE id = 'OIL_SPR_LEVEL_US');
