-- =====================================================
-- De-Dollarization View - UI Consumption
-- =====================================================
-- Pre-computed view for de-dollarization tracking section
-- Includes latest values, QoQ deltas, and staleness flags
-- =====================================================

CREATE OR REPLACE VIEW vw_dedollarization AS
WITH latest_shares AS (
  SELECT DISTINCT ON (metric_id)
    metric_id,
    as_of_date,
    value,
    z_score,
    percentile,
    staleness_flag,
    last_updated_at
  FROM metric_observations
  WHERE metric_id IN (
    'GLOBAL_USD_SHARE_PCT', 
    'GLOBAL_EUR_SHARE_PCT', 
    'GLOBAL_RMB_SHARE_PCT', 
    'GLOBAL_OTHER_SHARE_PCT',
    'GLOBAL_GOLD_SHARE_PCT', 
    'GLOBAL_GOLD_HOLDINGS_USD'
  )
  ORDER BY metric_id, as_of_date DESC
),
qoq_deltas AS (
  SELECT 
    metric_id,
    as_of_date,
    value,
    value - LAG(value, 1) OVER (PARTITION BY metric_id ORDER BY as_of_date) AS delta_qoq
  FROM metric_observations
  WHERE metric_id IN (
    'GLOBAL_USD_SHARE_PCT', 
    'GLOBAL_EUR_SHARE_PCT', 
    'GLOBAL_RMB_SHARE_PCT', 
    'GLOBAL_OTHER_SHARE_PCT',
    'GLOBAL_GOLD_SHARE_PCT', 
    'GLOBAL_GOLD_HOLDINGS_USD'
  )
),
yoy_deltas AS (
  SELECT 
    metric_id,
    as_of_date,
    value,
    value - LAG(value, 4) OVER (PARTITION BY metric_id ORDER BY as_of_date) AS delta_yoy,
    ((value - LAG(value, 4) OVER (PARTITION BY metric_id ORDER BY as_of_date)) 
      / NULLIF(LAG(value, 4) OVER (PARTITION BY metric_id ORDER BY as_of_date), 0)) * 100 AS delta_yoy_pct
  FROM metric_observations
  WHERE metric_id IN (
    'GLOBAL_USD_SHARE_PCT', 
    'GLOBAL_EUR_SHARE_PCT', 
    'GLOBAL_RMB_SHARE_PCT', 
    'GLOBAL_OTHER_SHARE_PCT',
    'GLOBAL_GOLD_SHARE_PCT', 
    'GLOBAL_GOLD_HOLDINGS_USD'
  )
)
SELECT 
  m.id AS metric_id,
  m.name AS metric_name,
  m.category,
  m.tier,
  m.unit,
  m.unit_label,
  m.native_frequency,
  m.display_frequency,
  m.expected_interval_days,
  m.methodology_note,
  ls.as_of_date,
  ls.value,
  qd.delta_qoq,
  yd.delta_yoy,
  yd.delta_yoy_pct,
  ls.z_score,
  ls.percentile,
  COALESCE(
    ls.staleness_flag,
    CASE 
      WHEN EXTRACT(EPOCH FROM (NOW() - ls.last_updated_at)) / 86400 <= m.expected_interval_days THEN 'fresh'
      WHEN EXTRACT(EPOCH FROM (NOW() - ls.last_updated_at)) / 86400 <= m.expected_interval_days * 2 THEN 'lagged'
      ELSE 'very_lagged'
    END
  ) AS staleness_flag,
  ls.last_updated_at,
  EXTRACT(EPOCH FROM (NOW() - ls.last_updated_at)) / 86400 AS days_since_update
FROM metrics m
LEFT JOIN latest_shares ls ON m.id = ls.metric_id
LEFT JOIN qoq_deltas qd ON m.id = qd.metric_id AND ls.as_of_date = qd.as_of_date
LEFT JOIN yoy_deltas yd ON m.id = yd.metric_id AND ls.as_of_date = yd.as_of_date
WHERE m.category = 'de_dollarization' AND m.is_active = TRUE
ORDER BY 
  CASE 
    WHEN m.id = 'GLOBAL_USD_SHARE_PCT' THEN 1
    WHEN m.id = 'GLOBAL_GOLD_SHARE_PCT' THEN 2
    WHEN m.id = 'GLOBAL_RMB_SHARE_PCT' THEN 3
    WHEN m.id = 'GLOBAL_EUR_SHARE_PCT' THEN 4
    WHEN m.id = 'GLOBAL_GOLD_HOLDINGS_USD' THEN 5
    ELSE 6
  END;

COMMENT ON VIEW vw_dedollarization IS 'De-dollarization metrics with QoQ/YoY deltas and staleness tracking';
