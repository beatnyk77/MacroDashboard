-- ============================================================
-- Migration: brief_cron
-- Date: 2026-06-07
-- Purpose: Unschedule old morning brief cron and reschedule at 05:30 UTC daily using environment settings.
-- ============================================================

-- 1. Unschedule old cron if it exists (idempotent check)
DO $$ BEGIN
    PERFORM cron.unschedule('generate-morning-brief');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No existing generate-morning-brief cron to remove';
END $$;

-- 2. Schedule daily morning brief at 05:30 UTC
SELECT cron.schedule(
  'generate-morning-brief',
  '30 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') 
           || '/functions/v1/generate-morning-brief',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' 
        || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
