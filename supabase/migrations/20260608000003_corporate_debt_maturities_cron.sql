-- =====================================================================
-- Migration: Schedule ingest-corporate-debt-maturities cron job
-- Runs: 5th of each month at 14:00 UTC
-- Retry: 7th of each month at 14:00 UTC (idempotent — skips if already run)
-- =====================================================================

-- Remove any previous schedule (idempotent)
DO $$ BEGIN PERFORM cron.unschedule('ingest-corp-debt-maturities-monthly'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('ingest-corp-debt-maturities-retry');   EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
    'ingest-corp-debt-maturities-monthly',
    '0 14 5 * *',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-corporate-debt-maturities',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
            )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
    ) AS request_id;
    $$
);

-- Retry on 7th in case of transient FRED failures (function is idempotent)
SELECT cron.schedule(
    'ingest-corp-debt-maturities-retry',
    '0 14 7 * *',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-corporate-debt-maturities',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
            )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
    ) AS request_id;
    $$
);
