-- Migration: Schedule Prediction Market Data Ingestion via pg_cron
-- Runs the ingest-prediction-markets Edge Function daily at 06:00 UTC

SELECT cron.schedule(
    'ingest-prediction-markets-daily',
    '0 6 * * *',
    $$
    SELECT net.http_post(
        url := current_setting('app.edge_function_url') || '/ingest-prediction-markets',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    )
    $$
);
