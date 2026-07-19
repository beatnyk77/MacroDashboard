-- Free-tier prune: unschedule crons for retired edge functions.
-- Remote function delete is CLI-side; this stops 404 cron spam.
-- Keep historical table data (trade_gravity, financial_hubs_metrics, etc.).

-- UK trade pair (had active weekly crons)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'ingest-uk-trade-ots-weekly',
  'ingest-uk-trade-traders-weekly'
)
   OR command ILIKE '%/functions/v1/ingest-uk-trade-ots%'
   OR command ILIKE '%/functions/v1/ingest-uk-trade-traders%';

-- Recommendation-A deadweight (may have ad-hoc jobs; idempotent)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE command ILIKE '%/functions/v1/api-auth-middleware%'
   OR command ILIKE '%/functions/v1/ingest-china-defaults%'
   OR command ILIKE '%/functions/v1/ingest-eurostat-debt%'
   OR command ILIKE '%/functions/v1/ingest-financial-hubs-gold%'
   OR command ILIKE '%/functions/v1/ingest-imf-gdp-per-capita%'
   OR command ILIKE '%/functions/v1/ingest-macro-events%'
   OR command ILIKE '%/functions/v1/ingest-trade-gravity%';

-- Note: get-newsletter-data and CIE pack are retained.
