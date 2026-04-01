-- ============================================================
-- CIE Cron Schedules: Schedule CIE Edge Functions
-- Migration: 20260402000011_cie_cron_schedules.sql
-- 
-- Schedules two CIE pipeline jobs using the vault-based
-- auth pattern established in:
-- 20260310000001_fix_all_cron_auth_permanent.sql
--
-- Schedule (IST-adjusted):
--   ingest-cie-fundamentals:    18:00 UTC = 11:30 PM IST (after NSE market close)
--   compute-cie-macro-scores:   18:30 UTC = 00:00 IST midnight (after fundamentals)
-- ============================================================

-- 1. Helper Function (local to this migration)
CREATE OR REPLACE FUNCTION public.tmp_schedule_cie_cron(
    p_job_name TEXT,
    p_schedule TEXT,
    p_function_name TEXT
) RETURNS VOID AS $$
BEGIN
    -- Unschedule if exists
    PERFORM cron.unschedule(p_job_name) WHERE EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = p_job_name
    );

    -- Schedule with standard vault auth template
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

-- 2. Reschedule all CIE ingestion jobs
SELECT public.tmp_schedule_cie_cron('ingest-cie-fundamentals-daily', '0 18 * * 1-5', 'ingest-cie-fundamentals');
SELECT public.tmp_schedule_cie_cron('compute-cie-macro-scores-daily', '30 18 * * 1-5', 'compute-cie-macro-scores');

-- 3. Cleanup
DROP FUNCTION public.tmp_schedule_cie_cron(TEXT, TEXT, TEXT);

-- Verify
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM cron.job
    WHERE jobname IN ('ingest-cie-fundamentals-daily', 'compute-cie-macro-scores-daily');

    IF v_count = 2 THEN
        RAISE NOTICE 'SUCCESS: Both CIE cron jobs are now registered (count: %).', v_count;
    ELSE
        RAISE WARNING 'PARTIAL: Only % of 2 CIE cron jobs found after scheduling.', v_count;
    END IF;
END $$;
