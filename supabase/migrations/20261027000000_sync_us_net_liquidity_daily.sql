-- Stale-data audit 2026-10-27: US_NET_LIQUIDITY_USD_BN (Macro Transmission HUD, "Net Liquidity")
-- was copied from public.vw_net_liquidity once by 20260912000000 and never again, so it froze at
-- 2026-09-10 while the view kept tracking WALCL - WTREGEN - RRPONTSYD. Sync it daily after the
-- FRED ingestion (06:00 UTC) and once now.

CREATE OR REPLACE FUNCTION public.sync_us_net_liquidity()
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO public.metric_observations (metric_id, as_of_date, value, z_score, percentile, last_updated_at, provenance, source_ref)
  SELECT
    'US_NET_LIQUIDITY_USD_BN',
    as_of_date,
    ROUND(value::numeric, 2),
    ROUND(z_score::numeric, 3),
    ROUND(percentile::numeric, 1),
    NOW(),
    'api_live',
    'WALCL - WTREGEN - RRPONTSYD'
  FROM public.vw_net_liquidity
  WHERE as_of_date IS NOT NULL AND value IS NOT NULL
  ORDER BY as_of_date DESC
  LIMIT 30
  ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
    value = EXCLUDED.value,
    z_score = EXCLUDED.z_score,
    percentile = EXCLUDED.percentile,
    source_ref = EXCLUDED.source_ref,
    last_updated_at = NOW();
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-us-net-liquidity-daily') THEN
    PERFORM cron.unschedule('sync-us-net-liquidity-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'sync-us-net-liquidity-daily',
  '45 6 * * *',
  $job$ SELECT public.sync_us_net_liquidity(); $job$
);

SELECT public.sync_us_net_liquidity();
