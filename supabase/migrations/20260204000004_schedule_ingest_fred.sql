-- ⚠️  DEPRECATED: MIGRATION HAS SECURITY ISSUES
-- ================================================
-- This migration contains HARDCODED SECRETS (Bearer tokens) and should
-- NEVER be applied to a new database. It has been superseded by:
--   `20260408000000_cron_jobs_consolidated.sql`
--
-- Issues:
--   - Hardcoded SERVICE_ROLE_KEY in Authorization header (lines 13, 32)
--   - This is a CRITICAL security vulnerability if committed to Git
--
-- Action: DO NOT RUN THIS MIGRATION. Use the consolidated cron migration instead.
-- If this migration was already applied in production, rotate all compromised keys.
-- ================================================

-- ORIGINAL CONTENT PRESERVED FOR REFERENCE (commented out):

-- Schedule ingest-fred to run daily at 6:00 AM UTC (2:00 AM ET)
-- This ensures Gold, Silver, BoJ Assets, etc. are updated.

/*
-- DEPRECATED: Hardcoded secrets - DO NOT EXECUTE

SELECT cron.schedule(
    'ingest-fred',
    '0 6 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fred',
          headers:=jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
          )
      ) as request_id;
    $$
);

SELECT cron.unschedule('ingest-fiscaldata');

SELECT cron.schedule(
    'ingest-fiscaldata',
    '30 6 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fiscaldata',
          headers:=jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
          )
      ) as request_id;
    $$
);
*/
