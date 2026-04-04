-- Migration: Schedule Currency Wars Ingestion
-- Purpose: Automate currency wars data collection from FRED every 6 hours
-- Dependencies: Requires ingest-currency-wars Edge Function to be deployed

-- Recreate the helper function temporarily if it doesn't exist
CREATE OR REPLACE FUNCTION public.schedule_standard_cron(
    p_job_name TEXT,
    p_schedule TEXT,
    p_function_name TEXT
) RETURNS VOID AS $$
BEGIN
    -- Unschedule existing to be safe
    PERFORM cron.unschedule(p_job_name);
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Overwrite with the full version
CREATE OR REPLACE FUNCTION public.schedule_standard_cron(
    p_job_name TEXT,
    p_schedule TEXT,
    p_function_name TEXT
) RETURNS VOID AS $$
BEGIN
    PERFORM cron.schedule(
        p_job_name,
        p_schedule,
        format(
            'SELECT net.http_post(' ||
            'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/%s'', ' ||
            'headers := jsonb_build_object(' ||
            '''Content-Type'', ''application/json'', ' ||
            '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1)' ||
            '), ' ||
            'body := ''{}''::jsonb, ' ||
            'timeout_milliseconds := 60000' ||
            ') AS request_id;',
            p_function_name
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule ingest-currency-wars to run every 6 hours
SELECT public.schedule_standard_cron('ingest-currency-wars-every-6h', '0 */6 * * *', 'ingest-currency-wars');

-- Cleanup
DROP FUNCTION IF EXISTS public.schedule_standard_cron(TEXT, TEXT, TEXT);
