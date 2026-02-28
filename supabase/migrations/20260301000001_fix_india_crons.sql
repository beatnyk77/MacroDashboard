-- =====================================================
-- India Labs – Consolidated Cron Fix
-- =====================================================

-- 1. Unschedule potentially duplicate or broken jobs
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-nse-flows-daily');
    PERFORM cron.unschedule('ingest-india-market-pulse-daily');
    PERFORM cron.unschedule('ingest-india-energy-weekly');
EXCEPTION WHEN OTHERS THEN
    -- Ignore if jobs don't exist
END $$;

-- 2. Schedule NSE Flows Ingestion (Mon-Fri at 7:30 PM IST)
SELECT cron.schedule(
    'ingest-nse-flows-daily',
    '30 13 * * 1-5', -- 13:30 UTC = 7:00 PM IST (NSE EOD data availability)
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nse-flows',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- 3. Schedule Market Pulse Ingestion (Mon-Fri at 8:00 PM IST)
SELECT cron.schedule(
    'ingest-india-market-pulse-daily',
    '0 14 * * 1-5', -- 14:00 UTC = 7:30 PM IST
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-market-pulse',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- 4. Schedule India Energy & State Macro Ingestion (Weekly on Sundays)
SELECT cron.schedule(
    'ingest-india-energy-weekly',
    '0 0 * * 0', -- Sunday 00:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-energy',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);
