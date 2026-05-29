-- Restore and update the UPI Autopay cron job
-- This was accidentally removed during a bulk cron auth standardization and is now set to run daily
-- to account for varying publication dates from NPCI.

-- Unschedule just in case it exists
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-upi-autopay-daily');
    PERFORM cron.unschedule('ingest-upi-autopay-monthly');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule it daily at 8:30 AM
SELECT cron.schedule(
    'ingest-upi-autopay-daily',
    '30 8 * * *',
    format(
        'SELECT net.http_post(' ||
        'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-upi-autopay'', ' ||
        'headers := jsonb_build_object(' ||
        '''Content-Type'', ''application/json'', ' ||
        '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1)' ||
        '), ' ||
        'body := ''{}''::jsonb, ' ||
        'timeout_milliseconds := 55000' ||
        ') AS request_id;'
    )
);
