-- Migration: Fix Trade Intelligence Cron
-- Date: 2026-06-03
-- Cadence: Weekly (Sundays at 5:00 AM)
-- Auth: Standard service_role POST via vault

BEGIN;

-- 1. Unschedule legacy monthly GET cron job
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-trade-intelligence-pulse');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Reschedule as weekly authenticated POST job
SELECT cron.schedule(
    'ingest-trade-intelligence-pulse',
    '0 5 * * 0', -- 5:00 AM on Sunday every week
    format(
        'SELECT net.http_post(' ||
        'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-global-pulse'', ' ||
        'headers := jsonb_build_object(' ||
        '''Content-Type'', ''application/json'', ' ||
        '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1)' ||
        '), ' ||
        'body := ''{}''::jsonb, ' ||
        'timeout_milliseconds := 55000' ||
        ') AS request_id;'
    )
);

-- 3. Unschedule and schedule weekly authenticated POST job for ingest-un-comtrade (Semiconductors)
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-un-comtrade-weekly');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

SELECT cron.schedule(
    'ingest-un-comtrade-weekly',
    '0 6 * * 0', -- 6:00 AM on Sunday every week
    format(
        'SELECT net.http_post(' ||
        'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-un-comtrade?hsCode=8542&category=Semiconductors'', ' ||
        'headers := jsonb_build_object(' ||
        '''Content-Type'', ''application/json'', ' ||
        '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1)' ||
        '), ' ||
        'body := ''{}''::jsonb, ' ||
        'timeout_milliseconds := 55000' ||
        ') AS request_id;'
    )
);

COMMIT;
