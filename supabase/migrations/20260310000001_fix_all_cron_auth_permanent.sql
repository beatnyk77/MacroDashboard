-- Migration: Fix all cron auth permanent
-- Standardizes all cron jobs to use vault.decrypted_secrets for service_role authentication
-- Adds missing schedules for Newsletter and Weekly Narrative

-- 1. Unschedule ALL existing jobs to ensure a clean state
DO $$
BEGIN
    PERFORM cron.unschedule(jobname) FROM cron.job;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Define standard command template
-- We use net.http_post with service_role auth from vault
-- Timeout increased to 55s to prevent common Edge Function execution issues

-- Helper to schedule with standard auth
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
            'timeout_milliseconds := 55000' ||
            ') AS request_id;',
            p_function_name
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Reschedule all core ingestion jobs
SELECT public.schedule_standard_cron('ingest-market-pulse-daily', '0 1 * * *', 'ingest-market-pulse');
SELECT public.schedule_standard_cron('ingest-fred-daily', '0 6 * * *', 'ingest-fred');
SELECT public.schedule_standard_cron('ingest-fiscaldata-daily', '30 6 * * *', 'ingest-fiscaldata');
SELECT public.schedule_standard_cron('ingest-nyfed-markets-daily', '0 12 * * *', 'ingest-nyfed-markets');
SELECT public.schedule_standard_cron('ingest-macro-news-headlines', '0 */6 * * *', 'ingest-macro-news-headlines');
SELECT public.schedule_standard_cron('ingest-ecb-weekly', '0 10 * * 1', 'ingest-ecb-balance-sheet');
SELECT public.schedule_standard_cron('ingest-boj-weekly', '5 10 * * 1', 'ingest-boj-balance-sheet');
SELECT public.schedule_standard_cron('ingest-imf-sdr-monthly', '0 8 1 * *', 'ingest-imf-sdr');
SELECT public.schedule_standard_cron('ingest-precious-divergence-daily', '0 19 * * *', 'ingest-precious-divergence');
SELECT public.schedule_standard_cron('check-data-health-daily', '0 7 * * *', 'check-data-health');
SELECT public.schedule_standard_cron('ingest-copper-gold-ratio-daily', '0 15 * * *', 'ingest-copper-gold-ratio');
SELECT public.schedule_standard_cron('ingest-bis-reer-monthly', '0 6 15 * *', 'ingest-bis-reer');
SELECT public.schedule_standard_cron('ingest-imf-ca-monthly', '0 8 20 * *', 'ingest-imf-current-account');
SELECT public.schedule_standard_cron('ingest-oecd-cli-monthly', '0 9 10 * *', 'ingest-oecd-cli');
SELECT public.schedule_standard_cron('ingest-institutional-loans-monthly', '0 4 1 * *', 'ingest-institutional-loans');
SELECT public.schedule_standard_cron('ingest-trade-global-monthly', '30 6 15 * *', 'ingest-trade-global');
SELECT public.schedule_standard_cron('ingest-us-treasury-auctions-weekly', '0 9 * * 1', 'ingest-us-treasury-auctions');
SELECT public.schedule_standard_cron('ingest-us-fiscal-stress-monthly', '0 10 5 * *', 'ingest-us-fiscal-stress');
SELECT public.schedule_standard_cron('ingest-india-fiscal-stress-monthly', '0 11 5 * *', 'ingest-india-fiscal-stress');
SELECT public.schedule_standard_cron('ingest-cb-gold-net-quarterly', '0 2 1 */3 *', 'ingest-cb-gold-net');
SELECT public.schedule_standard_cron('ingest-commodity-reserves-weekly', '0 0 * * 0', 'ingest-commodity-reserves');
SELECT public.schedule_standard_cron('ingest-nse-flows-daily', '30 13 * * 1-5', 'ingest-nse-flows');
SELECT public.schedule_standard_cron('ingest-india-energy-weekly', '0 0 * * 0', 'ingest-energy');

-- 4. NEW SCHEDULES: Regime Digest & Weekly Narrative
SELECT public.schedule_standard_cron('generate-newsletter-monthly', '30 0 1 * *', 'generate-newsletter');
SELECT public.schedule_standard_cron('ingest-weekly-narrative-weekly', '30 23 * * 0', 'ingest-weekly-narrative');

-- Cleanup
DROP FUNCTION public.schedule_standard_cron(TEXT, TEXT, TEXT);
