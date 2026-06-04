-- Schedule daily morning brief generation at 06:15 UTC
-- Runs after compute-daily-macro-signal (06:00 UTC) to ensure same-day signal is available.
SELECT
  cron.schedule(
    'generate-morning-brief',
    '15 6 * * *',
    $$
    SELECT
      net.http_post(
        url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-morning-brief',
        headers:=(
          '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1) ||
          '"}'
        )::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );
