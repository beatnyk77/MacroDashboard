-- Schedule weekly India macro snapshot ingestion
-- Runs every Sunday at 06:00 UTC (11:30 IST) to pick up the latest published values
-- for CPI, WPI, PMI, Forex Reserves, GST Collections, Vehicle Registrations, Naukri Job Index
SELECT cron.schedule(
    'india-macro-weekly',
    '0 6 * * 0',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-macro-weekly',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);
