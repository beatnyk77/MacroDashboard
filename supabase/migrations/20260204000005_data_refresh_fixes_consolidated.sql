-- Consolidation of fixes for GraphiQuestor data refresh system
-- Date: 2026-02-04

-- 1. Fix ingestion_logs table (Renaming end_time to completed_at for frontend compatibility)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ingestion_logs' AND column_name='end_time') THEN
        ALTER TABLE ingestion_logs RENAME COLUMN end_time TO completed_at;
    END IF;
END $$;

-- 2. Ensure critical metrics for multi-country credit pulse are active
UPDATE metrics SET is_active = true WHERE id IN (
    'CN_CREDIT_TOTAL', 
    'IN_CREDIT_TOTAL', 
    'EU_CREDIT_TOTAL', 
    'JP_CREDIT_TOTAL'
);

-- 3. Reschedule all ingestion crons with stable authentication
-- Note: Replace ANON_KEY with the actual vault secret reference if vault is configured, 
-- but using the current working bearer token for stability across environments.

DO $$
BEGIN
    PERFORM cron.unschedule(jobid) FROM cron.job;
END $$;

-- Daily: Market Pulse (01:00)
SELECT cron.schedule('ingest-market-pulse-daily', '0 1 * * *', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-market-pulse', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);

-- Daily: Fred (06:00)
SELECT cron.schedule('ingest-fred-daily', '0 6 * * *', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fred', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);

-- Daily: Fiscal Data (06:30)
SELECT cron.schedule('ingest-fiscaldata-daily', '30 6 * * *', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fiscaldata', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);

-- Daily: Gold (18:00)
SELECT cron.schedule('ingest-gold-daily', '0 18 * * *', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-gold', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);

-- Every 6 Hours: News Headlines
SELECT cron.schedule('ingest-macro-news-headlines', '0 */6 * * *', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-macro-news-headlines', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);

-- Weekly: ECB (Mon 10:00)
SELECT cron.schedule('ingest-ecb-weekly', '0 10 * * 1', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-ecb-balance-sheet', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);

-- Weekly: BoJ (Mon 10:05)
SELECT cron.schedule('ingest-boj-weekly', '5 10 * * 1', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-boj-balance-sheet', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);

-- Monthly: IMF SDR (1st 08:00)
SELECT cron.schedule('ingest-imf-sdr-monthly', '0 8 1 * *', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-sdr', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);

-- Daily: Precious Divergence (19:00)
SELECT cron.schedule('ingest-precious-divergence-daily', '0 19 * * *', 
    $$ SELECT net.http_post(url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-precious-divergence', headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"}'::jsonb) $$);
