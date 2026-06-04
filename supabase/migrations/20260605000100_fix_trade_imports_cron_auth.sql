-- ============================================================
-- Migration: Fix ingest-trade-imports cron auth (use correct vault secret name)
-- Date: 2026-06-05
-- Fix: SERVICE_ROLE_KEY not SUPABASE_SERVICE_ROLE_KEY
-- ============================================================

BEGIN;

-- 1. Unschedule the broken job
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-trade-imports-weekly');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Schedule with correct vault secret name
SELECT cron.schedule(
    'ingest-trade-imports-weekly',
    '0 7 * * 0',
    format(
        'SELECT net.http_post(' ||
        'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports'', ' ||
        'headers := jsonb_build_object(' ||
        '''Content-Type'', ''application/json'', ' ||
        '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SERVICE_ROLE_KEY'' LIMIT 1)' ||
        '), ' ||
        'body := ''{}''::jsonb, ' ||
        'timeout_milliseconds := 120000' ||
        ') AS request_id;'
    )
);

-- 3. Immediate backfill with correct vault secret
SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
            SELECT decrypted_secret
            FROM vault.decrypted_secrets
            WHERE name = 'SERVICE_ROLE_KEY'
            LIMIT 1
        )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
) AS request_id;

COMMIT;
