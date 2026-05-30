-- 20260531000001_compute_zscores.sql

-- Case C: Compute function doesn't exist.
-- This migration creates a function to compute 252-day rolling z-scores
-- and schedules it to run daily via pg_cron.

CREATE OR REPLACE FUNCTION public.compute_rolling_z_scores()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  WITH stats AS (
    SELECT 
      metric_id, 
      as_of_date,
      value,
      AVG(value) OVER w AS avg_val,
      STDDEV(value) OVER w AS std_val
    FROM metric_observations
    WHERE metric_id IN (
      'US_10Y_YIELD', 'US_2Y_YIELD', 'DXY_INDEX', 
      'SOFR_EFFR_SPREAD_BPS', 'COPPER_GOLD_RATIO', 
      'GOLD_COMEX_USD', 'US_10Y_TIPS_YIELD', 'CB_GOLD_NET'
    )
    WINDOW w AS (
      PARTITION BY metric_id 
      ORDER BY as_of_date 
      ROWS BETWEEN 251 PRECEDING AND CURRENT ROW
    )
  )
  UPDATE metric_observations m
  SET z_score = CASE WHEN s.std_val = 0 OR s.std_val IS NULL THEN 0 ELSE (m.value - s.avg_val) / s.std_val END
  FROM stats s
  WHERE m.metric_id = s.metric_id AND m.as_of_date = s.as_of_date
    AND m.metric_id IN (
      'US_10Y_YIELD', 'US_2Y_YIELD', 'DXY_INDEX', 
      'SOFR_EFFR_SPREAD_BPS', 'COPPER_GOLD_RATIO', 
      'GOLD_COMEX_USD', 'US_10Y_TIPS_YIELD', 'CB_GOLD_NET'
    )
    -- Only update if NULL or changed to avoid unnecessary writes
    AND (m.z_score IS NULL OR m.z_score != CASE WHEN s.std_val = 0 OR s.std_val IS NULL THEN 0 ELSE (m.value - s.avg_val) / s.std_val END);
END;
$$;

-- Schedule it to run daily at 06:00 UTC (before the daily macro signal runs at 06:30)
SELECT cron.schedule(
    'compute-zscores-daily',
    '0 6 * * *',
    $$SELECT public.compute_rolling_z_scores()$$
);
