-- ⚠️  DEPRECATED: MIGRATION HAS PLACEHOLDER AUTH
-- ================================================
-- This migration contains placeholder 'YOUR_SERVICE_ROLE_KEY' and a generic
-- project URL 'project-ref.supabase.co'. It should NEVER be applied to a new
-- database. It has been superseded by:
--   `20260408000000_cron_jobs_consolidated.sql`
--
-- Issues:
--   - Placeholder token that will fail in production
--   - Generic project URL that needs to be replaced
--
-- Action: DO NOT RUN THIS MIGRATION. Use the consolidated cron migration instead.
-- ==============================================

/*
-- ORIGINAL CONTENT (commented out):

SELECT cron.schedule(
    'ingest-cofer-monthly',
    '0 2 1 * *',
    $$
    SELECT
      net.http_post(
          url:='https://project-ref.supabase.co/functions/v1/ingest-cofer',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
*/

COMMENT ON EXTENSION pg_cron IS 'Automated job scheduling for data ingestion';

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('ingest-cofer-monthly');
