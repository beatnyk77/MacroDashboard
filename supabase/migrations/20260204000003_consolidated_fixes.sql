-- Recreate ingestion_logs table
DROP TABLE IF EXISTS ingestion_logs CASCADE;

CREATE TABLE ingestion_logs (
    id BIGSERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed')),
    error_message TEXT,
    rows_inserted INTEGER DEFAULT 0,
    rows_updated INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingestion_logs_function_time 
ON ingestion_logs(function_name, start_time DESC);

CREATE INDEX idx_ingestion_logs_status 
ON ingestion_logs(status) WHERE status = 'failed';

-- Create view
CREATE OR REPLACE VIEW vw_latest_ingestions AS
SELECT DISTINCT ON (function_name)
    function_name,
    start_time,
    end_time,
    status,
    error_message,
    rows_inserted,
    rows_updated,
    EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds,
    created_at
FROM ingestion_logs
ORDER BY function_name, start_time DESC;

-- Reschedule failing jobs safely using cron.schedule (this upserts or creates)

-- 1. News Headlines (Every 6 hours)
SELECT cron.unschedule('ingest-macro-news-headlines-every-6-hours');
SELECT cron.schedule(
    'ingest-macro-news-headlines-every-6-hours',
    '0 */6 * * *',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-macro-news-headlines',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);

-- 2. GFCF (Monthly)
SELECT cron.unschedule('ingest-gfcf-monthly');
SELECT cron.schedule(
    'ingest-gfcf-monthly',
    '30 5 2 * *',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-gfcf',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);

-- 3. UPI Autopay (Monthly)
SELECT cron.unschedule('ingest-upi-autopay-monthly');
SELECT cron.schedule(
    'ingest-upi-autopay-monthly',
    '30 8 15 * *', 
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-upi-autopay',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);
