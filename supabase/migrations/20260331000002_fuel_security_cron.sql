-- =====================================================
-- Migration: Schedule Fuel Security Clock Ingestion
-- Created: 2026-03-31
-- =====================================================
-- Creates a daily pg_cron job to run the
-- ingest-fuel-security-india edge function at 02:00 UTC.
-- =====================================================

-- Enable pg_cron if not already (usually enabled by Supabase)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily ingestion at 02:00 UTC
SELECT cron.schedule(
  'ingest-fuel-security-india-daily',
  '0 2 * * *',  -- 02:00 UTC daily
  $$
  SELECT
    net.http_post(
      url := current_setting('app.edge_function_url') || '/ingest-fuel-security-india',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    )
  $$
);

-- =====================================================
-- Notes
-- =====================================================
-- This job requires the following database settings to be set:
--   app.edge_function_url = 'https://<your-project>.functions.supabase.co'
--   app.service_role_key = '<your_service_role_key>'
--
-- Set them via:
--   SELECT set_config('app.edge_function_url', 'https://your-project.functions.supabase.co', false);
--   SELECT set_config('app.service_role_key', 'your_service_role_key', false);
--
-- Or in Supabase Dashboard → Database → Settings → Application Settings
--
-- To verify the job is scheduled:
--   SELECT * FROM cron.job WHERE command LIKE '%ingest-fuel-security-india%';
--
-- To unschedule (if needed):
--   SELECT cron.unschedule('ingest-fuel-security-india-daily');
-- =====================================================
