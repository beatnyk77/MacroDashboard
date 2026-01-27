-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the ingestion job to run daily at 21:00 UTC (Market Close + buffer)
-- Note: You need to set the project_url and service_role_key as secrets or hardcode (not recommended for git)
-- Better approach: Use the Supabase Dashboard UI to set the generic webhook, or use `net.http_post` if allowed.
-- This is a standard pg_cron usage pattern for Supabase.

SELECT cron.schedule(
    'ingest-daily-macro',
    '0 21 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://project-ref.supabase.co/functions/v1/ingest-daily',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
