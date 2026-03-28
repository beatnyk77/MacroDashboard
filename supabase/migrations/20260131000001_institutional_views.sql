-- =====================================================
-- Institutional Views
-- =====================================================

-- 1. Offshore Dollar Stress View
-- Updated: Use SOFR_OIS_SPREAD as primary indicator (TED_SPREAD deprecated - LIBOR discontinued)
CREATE OR REPLACE VIEW vw_offshore_dollar_stress AS
WITH sofr_ois AS (
  SELECT as_of_date, value AS sofr_ois_spread
  FROM metric_observations
  WHERE metric_id = 'SOFR_OIS_SPREAD'
),
ed_front AS (
  SELECT as_of_date, value AS front_px
  FROM metric_observations
  WHERE metric_id = 'ED_F_FRONT'
),
ed_deferred AS (
  SELECT as_of_date, value AS deferred_px
  FROM metric_observations
  WHERE metric_id = 'ED_F_DEFERRED'
),
slope_data AS (
  SELECT
    f.as_of_date,
    (d.deferred_px - f.front_px) * 100 AS slope_bps
  FROM ed_front f
  JOIN ed_deferred d ON f.as_of_date = d.as_of_date
)
SELECT
  COALESCE(so.as_of_date, s.as_of_date) AS as_of_date,
  so.sofr_ois_spread,
  s.slope_bps,
  -- Freshness based on SOFR-OIS data (most critical)
  CASE WHEN so.as_of_date = CURRENT_DATE THEN 'fresh' ELSE 'lagged' END AS status
FROM sofr_ois so
FULL OUTER JOIN slope_data s ON so.as_of_date = s.as_of_date
ORDER BY as_of_date DESC;

-- 2. Credit Creation Pulse View
CREATE OR REPLACE VIEW vw_credit_creation_pulse AS
WITH credit_metrics AS (
  SELECT 
    metric_id,
    as_of_date,
    value,
    split_part(metric_id, '_', 1) AS country_code
  FROM metric_observations
  WHERE metric_id IN ('US_CREDIT_TOTAL', 'CN_CREDIT_TOTAL', 'IN_CREDIT_TOTAL', 'EU_CREDIT_TOTAL', 'JP_CREDIT_TOTAL')
),
deltas AS (
  SELECT 
    country_code,
    as_of_date,
    value,
    value - LAG(value, 12) OVER (PARTITION BY country_code ORDER BY as_of_date) AS change_12m
  FROM credit_metrics
),
stats AS (
  SELECT 
    country_code,
    as_of_date,
    value,
    change_12m,
    AVG(change_12m) OVER (PARTITION BY country_code ORDER BY as_of_date ROWS BETWEEN 252 PRECEDING AND CURRENT ROW) AS avg_change,
    STDDEV(change_12m) OVER (PARTITION BY country_code ORDER BY as_of_date ROWS BETWEEN 252 PRECEDING AND CURRENT ROW) AS std_change
  FROM deltas
)
SELECT 
  country_code,
  as_of_date,
  value AS current_stock,
  change_12m,
  (change_12m - avg_change) / NULLIF(std_change, 0) AS impulse_z_score
FROM stats
ORDER BY as_of_date DESC;

-- 3. Geopolitical Risk Index View
CREATE OR REPLACE VIEW vw_geopolitical_risk_index AS
WITH vix AS (
  SELECT as_of_date, value AS vix_val
  FROM metric_observations
  WHERE metric_id = '^VIX'
),
move AS (
  SELECT as_of_date, value AS move_val
  FROM metric_observations
  WHERE metric_id = 'MOVE_INDEX'
),
gold AS (
  SELECT as_of_date, value AS gold_val
  FROM metric_observations
  WHERE metric_id = 'GOLD_PRICE_USD'
),
all_dates AS (
  SELECT as_of_date FROM vix
  UNION SELECT as_of_date FROM move
  UNION SELECT as_of_date FROM gold
),
z_scores AS (
  SELECT 
    d.as_of_date,
    (v.vix_val - AVG(v.vix_val) OVER (ORDER BY d.as_of_date ROWS BETWEEN 252 PRECEDING AND CURRENT ROW)) 
      / NULLIF(STDDEV(v.vix_val) OVER (ORDER BY d.as_of_date ROWS BETWEEN 252 PRECEDING AND CURRENT ROW), 0) AS vix_z,
    (m.move_val - AVG(m.move_val) OVER (ORDER BY d.as_of_date ROWS BETWEEN 252 PRECEDING AND CURRENT ROW)) 
      / NULLIF(STDDEV(m.move_val) OVER (ORDER BY d.as_of_date ROWS BETWEEN 252 PRECEDING AND CURRENT ROW), 0) AS move_z,
    (g.gold_val - AVG(g.gold_val) OVER (ORDER BY d.as_of_date ROWS BETWEEN 252 PRECEDING AND CURRENT ROW)) 
      / NULLIF(STDDEV(g.gold_val) OVER (ORDER BY d.as_of_date ROWS BETWEEN 252 PRECEDING AND CURRENT ROW), 0) AS gold_z
  FROM all_dates d
  LEFT JOIN vix v ON d.as_of_date = v.as_of_date
  LEFT JOIN move m ON d.as_of_date = m.as_of_date
  LEFT JOIN gold g ON d.as_of_date = g.as_of_date
)
SELECT 
  as_of_date,
  vix_z,
  move_z,
  gold_z,
  (COALESCE(vix_z, 0) + COALESCE(move_z, 0) + COALESCE(gold_z, 0)) / 3 AS composite_z_score
FROM z_scores
WHERE vix_z IS NOT NULL OR move_z IS NOT NULL OR gold_z IS NOT NULL
ORDER BY as_of_date DESC;
