-- Institutional Hardening Phase 3: Pruning Retail Telemetry

-- Drop associated cron jobs
SELECT cron.unschedule('ingest-401k-distress') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-401k-distress');
SELECT cron.unschedule('ingest-kalshi') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-kalshi');
SELECT cron.unschedule('ingest-prediction-markets') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-prediction-markets');
SELECT cron.unschedule('ingest-prediction-markets-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-prediction-markets-daily');

-- Drop retail-centric tables and data
DROP TABLE IF EXISTS public.us_labor_market CASCADE;
DROP TABLE IF EXISTS public.kalshi_fomc_probabilities CASCADE;
DROP TABLE IF EXISTS public.domeapi_markets CASCADE;
