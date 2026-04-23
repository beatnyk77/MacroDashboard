-- Schedule: ingest-oil-spread at 05:00 UTC daily
-- This runs before the daily macro signal to ensure energy data is fresh

SELECT cron.schedule(
    'ingest-oil-spread',
    '0 5 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_functions_url') || '/ingest-oil-spread',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    $$
);
