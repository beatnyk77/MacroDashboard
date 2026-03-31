-- =====================================================
-- Migration: Schedule Weekly 13-F Ingestion
-- Created: 2026-03-31
-- Purpose: Run ingest-institutional-13f every Sunday 03:00 UTC
-- =====================================================

-- Note: Replace 'debdriyzfcwvgrhzzzre' with your actual Supabase project ref if different

SELECT cron.schedule(
    'ingest-institutional-13f-weekly',
    '0 3 * * 0',  -- Sunday 03:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-institutional-13f',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);

-- Optional: Add a daily health check for data freshness (not required but useful)
-- This can be added separately if needed
