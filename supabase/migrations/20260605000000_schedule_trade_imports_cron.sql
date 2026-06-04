-- ============================================================
-- Migration: Schedule ingest-trade-imports + immediate backfill
-- Date: 2026-06-05
-- Cron: Weekly Sunday 07:00 UTC (after ingest-un-comtrade at 06:00)
-- ============================================================

BEGIN;

-- 1. Unschedule any existing job (idempotent re-runs)
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-trade-imports-weekly');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Schedule weekly run
SELECT cron.schedule(
    'ingest-trade-imports-weekly',
    '0 7 * * 0',
    format(
        'SELECT net.http_post(' ||
        'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports'', ' ||
        'headers := jsonb_build_object(' ||
        '''Content-Type'', ''application/json'', ' ||
        '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1)' ||
        '), ' ||
        'body := ''{}''::jsonb, ' ||
        'timeout_milliseconds := 120000' ||
        ') AS request_id;'
    )
);

-- 3. Immediate one-time backfill — force=false so IND/USA are skipped
SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
            SELECT decrypted_secret
            FROM vault.decrypted_secrets
            WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
            LIMIT 1
        )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
) AS request_id;

COMMIT;
