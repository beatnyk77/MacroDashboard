-- Enable extension if not already enabled (managed instance usually pre-enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the ingestion of UPI Autopay metrics
-- Runs on the 15th of every month at 08:30 UTC
SELECT cron.schedule(
    'ingest-upi-autopay-monthly',
    '30 8 15 * *', 
    $$
    SELECT
      net.http_post(
          url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-upi-autopay',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claim.role', true) || '"}'::jsonb
      ) as request_id;
    $$
);
