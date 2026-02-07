-- =====================================================
-- Cron Schedule for Institutional Loans Ingestion
-- =====================================================
-- Adds monthly cron job for institutional loan data ingestion
-- Runs on 1st of every month at 04:00 UTC
-- =====================================================

SELECT cron.schedule(
    'ingest-institutional-loans-monthly',
    '0 4 1 * *',
    $$
    SELECT
      net.http_post(
          url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-institutional-loans',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
