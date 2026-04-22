-- Schedule: compute-daily-macro-signal at 06:00 UTC daily
-- This runs after overnight data ingestion has settled

SELECT cron.schedule(
    'compute-daily-macro-signal',
    '0 6 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT value FROM app_config WHERE key = 'supabase_functions_url') || '/compute-daily-macro-signal',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    $$
);
