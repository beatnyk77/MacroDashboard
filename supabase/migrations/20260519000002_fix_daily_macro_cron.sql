-- ============================================================
-- Fix: compute-daily-macro-signal cron
-- The original cron (20260423000001) uses the broken app_config
-- pattern. Replace with vault-based auth, same as all other jobs.
-- Runs at 06:30 UTC daily — after ingest-fred settles at 06:00 UTC.
-- ============================================================

-- Remove the old broken cron
DO $$
BEGIN
    PERFORM cron.unschedule('compute-daily-macro-signal');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No existing compute-daily-macro-signal cron to remove';
END $$;

-- Register correct cron using vault-based auth
SELECT cron.schedule(
    'compute-daily-macro-signal-daily',
    '30 6 * * *',  -- 06:30 UTC — 30 min after FRED ingest settles
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/compute-daily-macro-signal',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
            )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
    ) AS request_id;
    $$
);
