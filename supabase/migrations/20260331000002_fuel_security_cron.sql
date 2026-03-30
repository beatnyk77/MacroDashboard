-- Migration: Schedule Fuel Security Clock India Ingestion
-- Runs daily at 02:00 UTC (7:30 AM IST) to update fuel security metrics
-- Requires app settings:
--   app.edge_function_url (e.g., https://your-project.functions.supabase.co)
--   app.service_role_key (service role API key)

SELECT cron.schedule(
    'ingest-fuel-security-india-daily',
    '0 2 * * *', -- Daily at 02:00 UTC
    $$
    SELECT net.http_post(
        url := current_setting('app.edge_function_url') || '/ingest-fuel-security-india',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);