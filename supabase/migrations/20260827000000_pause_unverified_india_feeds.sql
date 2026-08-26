-- The former India allocation and digitization workers wrote hand-entered or
-- synthetic values. Pause their schedules until verified source adapters exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-india-fiscal-allocation-monthly') THEN
    PERFORM cron.unschedule('ingest-india-fiscal-allocation-monthly');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-india-digitization-monthly') THEN
    PERFORM cron.unschedule('ingest-india-digitization-monthly');
  END IF;
END $$;

COMMENT ON TABLE public.india_fiscal_allocation IS
  'Source adapter paused 2026-08-27. Existing rows are historical context only until verified state and central fiscal data are ingested.';

COMMENT ON TABLE public.india_digitization_premium IS
  'Source adapter paused 2026-08-27. Existing rows are not current telemetry until direct RBI/NPCI observations are ingested.';
