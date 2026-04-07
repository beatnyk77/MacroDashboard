-- Migration: Schedule daily cron job for country metrics ingestion
-- Runs every day at 03:00 UTC to keep macro data fresh

-- Remove old weekly job if exists (ignore error)
DO $$ BEGIN
  PERFORM cron.unschedule('ingest-country-metrics-weekly');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Schedule daily job
SELECT cron.schedule(
  'ingest-country-metrics-daily',
  '0 3 * * *', -- 3:00 AM UTC daily
  $$
    SELECT net.http_post(
      'https://debdriyzfcwvgrhzzzre.functions.supabase.co/ingest-country-metrics',
      '{}',
      '{"Authorization": "Bearer '' || current_setting(''app.settings.service_role_key'') || ''", "Content-Type": "application/json"}'::jsonb
    )
  $$
);
