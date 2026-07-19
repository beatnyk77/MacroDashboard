-- Credibility sprint: kill fabricated India macro snapshot producer.
-- UI unmounted from Terminal + IntelIndia; keep table for audit/rollback.

DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT jobid, jobname
    FROM cron.job
    WHERE jobname ILIKE '%india-macro-snapshot%'
       OR command ILIKE '%ingest-india-macro-snapshot%'
  LOOP
    PERFORM cron.unschedule(j.jobid);
    RAISE NOTICE 'Unscheduled cron job % (%)', j.jobname, j.jobid;
  END LOOP;
END $$;

COMMENT ON TABLE public.india_macro_snapshot IS
  'DEPRECATED 2026-07-20: populated by fabricated ingest-india-macro-snapshot. Do not surface as live telemetry. Cron unscheduled.';
