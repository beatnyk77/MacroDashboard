-- Migration: Fix Vault Key JSON Injection in Cron Jobs
-- Date: 2026-06-09
--
-- Issue: Several cron jobs concatenate vault.service_role_key or vault.decrypted_secrets
-- directly into JSON strings, which breaks JSON parsing if the key contains special
-- characters like quotes or braces.
--
-- Solution: Use jsonb_build_object() to safely construct JSON headers instead of
-- string concatenation + ::jsonb cast.
--
-- Affected jobs:
-- 1. ingest-india-macro-snapshot-job
-- 2. ingest-africa-macro-pulse-job
-- 3. generate-weekly-regime-digest-job
-- 4. send-weekly-digest-job

BEGIN;

-- Drop all affected cron jobs
SELECT cron.unschedule('ingest-india-macro-snapshot-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-india-macro-snapshot-job');

SELECT cron.unschedule('ingest-africa-macro-pulse-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-africa-macro-pulse-job');

SELECT cron.unschedule('generate-weekly-regime-digest-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-weekly-regime-digest-job');

SELECT cron.unschedule('send-weekly-digest-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-digest-job');

-- Re-schedule ingest-india-macro-snapshot-job with safe JSON construction
-- 4th of every month at midnight UTC
SELECT cron.schedule(
  'ingest-india-macro-snapshot-job',
  '0 0 4 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-macro-snapshot',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('vault.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Re-schedule ingest-africa-macro-pulse-job with safe JSON construction
-- 5th of every month at midnight UTC
SELECT cron.schedule(
  'ingest-africa-macro-pulse-job',
  '0 0 5 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-africa-macro',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('vault.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Re-schedule generate-weekly-regime-digest-job with safe JSON construction
-- Sundays at 23:00 UTC
SELECT cron.schedule(
  'generate-weekly-regime-digest-job',
  '0 23 * * 0',
  $$
  SELECT
    net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-weekly-regime-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Re-schedule send-weekly-digest-job with safe JSON construction
-- Mondays at 01:00 UTC (after generation completes)
SELECT cron.schedule(
  'send-weekly-digest-job',
  '0 1 * * 1',
  $$
  SELECT
    net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/send-weekly-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

COMMIT;
