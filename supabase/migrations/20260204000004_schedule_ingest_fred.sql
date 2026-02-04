-- Schedule ingest-fred to run daily at 6:00 AM UTC (2:00 AM ET)
-- This ensures Gold, Silver, BoJ Assets, etc. are updated.

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

-- Ensure ingest-fiscaldata is scheduled (it was, but let's reinforce or update if needed)
-- We will leave it as is if it exists, or Replace it to ensure it uses the vault secret.
SELECT cron.unschedule('ingest-fiscaldata');

SELECT cron.schedule(
    'ingest-fiscaldata',
    '30 6 * * *', -- 6:30 AM UTC
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
