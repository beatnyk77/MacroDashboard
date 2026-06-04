-- Restore weekly digest generation and send crons
-- These were dropped during bulk cron migration but not restored

BEGIN;

-- Drop existing jobs if they exist (safe even if they don't)
SELECT cron.unschedule('generate-weekly-regime-digest-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-weekly-regime-digest-job');

SELECT cron.unschedule('send-weekly-digest-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-digest-job');

-- Re-schedule the weekly digest generation job
-- Sundays 23:00 UTC
SELECT
  cron.schedule(
    'generate-weekly-regime-digest-job',
    '0 23 * * 0',
    $$
    SELECT
      net.http_post(
        url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-weekly-regime-digest',
        headers:=(
          '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1) ||
          '"}'
        )::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- Re-schedule the weekly digest send job
-- Mondays 01:00 UTC (after generation completes)
SELECT
  cron.schedule(
    'send-weekly-digest-job',
    '0 1 * * 1',
    $$
    SELECT
      net.http_post(
        url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/send-weekly-digest',
        headers:=(
          '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1) ||
          '"}'
        )::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );

COMMIT;
