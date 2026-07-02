-- ============================================================
-- SINGLE SOURCE OF TRUTH — all future cron changes happen by
-- amending and re-running this pattern, never in ad-hoc migrations.
-- ============================================================
-- Migration  : 20260613000000_canonical_crons.sql
-- Generated  : 2026-07-02 via scripts/generate-canonical-crons.mjs
-- Project    : debdriyzfcwvgrhzzzre  (MacroIntelligence_GraphiQuestor)
-- Source     : docs/live-state-2026-06.md — 101 active jobs as of 2026-06-12
--
-- PURPOSE
-- Replaces every ad-hoc cron migration since 2026-01 with one canonical file.
-- All 101 live jobs are re-registered after an explicit full unschedule sweep.
--
-- CHANGES FROM LIVE STATE
--   1. Normalises all vault patterns to safe jsonb_build_object + COALESCE
--      subselect (fixes GUC pattern on jobs 436, 437, 377, 371; hardcoded JWT
--      on job 372; and SERVICE_ROLE_KEY-only on jobs 432, 430, 428, 439).
--   2. Adds x-cron-secret header to all HTTP-based jobs — header-first,
--      enforcement-second (enforcement is conditional per Task 1.2; a blank
--      CRON_SECRET value is inert until the real value is set in vault).
--   3. Fixes wrong project URL on ingest-country-gmd-supplement-quarterly
--      (was ohefbbvldkoflrcjixow, corrected to debdriyzfcwvgrhzzzre — but the
--      function is still flagged ORPHAN as it is not in the deployed list).
--   4. Fixes slug typo on ingest-corporate-debt-maturity-daily
--      (was /ingest-corporate-debt-maturity, corrected to
--      /ingest-corporate-debt-maturities which is the deployed slug).
--   5. Schedule expressions preserved EXACTLY from live snapshot — the time
--      stagger encodes upstream rate-limit knowledge; do not tidy.
--
-- VAULT SECRETS
--   SUPABASE_SERVICE_ROLE_KEY  — primary (78 live jobs used this)
--   SERVICE_ROLE_KEY           — fallback (4 live jobs used this alone)
--   CRON_SECRET                — new; guarded creation below (blank placeholder,
--                                must be set via Supabase Dashboard → Vault
--                                before enforcement is enabled on functions)
--
-- ANOMALIES RESOLVED
--   F3  ingest-us-macro-weekly — hardcoded JWT replaced with vault pattern
--   F4  ingest-country-gmd-supplement-quarterly — wrong project URL fixed
--   F5  ingest-corporate-debt-maturity-daily — slug typo fixed
--   F6  ingest-fiscaldata double-fire — both jobs preserved (resolve separately)
--
-- ORPHAN JOBS (function not confirmed deployed — included, flagged inline)
--   Confirmed absent: generate-newsletter-monthly, ingest-capital-flows-monthly,
--     ingest-country-gmd-supplement-quarterly, ingest-g20-sovereign-monthly,
--     ingest-institutional-loans-monthly/-weekly, ingest-state-fiscal-health-monthly,
--     ingest-us-fiscal-stress-monthly, ingest-weekly-narrative-weekly, send-weekly-digest-job
--   Likely deployed (parse gap — all ran successfully in last 7 days):
--     gsc-sync-daily, ingest-geopolitical-osint, ingest-institutional-13f-weekly,
--     ingest-mutual-funds-daily, ingest-nse-flows-daily, refresh-gold-ratios-daily
-- ============================================================


-- ── STEP 0 ── Guard: ensure CRON_SECRET exists in vault ──────────────
-- Creates a blank placeholder if the entry is absent.
-- The empty value is inert — enforcement in functions checks for a non-empty
-- match, so leaving this blank is zero-downtime until you're ready to enforce.
-- To activate: set the real value via Supabase Dashboard → Vault, then set
-- CRON_SECRET as a function env var (Task 1.2).
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET'
  ) THEN
    PERFORM vault.create_secret(
      '',             -- secret value (blank placeholder)
      'CRON_SECRET',  -- name
      'Shared secret for x-cron-secret cron-auth header. '
      'Replace blank value via Supabase Dashboard → Vault before enabling enforcement.'
    );
    RAISE NOTICE 'Created blank CRON_SECRET vault entry. Set a real value before enabling enforcement.';
  END IF;
END $$;


-- ── STEP A ── Unschedule every active job ────────────────────────────
-- Explicit full sweep — do NOT rely on same-name cron.schedule replacing
-- silently; behaviour differs across pg_cron versions.
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT jobname FROM cron.job LOOP
    PERFORM cron.unschedule(r.jobname);
  END LOOP;
END $$;


-- ── STEP B ── Reschedule all 103 jobs ─────────────────────────────────────
-- Auth    : COALESCE vault subselect (safe — no string concatenation into ::jsonb)
-- Headers : x-cron-secret for future enforcement (currently inert if blank)
-- Slots   : Exactly as in live snapshot — do not adjust without upstream consent.
-- Timeout : 120 000 ms on all HTTP jobs
-- ─────────────────────────────────────────────────────────────────────



SELECT cron.schedule(
  'cache-comtrade-weekly',
  '0 18 * * 6',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/cache-comtrade-data',
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
  'check-data-health-daily',
  '0 7 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/check-data-health',
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
  'check-fomc-minutes-daily',
  '0 6 */2 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/check-fomc-minutes',
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
  'compute-cie-macro-scores-weekly',
  '0 12 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/compute-cie-macro-scores',
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
  'compute-daily-macro-signal-daily',
  '30 6 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/compute-daily-macro-signal',
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

-- PATTERN 3 (SQL-direct — no HTTP)
SELECT cron.schedule(
  'compute-zscores-daily',
  '0 6 * * *',
  $job$SELECT public.compute_rolling_z_scores();$job$
);

-- was GUC current_setting(app.settings.service_role_key) — fixed to vault subselect
SELECT cron.schedule(
  'generate-monthly-regime-digest-job',
  '30 0 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-monthly-regime-digest',
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
  'generate-morning-brief',
  '45 6 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-morning-brief',
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

-- ORPHAN? function not confirmed in deployed list
SELECT cron.schedule(
  'generate-newsletter-monthly',
  '30 0 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-newsletter',
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
  'generate-weekly-regime-digest-job',
  '0 23 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-weekly-regime-digest',
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

-- ORPHAN? not in parsed deploy list; ran successfully 7d — likely deployed (parse gap)
SELECT cron.schedule(
  'gsc-sync-daily',
  '0 6 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/gsc-sync',
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

-- was GUC current_setting(vault.service_role_key) — fixed to vault subselect
SELECT cron.schedule(
  'ingest-africa-macro-pulse-job',
  '0 0 5 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-africa-macro',
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
  '0 6 15 * *',
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
  'ingest-boj-balance-sheet-weekly',
  '5 10 * * 1',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-boj-balance-sheet',
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

-- ORPHAN? function not in deployed list
SELECT cron.schedule(
  'ingest-capital-flows-monthly',
  '0 14 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-capital-flows',
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
  'ingest-cb-gold-net-quarterly',
  '0 2 1 1,4,7,10 *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cb-gold-net',
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
  'ingest-china-energy-weekly',
  '0 7 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-china-energy',
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
  'ingest-china-macro-daily',
  '0 3 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-china-macro',
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
  'ingest-china-real-economy-monthly',
  '0 11 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-china-real-economy',
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
  'ingest-cie-deals-daily',
  '0 20 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cie-deals',
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
  'ingest-cie-fundamentals-daily',
  '0 18 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cie-fundamentals',
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
  'ingest-cie-ipos-daily',
  '0 22 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cie-ipos',
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
  'ingest-cie-promoters-daily',
  '0 19 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cie-promoters',
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
  'ingest-cie-short-selling-daily',
  '0 21 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cie-short-selling',
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
  'ingest-cofer-monthly',
  '0 2 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cofer',
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
  'ingest-commodity-imports-monthly',
  '0 7 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-commodity-imports',
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
  'ingest-commodity-reserves-weekly',
  '0 0 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-commodity-reserves',
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
  'ingest-commodity-terminal',
  '30 8 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-commodity-terminal',
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
  'ingest-copper-gold-ratio-daily',
  '0 15 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-copper-gold-ratio',
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

-- SLUG FIX: live cron called ingest-corporate-debt-maturity (no s); corrected to deployed slug ingest-corporate-debt-maturities
SELECT cron.schedule(
  'ingest-corporate-debt-maturity-daily',
  '0 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-corporate-debt-maturities',
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

-- ORPHAN? function not in deployed list
-- URL FIX: live cron called wrong project ohefbbvldkoflrcjixow — corrected to this project
SELECT cron.schedule(
  'ingest-country-gmd-supplement-quarterly',
  '0 4 1 1,4,7,10 *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-country-gmd-supplement',
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
  'ingest-currency-wars-monthly',
  '0 16 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-currency-wars',
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
  'ingest-ecb-balance-sheet-weekly',
  '0 10 * * 1',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-ecb-balance-sheet',
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
  'ingest-energy-global-monthly',
  '30 2 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-energy-global',
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
  'ingest-events-markers-daily',
  '0 11 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-events-markers',
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

-- F6 DUPLICATE — fires same fn as ingest-fiscaldata-daily (30 min apart); resolve separately
SELECT cron.schedule(
  'ingest-fiscaldata',
  '0 7 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fiscaldata',
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

-- F6 DUPLICATE — fires same fn as ingest-fiscaldata (30 min apart); resolve separately
SELECT cron.schedule(
  'ingest-fiscaldata-daily',
  '30 6 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fiscaldata',
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
  'ingest-fred-daily',
  '0 6 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fred',
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
  'ingest-fuel-security-india-daily',
  '0 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fuel-security-india',
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

-- ORPHAN? function not in deployed list
SELECT cron.schedule(
  'ingest-g20-sovereign-monthly',
  '0 13 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-g20-sovereign',
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

-- ran 28x/7d — likely deployed; not in parsed deploy list (parse gap)
SELECT cron.schedule(
  'ingest-geopolitical-osint',
  '0 */6 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-geopolitical-osint',
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
  'ingest-gfcf',
  '30 5 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-gfcf',
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
  'ingest-global-liquidity-weekly',
  '15 10 * * 1',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-global-liquidity',
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
  'ingest-global-refining-weekly',
  '0 3 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-global-refining',
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
  'ingest-gold-daily',
  '0 4 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-gold',
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
  'ingest-gold-debt-coverage-monthly',
  '0 8 15 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-gold-debt-coverage',
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
  'ingest-gold-history-daily',
  '0 5 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-gold-history',
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
  'ingest-imf',
  '0 8 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf',
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
  'ingest-imf-brics-monthly',
  '0 3 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-brics',
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
  'ingest-imf-current-account-monthly',
  '0 8 20 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-current-account',
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
  'ingest-imf-sdr-monthly',
  '0 8 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-sdr',
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
  'ingest-india-credit-cycle-weekly',
  '30 5 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-credit-cycle',
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
  'ingest-india-debt-maturities-monthly',
  '0 6 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-debt-maturities',
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
  'ingest-india-digitization-monthly',
  '0 8 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-digitization',
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

-- NOTE: calls ingest-energy (not ingest-india-energy) — preserved from live state
SELECT cron.schedule(
  'ingest-india-energy-weekly',
  '0 0 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-energy',
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
  'ingest-india-fiscal-allocation-monthly',
  '0 9 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-fiscal-allocation',
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
  'ingest-india-fiscal-stress-monthly',
  '0 11 5 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-fiscal-stress',
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
  'ingest-india-inflation-monthly',
  '0 7 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-inflation',
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
  'ingest-india-liquidity-daily',
  '0 15 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-liquidity',
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

-- was GUC current_setting(vault.service_role_key) — fixed to vault subselect
SELECT cron.schedule(
  'ingest-india-macro-snapshot-job',
  '0 0 4 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-macro-snapshot',
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

-- NOTE: calls ingest-market-pulse (not ingest-india-market-pulse) — preserved from live state
SELECT cron.schedule(
  'ingest-india-market-pulse-daily',
  '0 14 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-market-pulse',
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

-- ORPHAN? not in parsed deploy list; ran successfully 7d — likely deployed (parse gap)
SELECT cron.schedule(
  'ingest-institutional-13f-weekly',
  '0 3 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-institutional-13f',
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

-- ORPHAN? function not in deployed list
SELECT cron.schedule(
  'ingest-institutional-loans-monthly',
  '0 4 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-institutional-loans',
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

-- ORPHAN? function not in deployed list
SELECT cron.schedule(
  'ingest-institutional-loans-weekly',
  '0 1 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-institutional-loans',
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
  'ingest-macro-news-headlines',
  '0 */6 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-macro-news-headlines',
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
  'ingest-major-economies-monthly',
  '0 12 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-major-economies',
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
  'ingest-market-pulse-daily',
  '0 1 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-market-pulse',
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
  'ingest-mospi',
  '0 7 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-mospi',
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

-- ORPHAN? not in parsed deploy list; ran successfully 7d — likely deployed (parse gap)
SELECT cron.schedule(
  'ingest-mutual-funds-daily',
  '30 14 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-mutual-funds',
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

-- ORPHAN? not in parsed deploy list; ran successfully 7d — likely deployed (parse gap)
SELECT cron.schedule(
  'ingest-nse-flows-daily',
  '30 13 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nse-flows',
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
  'ingest-nyfed-markets-daily',
  '0 12 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nyfed-markets',
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
  'ingest-oecd-cli-monthly',
  '0 9 10 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-oecd-cli',
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
  'ingest-oil-eia-weekly',
  '30 16 * * 3',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-oil-eia',
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
  'ingest-oil-global-weekly',
  '0 5 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-oil-global',
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
  'ingest-oil-india-china-weekly',
  '0 6 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-oil-india-china',
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
  'ingest-oil-spread-daily',
  '0 5 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-oil-spread',
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
  'ingest-pboc-liquidity-daily',
  '0 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-pboc-liquidity',
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
  'ingest-precious-divergence-daily',
  '0 19 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-precious-divergence',
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
  'ingest-rbi-money-market-daily',
  '0 15 * * 1-5',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-rbi-money-market',
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

-- ORPHAN? function not in deployed list
SELECT cron.schedule(
  'ingest-state-fiscal-health-monthly',
  '0 10 1 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-state-fiscal-health',
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
  'ingest-tic-foreign-holders',
  '0 10 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-tic-foreign-holders',
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
  'ingest-trade-global-monthly',
  '30 6 15 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-global',
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

-- was SERVICE_ROLE_KEY-only vault lookup — normalised to COALESCE
SELECT cron.schedule(
  'ingest-trade-imports-weekly',
  '0 7 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports',
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
  'ingest-trade-intelligence-pulse',
  '0 5 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-global-pulse',
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

-- PATTERN 2 (query params); was SERVICE_ROLE_KEY-only vault lookup — normalised to COALESCE
SELECT cron.schedule(
  'ingest-un-comtrade-weekly',
  '0 6 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-un-comtrade?hsCode=8542&category=Semiconductors',
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
  'ingest-upi-autopay-daily',
  '30 8 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-upi-autopay',
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
  'ingest-us-debt-maturities-monthly',
  '0 14 8 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-debt-maturities',
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
  'ingest-us-debt-maturities-monthly-retry',
  '0 14 10 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-debt-maturities',
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

-- ORPHAN? function not in deployed list
SELECT cron.schedule(
  'ingest-us-fiscal-stress-monthly',
  '0 10 5 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-fiscal-stress',
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
  'ingest-us-macro-auctions-daily',
  '30 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro?task=auctions',
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
  'ingest-us-macro-daily',
  '0 3 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro',
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
  'ingest-us-macro-fiscal-daily',
  '0 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro?task=fiscal',
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
  'ingest-us-macro-fred-daily',
  '20 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro?task=fred',
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
  'ingest-us-macro-ust-daily',
  '10 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro?task=ust',
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

-- CRITICAL F3 FIX: live cron had hardcoded JWT in command — replaced with vault subselect
SELECT cron.schedule(
  'ingest-us-macro-weekly',
  '0 0 * * 1',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro',
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
  'ingest-us-treasury-auctions-monthly',
  '0 10 5 * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-treasury-auctions',
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
  'ingest-us-treasury-auctions-weekly',
  '0 9 * * 1',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-treasury-auctions',
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

-- ORPHAN? function not in deployed list
SELECT cron.schedule(
  'ingest-weekly-narrative-weekly',
  '30 23 * * 0',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-weekly-narrative',
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
  'ingest-yield-curves-daily',
  '0 2 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-yield-curves',
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

-- ran 4x/7d — likely deployed; not in parsed deploy list (parse gap)
SELECT cron.schedule(
  'refresh-gold-ratios-daily',
  '0 7 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/refresh-gold-ratios',
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

-- fires 1h after generate-morning-brief (45 6) and 30 min after trigger-site-rebuild so emailed URLs are prerendered; no-ops when no brief exists for today
SELECT cron.schedule(
  'send-daily-brief-job',
  '45 7 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/send-daily-brief',
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

-- ORPHAN? function not in deployed list; was SERVICE_ROLE_KEY-only — normalised to COALESCE
SELECT cron.schedule(
  'send-weekly-digest-job',
  '0 1 * * 1',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/send-weekly-digest',
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

-- fires 30 min after generate-morning-brief (45 6) so the fresh brief gets prerendered; function skips when no brief exists for today
SELECT cron.schedule(
  'trigger-site-rebuild-daily',
  '15 7 * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/trigger-site-rebuild',
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


-- ── Verification ─────────────────────────────────────────────────────
-- Run after applying this migration:
--
--   SELECT COUNT(*) FROM cron.job;
--   -- Expected: 103
--
--   SELECT jobname, schedule FROM cron.job ORDER BY jobname;
--   -- Diff against JOBS array in scripts/generate-canonical-crons.mjs
--
-- Next-day health check (run 24 h after apply):
--   SELECT j.jobname, d.status, d.return_message
--     FROM cron.job j
--     JOIN cron.job_run_details d ON j.jobid = d.jobid
--    WHERE d.start_time > NOW() - INTERVAL '24 hours'
--      AND d.status <> 'succeeded';
-- ─────────────────────────────────────────────────────────────────────
