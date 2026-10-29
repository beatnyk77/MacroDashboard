-- Energy lab phase 1: US weekly petroleum balance from the EIA API v2 (ingest-eia-weekly).
-- Registers the new series, corrects the cadence of the two existing ones that the same ingest now
-- feeds, and schedules the function around the Wednesday release (10:30 ET = 14:30 UTC in EDT,
-- 15:30 UTC in EST) with a Thursday pass for holiday weeks.
-- One-off backfill (5-year band history): invoke ingest-eia-weekly?backfill=1 once after deploy.

INSERT INTO public.metrics (id, name, description, category, source_id, native_frequency, display_frequency, expected_interval_days, is_active, metadata)
SELECT
    v.id,
    v.name,
    v.description,
    'energy',
    (SELECT id FROM public.data_sources WHERE name = 'EIA' LIMIT 1),
    'weekly',
    'weekly',
    9,
    true,
    v.metadata::jsonb
FROM (VALUES
    ('EIA_WKLY_CRUDE_STOCKS_KBBL',      'US Commercial Crude Stocks (excl. SPR)', 'EIA WPSR ending stocks of crude oil excluding SPR, thousand barrels', '{"series": "WCESTUS1", "unit": "kbbl"}'),
    ('EIA_WKLY_CUSHING_STOCKS_KBBL',    'Cushing, OK Crude Stocks',                'EIA WPSR Cushing, OK ending stocks of crude oil, thousand barrels',      '{"series": "W_EPC0_SAX_YCUOK_MBBL", "unit": "kbbl"}'),
    ('EIA_WKLY_GASOLINE_STOCKS_KBBL',   'US Total Gasoline Stocks',                'EIA WPSR ending stocks of total gasoline, thousand barrels',             '{"series": "WGTSTUS1", "unit": "kbbl"}'),
    ('EIA_WKLY_DISTILLATE_STOCKS_KBBL', 'US Distillate Fuel Oil Stocks',           'EIA WPSR ending stocks of distillate fuel oil, thousand barrels',        '{"series": "WDISTUS1", "unit": "kbbl"}'),
    ('EIA_WKLY_JET_STOCKS_KBBL',        'US Jet Fuel Stocks',                      'EIA WPSR ending stocks of kerosene-type jet fuel, thousand barrels',     '{"series": "WKJSTUS1", "unit": "kbbl"}'),
    ('EIA_WKLY_PRODUCT_SUPPLIED_KBD',   'US Total Product Supplied',               'EIA WPSR product supplied of petroleum products, thousand barrels/day (implied demand)', '{"series": "WRPUPUS2", "unit": "kbd"}'),
    ('EIA_WKLY_CRUDE_PRODUCTION_KBD',   'US Crude Oil Field Production',           'EIA WPSR weekly field production of crude oil, thousand barrels/day',    '{"series": "WCRFPUS2", "unit": "kbd"}'),
    ('EIA_WKLY_CRUDE_NET_IMPORTS_KBD',  'US Crude Oil Net Imports',                'EIA WPSR weekly net imports of crude oil, thousand barrels/day',         '{"series": "WCRNTUS2", "unit": "kbd"}')
) AS v(id, name, description, metadata)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_id = EXCLUDED.source_id,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    expected_interval_days = EXCLUDED.expected_interval_days,
    is_active = true,
    metadata = EXCLUDED.metadata,
    updated_at = now();

-- SPR and refinery utilization are EIA weekly series; refinery utilization was registered as monthly.
UPDATE public.metrics
SET native_frequency = 'weekly', display_frequency = 'weekly', expected_interval_days = 9, updated_at = now()
WHERE id IN ('OIL_SPR_LEVEL_US', 'OIL_REFINERY_UTILIZATION_US');

SELECT cron.schedule(
  'ingest-eia-weekly-release',
  '45 14,15 * * 3,4',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-eia-weekly',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);

SELECT cron.schedule(
  'ingest-eia-weekly-late',
  '0 17 * * 3,4',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-eia-weekly',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);
