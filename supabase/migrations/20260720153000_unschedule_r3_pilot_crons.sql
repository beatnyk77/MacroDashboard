-- R3 pilot: unschedule crons for retired/debug/equity-adjacent functions deleted from repo.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE
  command ILIKE '%/functions/v1/api-auth-middleware%'
  OR command ILIKE '%/functions/v1/debug-logs%'
  OR command ILIKE '%/functions/v1/execute-restoration-sql%'
  OR command ILIKE '%/functions/v1/ingest-china-defaults%'
  OR command ILIKE '%/functions/v1/ingest-eurostat-debt%'
  OR command ILIKE '%/functions/v1/ingest-financial-hubs-gold%'
  OR command ILIKE '%/functions/v1/ingest-imf-gdp-per-capita%'
  OR command ILIKE '%/functions/v1/ingest-macro-events%'
  OR command ILIKE '%/functions/v1/llm-knowledge%'
  OR command ILIKE '%/functions/v1/ingest-us-edgar-fundamentals%'
  OR command ILIKE '%/functions/v1/ingest-corporate-debt-maturities%'
  OR command ILIKE '%/functions/v1/ingest-events%'
  OR command ILIKE '%/functions/v1/ingest-events-markers%'
  OR command ILIKE '%/functions/v1/ingest-asi%'
  OR jobname ILIKE '%edgar%'
  OR jobname ILIKE '%corporate-debt%'
  OR jobname ILIKE '%china-defaults%'
  OR jobname ILIKE '%eurostat-debt%'
  OR jobname ILIKE '%financial-hubs%'
  OR jobname ILIKE '%macro-events%'
  OR jobname ILIKE '%llm-knowledge%';
