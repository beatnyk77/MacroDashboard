-- Schedule daily morning brief generation at 05:30 UTC
-- Runs after overnight ingest jobs have settled; compute-daily-macro-signal fires at 06:00 UTC,
-- so this brief is built from the PREVIOUS day's signal — adjust to 06:15 UTC if same-day signal is needed.
SELECT
  cron.schedule(
    'generate-morning-brief',
    '30 5 * * *',
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
