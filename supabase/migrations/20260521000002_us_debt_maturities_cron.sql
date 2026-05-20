-- ============================================================
-- Fix: US Debt Maturity Wall ingestion
-- 1. Deploy dedicated function ingest-us-debt-maturities
-- 2. Reschedule monthly cron aligned to Treasury MSPD release (8th of month)
-- 3. Fix ingest-us-macro-daily timeout (was 55s, must be 300s for full pipeline)
-- 4. Remove maturities from ingest-us-macro (now handled separately)
-- ============================================================

-- ── Fix ingest-us-macro-daily: increase timeout to 300s ───────────────────────
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-us-macro-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
    'ingest-us-macro-daily',
    '0 3 * * *',   -- 03:00 UTC daily
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
            )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 300000  -- 5 minutes (was 55s — too short for 5 concurrent API tasks)
    ) AS request_id;
    $$
);

-- ── Schedule dedicated maturity wall cron ─────────────────────────────────────
-- Treasury MSPD publishes end-of-month data, typically by the 8th of following month.
-- Running on 8th and 10th to catch any delays in publication.
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-us-debt-maturities-monthly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('ingest-us-debt-maturities-monthly-retry');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
    'ingest-us-debt-maturities-monthly',
    '0 14 8 * *',   -- 8th of each month at 14:00 UTC (after MSPD typically published)
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-debt-maturities',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
            )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 300000
    ) AS request_id;
    $$
);

-- Retry on 10th in case MSPD was delayed
SELECT cron.schedule(
    'ingest-us-debt-maturities-monthly-retry',
    '0 14 10 * *',  -- 10th of each month at 14:00 UTC (retry/idempotent)
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-debt-maturities',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
            )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 300000
    ) AS request_id;
    $$
);
