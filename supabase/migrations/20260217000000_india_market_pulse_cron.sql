-- Schedule Daily India Market Pulse Ingestion
-- Run Monday-Friday at 16:00 UTC (9:30 PM IST)
-- This captures FII/DII flows and market breadth after processing by NSE
SELECT cron.schedule(
    'ingest-india-market-pulse-daily',
    '0 16 * * 1-5',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nse-flows',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);
