-- SEC corporate evidence and signal refresh schedules.
-- Runs after US market close and keeps the two jobs separated for clear failure attribution.

SELECT cron.unschedule('ingest-sec-corporate-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-sec-corporate-daily');

SELECT cron.unschedule('compute-sec-corporate-signals-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'compute-sec-corporate-signals-daily');

SELECT cron.schedule(
  'ingest-sec-corporate-daily',
  '30 22 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-sec-corporate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

SELECT cron.schedule(
  'compute-sec-corporate-signals-daily',
  '0 23 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/compute-corporate-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
