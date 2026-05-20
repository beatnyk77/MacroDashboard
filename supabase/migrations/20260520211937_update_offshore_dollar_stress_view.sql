-- Drop the legacy view and recreate it to safely change the column names from ted_spread to sofr_ois_spread
DROP VIEW IF EXISTS public.vw_offshore_dollar_stress CASCADE;

CREATE VIEW public.vw_offshore_dollar_stress AS
SELECT 
  as_of_date,
  value AS sofr_ois_spread,
  NULL::numeric AS slope_bps,
  CASE 
    WHEN as_of_date >= CURRENT_DATE - INTERVAL '3 days' THEN 'fresh'::text
    ELSE 'lagged'::text
  END AS status
FROM metric_observations
WHERE metric_id = 'SOFR_OIS_SPREAD'
ORDER BY as_of_date DESC;
