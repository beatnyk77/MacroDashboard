-- Migration: Schedule RBI Money Market Data Ingestion via pg_cron
-- Runs the ingest-rbi-money-market Edge Function daily at 19:30 IST / 14:00 UTC

SELECT cron.schedule(
    'ingest-rbi-money-market-daily',
    '0 14 * * *',
    $$
    SELECT net.http_post(
        url := current_setting('app.edge_function_url') || '/ingest-rbi-money-market',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    )
    $$
);
