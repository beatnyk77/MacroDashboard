-- Migration: Create cron job monitoring view
-- Provides a live snapshot of scheduler health and job status

CREATE OR REPLACE VIEW public.vw_cron_job_status AS
WITH last_runs AS (
    SELECT DISTINCT ON (jobid)
        jobid,
        status,
        return_message,
        start_time,
        end_time
    FROM cron.job_run_details
    ORDER BY jobid, start_time DESC
)
SELECT 
    j.jobid,
    j.jobname,
    j.schedule,
    lr.status as last_run_status,
    lr.return_message as last_run_message,
    lr.start_time as last_run_at,
    (SELECT start_time FROM cron.job_run_details WHERE jobid = j.jobid AND status = 'succeeded' ORDER BY start_time DESC LIMIT 1) as last_success_at,
    -- Calculate next run (rough estimate based on pg_cron internal logic)
    -- This is tricky in pure SQL without a custom extension, so we just show the schedule
    j.active
FROM cron.job j
LEFT JOIN last_runs lr ON j.jobid = lr.jobid;

GRANT SELECT ON public.vw_cron_job_status TO authenticated;
GRANT SELECT ON public.vw_cron_job_status TO anon;
GRANT SELECT ON public.vw_cron_job_status TO service_role;
