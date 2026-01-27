-- =====================================================
-- Cron Schedule for COFER Ingestion
-- =====================================================
-- Adds monthly cron job for IMF COFER data ingestion
-- Runs on 1st of every month at 02:00 UTC
-- =====================================================

-- Schedule monthly COFER ingestion
-- IMF COFER data is published quarterly, but we check monthly to catch new releases
SELECT cron.schedule(
    'ingest-cofer-monthly',
    '0 2 1 * *', -- 1st of every month at 02:00 UTC
    $$
    SELECT
      net.http_post(
          url:='https://project-ref.supabase.co/functions/v1/ingest-cofer',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);

COMMENT ON EXTENSION pg_cron IS 'Automated job scheduling for data ingestion';

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('ingest-cofer-monthly');
