-- Schedule quarterly GMD supplement ingestion (1st day of quarter at 04:00 UTC)
-- Triggers consolidated ingest-country-metrics Edge Function with ?supplement=gmd
-- This consolidation avoids hitting Supabase project function limits.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-country-gmd-supplement-quarterly') THEN
    PERFORM cron.unschedule('ingest-country-gmd-supplement-quarterly');
  END IF;
END $$;

SELECT cron.schedule(
  'ingest-country-gmd-supplement-quarterly',
  '0 4 1 1,4,7,10 *',
  $$
    SELECT net.http_post(
      'https://ohefbbvldkoflrcjixow.functions.supabase.co/ingest-country-metrics?supplement=gmd',
      '{}'::jsonb,
      '{"Authorization": "Bearer '' || current_setting(''app.settings.service_role_key'') || ''", "Content-Type": "application/json"}'::jsonb
    )
  $$
);

-- Cleanup legacy debugging jobs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-country-gmd-supplement-quarterly-2026-04') THEN
    PERFORM cron.unschedule('ingest-country-gmd-supplement-quarterly-2026-04');
  END IF;
END $$;
