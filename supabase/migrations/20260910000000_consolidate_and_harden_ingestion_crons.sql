-- Migration: Consolidate and harden ingestion crons and missing schema columns
-- Date: 2026-09-10

-- 1. Add missing rate columns to rbi_liquidity_ops for RBI Money Market ingestion
ALTER TABLE public.rbi_liquidity_ops 
ADD COLUMN IF NOT EXISTS msf_rate numeric(5,2),
ADD COLUMN IF NOT EXISTS sdf_rate numeric(5,2);

-- 2. Add missing data_provenance column to global_refining_capacity
ALTER TABLE public.global_refining_capacity
ADD COLUMN IF NOT EXISTS data_provenance text DEFAULT 'eia_live';

-- 3. Unschedule duplicate ingest-fiscaldata (preserve ingest-fiscaldata-daily at 06:30 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-fiscaldata') THEN
    PERFORM cron.unschedule('ingest-fiscaldata');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-india-inflation-monthly') THEN
    PERFORM cron.unschedule('ingest-india-inflation-monthly');
  END IF;
END $$;

-- 4. Shift ingest-india-inflation-monthly schedule to 13th of month (post-MoSPI CPI release)
SELECT cron.schedule(
  'ingest-india-inflation-monthly',
  '0 7 13 * *',
  $$
  SELECT net.http_post(
    url     := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-inflation',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- 5. Unschedule redundant legacy ingest-india-liquidity-daily (handled by ingest-rbi-money-market)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-india-liquidity-daily') THEN
    PERFORM cron.unschedule('ingest-india-liquidity-daily');
  END IF;
END $$;

-- 6. Purge historical failure logs for discontinued pipelines
DELETE FROM public.ingestion_logs 
WHERE function_name IN ('ingest-uk-trade-traders', 'ingest-un-comtrade', 'compute-hs-opportunity-scores');
