-- ============================================================
-- Migration: Schedule cache-comtrade-data weekly cron
-- Date: 2026-06-05
-- Cron: Weekly Saturday 18:00 UTC (6 hours before ingest)
-- Purpose: Pre-populate cache so Sunday ingest runs fast
-- ============================================================

BEGIN;

-- Unschedule any existing cache job (idempotent)
DO $$
BEGIN
    PERFORM cron.unschedule('cache-comtrade-weekly');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule cache refresh: Saturday 18:00 UTC
-- (6 hours before Sunday 07:00 ingest, allows timeout without impacting ingest)
SELECT cron.schedule(
    'cache-comtrade-weekly',
    '0 18 * * 6',
    format(
        'SELECT net.http_post(' ||
        'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/cache-comtrade-data'', ' ||
        'headers := jsonb_build_object(' ||
        '''Content-Type'', ''application/json'', ' ||
        '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SERVICE_ROLE_KEY'' LIMIT 1)' ||
        '), ' ||
        'body := ''{}''::jsonb, ' ||
        'timeout_milliseconds := 300000' ||
        ') AS request_id;'
    )
);

COMMIT;
