-- Migration: Schedule weekly cron job for country metrics ingestion
-- Runs every Sunday at 02:00 UTC to minimize API load while keeping macro data fresh

SELECT cron.schedule(
  'ingest-country-metrics-weekly',
  '0 2 * * 0', -- 2:00 AM UTC every Sunday
  $$
    SELECT net.http_post(
      'https://ohefbbvldkoflrcjixow.functions.supabase.co/ingest-country-metrics',
      '{}',
      '{"Authorization": "Bearer '' || current_setting(''app.settings.service_role_key'') || ''", "Content-Type": "application/json"}'::jsonb
    )
  $$
);
