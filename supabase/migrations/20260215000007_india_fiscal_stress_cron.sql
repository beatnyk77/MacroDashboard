-- Schedule India Fiscal Stress Ingestion
-- Runs monthly on the 5th at 11:00 AM UTC

SELECT cron.schedule(
    'ingest-india-fiscal-stress-monthly',
    '0 11 5 * *', -- 11:00 AM UTC on the 5th of each month
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-fiscal-stress',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
        )
    ) AS request_id;
    $$
);
