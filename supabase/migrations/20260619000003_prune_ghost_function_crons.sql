-- Remove cron jobs for ghost edge functions (no deployed slug, no local code).
-- Frees scheduler noise; these jobs were firing 404s against missing functions.

SELECT cron.unschedule('ingest-capital-flows-monthly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-capital-flows-monthly');

SELECT cron.unschedule('ingest-country-gmd-supplement-quarterly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-country-gmd-supplement-quarterly');

SELECT cron.unschedule('ingest-g20-sovereign-monthly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-g20-sovereign-monthly');

SELECT cron.unschedule('ingest-institutional-13f-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-institutional-13f-weekly');

SELECT cron.unschedule('ingest-institutional-loans-monthly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-institutional-loans-monthly');

SELECT cron.unschedule('ingest-institutional-loans-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-institutional-loans-weekly');

SELECT cron.unschedule('ingest-mutual-funds-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-mutual-funds-daily');