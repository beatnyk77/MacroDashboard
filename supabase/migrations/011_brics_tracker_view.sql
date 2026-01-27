-- =====================================================
-- BRICS Tracker View
-- =====================================================

CREATE OR REPLACE VIEW vw_brics_tracker AS
WITH latest_obs AS (
  SELECT DISTINCT ON (metric_id)
    metric_id,
    as_of_date,
    value,
    z_score,
    percentile,
    last_updated_at
  FROM metric_observations
  WHERE metric_id LIKE 'BRICS_%'
  ORDER BY metric_id, as_of_date DESC
),
qoq_deltas AS (
  SELECT 
    metric_id,
    as_of_date,
    value - LAG(value, 1) OVER (PARTITION BY metric_id ORDER BY as_of_date) AS delta_qoq
  FROM metric_observations
  WHERE metric_id LIKE 'BRICS_%'
),
yoy_deltas AS (
  SELECT 
    metric_id,
    as_of_date,
    ((value - LAG(value, 4) OVER (PARTITION BY metric_id ORDER BY as_of_date)) / NULLIF(LAG(value, 4) OVER (PARTITION BY metric_id ORDER BY as_of_date), 0)) * 100 AS delta_yoy_pct
  FROM metric_observations
  WHERE metric_id LIKE 'BRICS_%'
)
SELECT 
  m.id AS metric_id,
  m.name AS metric_name,
  m.unit,
  m.unit_label,
  lo.as_of_date,
  lo.value,
  qd.delta_qoq,
  yd.delta_yoy_pct,
  lo.z_score,
  lo.percentile,
  CASE 
    WHEN lo.last_updated_at IS NULL THEN 'no_data'
    WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days THEN 'fresh'
    WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 2 THEN 'lagged'
    ELSE 'very_lagged'
  END AS staleness_flag,
  lo.last_updated_at
FROM metrics m
LEFT JOIN latest_obs lo ON m.id = lo.metric_id
LEFT JOIN qoq_deltas qd ON m.id = qd.metric_id AND lo.as_of_date = qd.as_of_date
LEFT JOIN yoy_deltas yd ON m.id = yd.metric_id AND lo.as_of_date = yd.as_of_date
WHERE m.id LIKE 'BRICS_%';

COMMENT ON VIEW vw_brics_tracker IS 'BRICS+ tracker metrics with QoQ/YoY deltas and staleness indicators';
