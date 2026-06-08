-- ============================================================
-- Migration: fix_brief_cron
-- Date: 2026-06-08
-- Purpose: Fix generate-morning-brief cron.
--   Bug 1: Used current_setting('app.supabase_url') which is not set →
--          ERROR: unrecognized configuration parameter "app.supabase_url"
--   Bug 2: Ran at 05:30 UTC, before compute-daily-macro-signal (06:30 UTC),
--          so briefs were generated from stale signal data.
--   Fix: Hardcode the project URL + vault-based secret (same pattern as all
--        other working crons). Reschedule to 06:45 UTC (15 min after signal).
-- ============================================================

SELECT cron.unschedule('generate-morning-brief');

SELECT cron.schedule(
  'generate-morning-brief',
  '45 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-morning-brief',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);
