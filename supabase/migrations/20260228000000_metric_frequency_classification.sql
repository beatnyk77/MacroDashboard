-- Add frequency_type to metrics to distinguish between Structural (Annual/Quarterly) and High-Frequency (Daily/Weekly/Monthly)
-- This prevents false-positive "Lagged" alerts for data that is inherently slow-moving.

ALTER TABLE metrics ADD COLUMN IF NOT EXISTS frequency_type TEXT DEFAULT 'high_frequency' CHECK (frequency_type IN ('high_frequency', 'structural', 'manual'));

-- Classify known structural metrics
UPDATE metrics 
SET frequency_type = 'structural',
    expected_interval_days = 400 -- Default to 400 days for annual structural data
WHERE id IN (
    'G20_DEBT_GDP_PCT', 
    'G20_INFLATION_YOY', 
    'G20_INTEREST_BURDEN_PCT',
    'US_DEBT_GDP',
    'DEBT_TO_GOLD_G20_AVG'
);

-- Classify BIS / OECD Structural Metrics
UPDATE metrics
SET frequency_type = 'structural',
    expected_interval_days = 45 -- Monthly but with lag
WHERE id LIKE 'REER_INDEX_%' OR id LIKE 'OECD_CLI_%' OR id LIKE 'BIS_LIQUIDITY_%';

-- Update vw_latest_metrics to be more lenient for structural data
CREATE OR REPLACE VIEW vw_latest_metrics AS
WITH latest_obs AS (
  SELECT DISTINCT ON (metric_id)
    metric_id,
    as_of_date,
    value,
    z_score,
    percentile,
    delta_wow,
    delta_mom,
    last_updated_at,
    staleness_flag,
    composite_version
  FROM metric_observations
  ORDER BY metric_id, as_of_date DESC
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
  m.frequency_type,
  lo.as_of_date,
  lo.value,
  lo.z_score,
  lo.percentile,
  lo.delta_wow,
  lo.delta_mom,
  lo.last_updated_at,
  COALESCE(
    lo.staleness_flag,
    CASE 
      -- Structural metrics: 1.5x interval is LAGGED, 3x is VERY_LAGGED
      WHEN m.frequency_type = 'structural' THEN
        CASE
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 1.5 THEN 'fresh'
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 3.0 THEN 'lagged'
          ELSE 'very_lagged'
        END
      -- High-frequency metrics: 1.1x interval is LAGGED, 2x is VERY_LAGGED
      ELSE
        CASE 
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 1.1 THEN 'fresh'
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 2.0 THEN 'lagged'
          ELSE 'very_lagged'
        END
    END
  ) AS staleness_flag,
  EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 AS days_since_update,
  lo.composite_version
FROM metrics m
LEFT JOIN latest_obs lo ON m.id = lo.metric_id
WHERE m.is_active = TRUE;

-- Create vw_data_staleness_monitor for Health Check
CREATE OR REPLACE VIEW vw_data_staleness_monitor AS
SELECT 
  metric_id,
  metric_name,
  days_since_update::INTEGER,
  expected_interval_days,
  frequency_type,
  UPPER(staleness_flag) as status
FROM vw_latest_metrics;
