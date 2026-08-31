-- Run the expanded SEC registry in bounded batches. One large companyfacts
-- invocation can exceed Edge Function resources as the registry grows.

SELECT cron.unschedule('ingest-sec-corporate-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-sec-corporate-daily');

SELECT cron.unschedule('compute-sec-corporate-signals-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'compute-sec-corporate-signals-daily');

DO $$
DECLARE
  batch_offset integer;
  batch_name text;
  batch_schedule text;
BEGIN
  FOR batch_offset IN 0..32 BY 8 LOOP
    batch_name := 'ingest-sec-corporate-batch-' || batch_offset;
    batch_schedule := CASE batch_offset
      WHEN 0 THEN '30 22 * * 1-5'
      WHEN 8 THEN '40 22 * * 1-5'
      WHEN 16 THEN '50 22 * * 1-5'
      WHEN 24 THEN '0 23 * * 1-5'
      ELSE '10 23 * * 1-5'
    END;

    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = batch_name) THEN
      PERFORM cron.unschedule(batch_name);
    END IF;

    PERFORM cron.schedule(
      batch_name,
      batch_schedule,
      format($job$
        SELECT net.http_post(
          url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-sec-corporate?limit=8&offset=%s',
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
      $job$, batch_offset)
    );
  END LOOP;
END $$;

SELECT cron.schedule(
  'compute-sec-corporate-signals-daily',
  '30 23 * * 1-5',
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
