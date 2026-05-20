-- ============================================================
-- Fix: ingest-oil-eia cron
-- Schedule to run weekly (Wednesday 06:00 UTC) to match EIA's
-- Weekly Petroleum Status Report publication schedule (every Wednesday)
-- ============================================================

DO $$
BEGIN
    PERFORM cron.unschedule('ingest-oil-eia-weekly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('ingest-oil-eia');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
    'ingest-oil-eia-weekly',
    '30 16 * * 3',  -- Wednesday 16:30 UTC (~12:30 PM ET, after EIA publishes at 10:30 AM ET)
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-oil-eia',
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
