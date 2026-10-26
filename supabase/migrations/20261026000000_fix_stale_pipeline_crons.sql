-- Stale-data audit 2026-10-26 (see .github/workflows/data-freshness-audit.yml).
--
-- 1. ingest-us-macro-fiscal (treasury supply radar: dealer inventory, foreign official
--    custody, 10Y bid-to-cover, absorption stress) had no schedule after the 2026-08-31
--    consolidation: the job named ingest-us-macro-fiscal-daily calls ingest-us-macro?task=fiscal.
--    Runs after ingest-us-macro-auctions-daily (02:30) so it reads the latest 10Y auction.
-- 2. ingest-bis-reer (BIS REER via FRED) lost its schedule in the same consolidation.
-- 3. Jobs targeting functions that are not deployed (they 404 silently on every run) are removed.
-- 4. populate_gold_ratios() (RATIO_M2_GOLD / SPX_GOLD / GOLD_SILVER) lost its daily job when
--    refresh-gold-ratios-daily was unscheduled; it now runs only when ingest-precious-metals
--    happens to succeed. Run it directly after the nightly market ingestion (21:30 UTC).

DO $$
DECLARE
  dead text;
BEGIN
  FOREACH dead IN ARRAY ARRAY[
    'ingest-us-treasury-auctions-monthly',
    'ingest-us-treasury-auctions-weekly',
    'ingest-us-fiscal-stress-monthly',
    'ingest-weekly-narrative-weekly',
    'generate-newsletter-monthly',
    'ingest-us-macro-fiscal-supply-daily',
    'ingest-bis-reer-monthly',
    'populate-gold-ratios-daily'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = dead) THEN
      PERFORM cron.unschedule(dead);
    END IF;
  END LOOP;
END $$;

SELECT cron.schedule(
  'ingest-us-macro-fiscal-supply-daily',
  '30 3 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro-fiscal',
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
  'ingest-bis-reer-monthly',
  '0 9 20 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-bis-reer',
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
  'populate-gold-ratios-daily',
  '15 22 * * *',
  $job$ SELECT public.populate_gold_ratios(); $job$
);

