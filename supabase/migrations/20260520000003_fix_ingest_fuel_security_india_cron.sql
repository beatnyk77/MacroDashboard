-- ============================================================
-- Fix: ingest-fuel-security-india cron
-- Schedule to run daily at 02:00 UTC using the vault decrypted key
-- ============================================================

DO $$
BEGIN
    PERFORM cron.unschedule('ingest-fuel-security-india-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('ingest-fuel-security-india');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
    'ingest-fuel-security-india-daily',
    '0 2 * * *',  -- 02:00 UTC daily
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fuel-security-india',
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
