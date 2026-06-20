-- Schedule UK Trade Info ingestion (OTS flows + trader intelligence)
-- Curated HS-6 codes aligned with trade intelligence seed data.
-- Weekly cadence, staggered after existing trade crons (Sun 07:00 UTC block).

-- Idempotent: drop prior schedules if re-applied
SELECT cron.unschedule('ingest-uk-trade-ots-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-uk-trade-ots-weekly');

SELECT cron.unschedule('ingest-uk-trade-traders-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-uk-trade-traders-weekly');

-- OTS macro flows — Sunday 07:15 UTC
SELECT cron.schedule(
  'ingest-uk-trade-ots-weekly',
  '15 7 * * 0',
  $job$
  DO $inner$
  DECLARE
    hs TEXT;
    auth_token TEXT;
    cron_secret TEXT;
  BEGIN
    auth_token := COALESCE(
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
    );
    cron_secret := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1);

    FOREACH hs IN ARRAY ARRAY['854231', '620342', '300490']
    LOOP
      PERFORM net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-uk-trade-ots?hsCode=' || hs,
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || auth_token,
          'x-cron-secret', cron_secret
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      );
      PERFORM pg_sleep(10);
    END LOOP;
  END $inner$;
  $job$
);

-- UK trader directory — Sunday 07:45 UTC (after OTS completes)
SELECT cron.schedule(
  'ingest-uk-trade-traders-weekly',
  '45 7 * * 0',
  $job$
  DO $inner$
  DECLARE
    hs TEXT;
    auth_token TEXT;
    cron_secret TEXT;
  BEGIN
    auth_token := COALESCE(
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
    );
    cron_secret := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1);

    FOREACH hs IN ARRAY ARRAY['854231', '620342', '300490']
    LOOP
      PERFORM net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-uk-trade-traders?hsCode=' || hs,
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || auth_token,
          'x-cron-secret', cron_secret
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      );
      PERFORM pg_sleep(10);
    END LOOP;
  END $inner$;
  $job$
);

-- One-time backfill on migration apply
DO $$
DECLARE
  hs TEXT;
  auth_token TEXT;
  cron_secret TEXT;
BEGIN
  auth_token := COALESCE(
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
  );
  cron_secret := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1);

  FOREACH hs IN ARRAY ARRAY['854231', '620342', '300490']
  LOOP
    PERFORM net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-uk-trade-ots?hsCode=' || hs,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || auth_token,
        'x-cron-secret', cron_secret
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
    PERFORM pg_sleep(5);

    PERFORM net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-uk-trade-traders?hsCode=' || hs,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || auth_token,
        'x-cron-secret', cron_secret
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
    PERFORM pg_sleep(5);
  END LOOP;

  RAISE NOTICE 'UK trade ingestion backfill triggered for HS 854231, 620342, 300490';
END $$;