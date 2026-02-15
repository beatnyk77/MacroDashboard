-- 20260215000009_cb_gold_net_cron.sql

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the ingestion job to run quarterly
-- Run at 02:00 UTC on the 1st day of January, April, July, and October
-- Cron expression: 0 2 1 */3 *
SELECT cron.schedule(
    'ingest-cb-gold-net-quarterly',
    '0 2 1 */3 *',
    $$
    SELECT
      net.http_post(
          url := 'https://project-ref.supabase.co/functions/v1/ingest-cb-gold-net',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb
      ) as request_id;
    $$
);
