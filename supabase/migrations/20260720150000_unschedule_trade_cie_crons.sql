-- Minimalist scope prune R2: unschedule crons for commercial trade + CIE functions.
-- Function source deleted in repo; remote delete is CLI-side.
-- Keep historical tables parked (no DROP).

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE
  -- Trade / Comtrade / export scout / HS
  command ILIKE '%/functions/v1/cache-comtrade-data%'
  OR command ILIKE '%/functions/v1/compute-hs-opportunity-scores%'
  OR command ILIKE '%/functions/v1/fetch-hs-demand%'
  OR command ILIKE '%/functions/v1/generate-export-scout%'
  OR command ILIKE '%/functions/v1/ingest-trade-global%'
  OR command ILIKE '%/functions/v1/ingest-trade-global-pulse%'
  OR command ILIKE '%/functions/v1/ingest-trade-gravity%'
  OR command ILIKE '%/functions/v1/ingest-trade-imports%'
  OR command ILIKE '%/functions/v1/ingest-uk-trade-ots%'
  OR command ILIKE '%/functions/v1/ingest-uk-trade-traders%'
  OR command ILIKE '%/functions/v1/ingest-un-comtrade%'
  -- CIE equities pack
  OR command ILIKE '%/functions/v1/compute-cie-macro-scores%'
  OR command ILIKE '%/functions/v1/ingest-cie-deals%'
  OR command ILIKE '%/functions/v1/ingest-cie-fundamentals%'
  OR command ILIKE '%/functions/v1/ingest-cie-ipos%'
  OR command ILIKE '%/functions/v1/ingest-cie-promoters%'
  OR command ILIKE '%/functions/v1/ingest-cie-short-selling%'
  OR command ILIKE '%/functions/v1/ingest-nse-flows%'
  OR jobname ILIKE '%comtrade%'
  OR jobname ILIKE '%export-scout%'
  OR jobname ILIKE '%trade-global%'
  OR jobname ILIKE '%trade-imports%'
  OR jobname ILIKE '%trade-gravity%'
  OR jobname ILIKE '%uk-trade%'
  OR jobname ILIKE '%hs-opportunity%'
  OR jobname ILIKE '%hs-demand%'
  OR jobname ILIKE '%cie-%'
  OR jobname ILIKE '%nse-flows%';
