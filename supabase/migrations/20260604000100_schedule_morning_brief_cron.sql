-- Schedule daily morning brief generation at 06:45 UTC
-- 06:45 UTC — 15 minutes after compute-daily-macro-signal (06:30 UTC)

-- Unschedule if exists (idempotent)
DO $$ BEGIN
    PERFORM cron.unschedule('generate-morning-brief');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No existing generate-morning-brief cron to remove';
END $$;

-- Schedule daily morning brief at 06:45 UTC (15 min after compute-daily-macro-signal at 06:30)
SELECT cron.schedule(
  'generate-morning-brief',
  '45 6 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-morning-brief',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
        )
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);
