-- Data integrity crons (2026-07-27)
-- 1) Monthly regime digest catch-up (daily): fills missing months if 1st-of-month job failed
-- 2) Corporate debt maturities: ensure correct slug + monthly schedule
-- 3) Oil spot already covered by ingest-oil-spread weekdays; no new function

-- ── Regime digest catch-up (daily 01:15 UTC) ───────────────────────────────
SELECT cron.unschedule('generate-monthly-regime-digest-catchup')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-monthly-regime-digest-catchup');

SELECT cron.schedule(
  'generate-monthly-regime-digest-catchup',
  '15 1 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-monthly-regime-digest?catch_up=1',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      'x-cron-secret', COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1),
        ''
      )
    ),
    body    := '{"catch_up":true}'::jsonb
  );
  $$
);

-- ── Corporate debt: fix slug + schedule monthly (5th 02:00 UTC) ────────────
SELECT cron.unschedule('ingest-corporate-debt-maturity-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-corporate-debt-maturity-daily');

SELECT cron.unschedule('ingest-corporate-debt-maturities-monthly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-corporate-debt-maturities-monthly');

SELECT cron.schedule(
  'ingest-corporate-debt-maturities-monthly',
  '0 2 5 * *',
  $$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-corporate-debt-maturities',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      'x-cron-secret', COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1),
        ''
      )
    ),
    body    := '{}'::jsonb
  );
  $$
);
