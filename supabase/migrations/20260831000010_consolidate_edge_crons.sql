-- Migration: 20260831000010_consolidate_edge_crons.sql
-- Purpose  : Redirect scheduled crons from retired granular functions to consolidated domain workers.
-- Target   : debdriyzfcwvgrhzzzre

DO $$
BEGIN
  -- 1. Unschedule old single-metric jobs that are now superseded by consolidated workers
  PERFORM cron.unschedule('ingest-boj-balance-sheet-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-boj-balance-sheet-daily');
  PERFORM cron.unschedule('ingest-ecb-balance-sheet-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-ecb-balance-sheet-daily');
  PERFORM cron.unschedule('ingest-pboc-liquidity-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-pboc-liquidity-daily');
  PERFORM cron.unschedule('ingest-bis-reer-monthly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-bis-reer-monthly');
  PERFORM cron.unschedule('ingest-imf-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-imf-daily');
  PERFORM cron.unschedule('ingest-imf-sdr-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-imf-sdr-daily');
  PERFORM cron.unschedule('ingest-gold-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-gold-daily');
  PERFORM cron.unschedule('ingest-cb-gold-net-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-cb-gold-net-daily');
  PERFORM cron.unschedule('ingest-copper-gold-ratio-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-copper-gold-ratio-daily');
  PERFORM cron.unschedule('refresh-gold-ratios-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-gold-ratios-daily');
  PERFORM cron.unschedule('ingest-oil-spread-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-oil-spread-daily');
  PERFORM cron.unschedule('ingest-china-macro-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-china-macro-daily');
  PERFORM cron.unschedule('ingest-india-inflation-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-india-inflation-daily');
  PERFORM cron.unschedule('ingest-oecd-cli-monthly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-oecd-cli-monthly');
END $$;

-- 2. Schedule consolidated domain workers
SELECT cron.schedule(
  'ingest-central-banks-daily',
  '30 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-central-banks',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);

SELECT cron.schedule(
  'ingest-imf-macro-daily',
  '45 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-macro',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);

SELECT cron.schedule(
  'ingest-precious-metals-daily',
  '0 3 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-precious-metals',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);

SELECT cron.schedule(
  'ingest-energy-oil-daily',
  '15 3 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-energy-oil',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);

SELECT cron.schedule(
  'ingest-china-pulse-daily',
  '30 3 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-china-pulse',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);

SELECT cron.schedule(
  'ingest-india-macro-daily',
  '45 3 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-macro',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);

SELECT cron.schedule(
  'ingest-global-macro-daily',
  '0 4 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-global-macro',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);
