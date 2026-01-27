-- =====================================================
-- Macro Intelligence Dashboard – UI Consumption Views
-- =====================================================
-- Pre-computed views for dashboard sections
-- Optimized for StateCard, HistoryChart, and ForensicTable components
-- =====================================================

-- =====================================================
-- View: vw_latest_metrics
-- =====================================================
-- Latest observation per metric with staleness tracking
-- Used by: StateCard components for hero metrics

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
      WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days THEN 'fresh'
      WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 2 THEN 'lagged'
      ELSE 'very_lagged'
    END
  ) AS staleness_flag,
  EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 AS days_since_update,
  lo.composite_version
FROM metrics m
LEFT JOIN latest_obs lo ON m.id = lo.metric_id
WHERE m.is_active = TRUE;

COMMENT ON VIEW vw_latest_metrics IS 'Latest observation per metric with computed staleness';

-- =====================================================
-- View: vw_gold_ratios
-- =====================================================
-- M2/Gold and SPX/Gold ratios with z-scores
-- Used by: Hard Asset Valuation section

CREATE OR REPLACE VIEW vw_gold_ratios AS
WITH gold_data AS (
  SELECT 
    as_of_date,
    value AS gold_price
  FROM metric_observations
  WHERE metric_id = 'GOLD_PRICE_USD'
),
m2_data AS (
  SELECT 
    as_of_date,
    value AS m2_value
  FROM metric_observations
  WHERE metric_id = 'US_M2'
),
spx_data AS (
  SELECT 
    as_of_date,
    value AS spx_value
  FROM metric_observations
  WHERE metric_id = 'SPX_INDEX'
),
ratios AS (
  SELECT 
    COALESCE(g.as_of_date, m.as_of_date, s.as_of_date) AS as_of_date,
    CASE WHEN g.gold_price > 0 THEN m.m2_value / g.gold_price ELSE NULL END AS m2_gold_ratio,
    CASE WHEN g.gold_price > 0 THEN s.spx_value / g.gold_price ELSE NULL END AS spx_gold_ratio
  FROM gold_data g
  FULL OUTER JOIN m2_data m ON g.as_of_date = m.as_of_date
  FULL OUTER JOIN spx_data s ON g.as_of_date = s.as_of_date
  WHERE g.gold_price IS NOT NULL OR m.m2_value IS NOT NULL OR s.spx_value IS NOT NULL
),
z_scores AS (
  SELECT 
    as_of_date,
    m2_gold_ratio,
    spx_gold_ratio,
    -- 252-day (1 year) z-scores
    (m2_gold_ratio - AVG(m2_gold_ratio) OVER (ORDER BY as_of_date ROWS BETWEEN 251 PRECEDING AND CURRENT ROW)) 
      / NULLIF(STDDEV(m2_gold_ratio) OVER (ORDER BY as_of_date ROWS BETWEEN 251 PRECEDING AND CURRENT ROW), 0) AS m2_gold_z_252d,
    (spx_gold_ratio - AVG(spx_gold_ratio) OVER (ORDER BY as_of_date ROWS BETWEEN 251 PRECEDING AND CURRENT ROW)) 
      / NULLIF(STDDEV(spx_gold_ratio) OVER (ORDER BY as_of_date ROWS BETWEEN 251 PRECEDING AND CURRENT ROW), 0) AS spx_gold_z_252d,
    -- 1260-day (5 year) z-scores
    (m2_gold_ratio - AVG(m2_gold_ratio) OVER (ORDER BY as_of_date ROWS BETWEEN 1259 PRECEDING AND CURRENT ROW)) 
      / NULLIF(STDDEV(m2_gold_ratio) OVER (ORDER BY as_of_date ROWS BETWEEN 1259 PRECEDING AND CURRENT ROW), 0) AS m2_gold_z_1260d,
    (spx_gold_ratio - AVG(spx_gold_ratio) OVER (ORDER BY as_of_date ROWS BETWEEN 1259 PRECEDING AND CURRENT ROW)) 
      / NULLIF(STDDEV(spx_gold_ratio) OVER (ORDER BY as_of_date ROWS BETWEEN 1259 PRECEDING AND CURRENT ROW), 0) AS spx_gold_z_1260d,
    -- Percentiles
    PERCENT_RANK() OVER (ORDER BY m2_gold_ratio) * 100 AS m2_gold_percentile,
    PERCENT_RANK() OVER (ORDER BY spx_gold_ratio) * 100 AS spx_gold_percentile
  FROM ratios
)
SELECT * FROM z_scores
WHERE as_of_date >= (SELECT MIN(as_of_date) FROM ratios) + INTERVAL '5 years'
ORDER BY as_of_date DESC;

COMMENT ON VIEW vw_gold_ratios IS 'M2/Gold and SPX/Gold ratios with 252-day and 1260-day z-scores';

-- =====================================================
-- View: vw_net_supply_private
-- =====================================================
-- Treasury net supply to private sector (issuance - SOMA)
-- Used by: Sovereign Stress section

CREATE OR REPLACE VIEW vw_net_supply_private AS
WITH treasury_issuance AS (
  SELECT 
    as_of_date,
    value AS gross_issuance
  FROM metric_observations
  WHERE metric_id = 'UST_GROSS_ISSUANCE'
),
soma_holdings AS (
  SELECT 
    as_of_date,
    value AS soma_change
  FROM metric_observations
  WHERE metric_id = 'FED_SOMA_CHANGE'
),
net_supply AS (
  SELECT 
    COALESCE(t.as_of_date, s.as_of_date) AS as_of_date,
    COALESCE(t.gross_issuance, 0) - COALESCE(s.soma_change, 0) AS net_supply_private,
    t.gross_issuance,
    s.soma_change
  FROM treasury_issuance t
  FULL OUTER JOIN soma_holdings s ON t.as_of_date = s.as_of_date
)
SELECT 
  as_of_date,
  net_supply_private,
  gross_issuance,
  soma_change,
  -- Week-over-week delta
  net_supply_private - LAG(net_supply_private, 7) OVER (ORDER BY as_of_date) AS delta_wow,
  -- Month-over-month delta
  net_supply_private - LAG(net_supply_private, 30) OVER (ORDER BY as_of_date) AS delta_mom,
  -- 90-day moving average
  AVG(net_supply_private) OVER (ORDER BY as_of_date ROWS BETWEEN 89 PRECEDING AND CURRENT ROW) AS ma_90d
FROM net_supply
ORDER BY as_of_date DESC;

COMMENT ON VIEW vw_net_supply_private IS 'Treasury net supply to private sector (gross issuance - SOMA change)';

-- =====================================================
-- View: vw_refinancing_cliff
-- =====================================================
-- Cumulative maturities over 6M, 12M, 24M windows
-- Used by: Refinancing risk visualization

CREATE OR REPLACE VIEW vw_refinancing_cliff AS
WITH maturity_schedule AS (
  SELECT 
    as_of_date,
    value AS maturity_amount,
    metadata->>'security_type' AS security_type
  FROM metric_observations
  WHERE metric_id LIKE 'UST_MATURITY_%'
    AND as_of_date >= CURRENT_DATE
)
SELECT 
  security_type,
  -- 6-month cumulative
  SUM(CASE WHEN as_of_date <= CURRENT_DATE + INTERVAL '6 months' THEN maturity_amount ELSE 0 END) AS maturity_6m,
  -- 12-month cumulative
  SUM(CASE WHEN as_of_date <= CURRENT_DATE + INTERVAL '12 months' THEN maturity_amount ELSE 0 END) AS maturity_12m,
  -- 24-month cumulative
  SUM(CASE WHEN as_of_date <= CURRENT_DATE + INTERVAL '24 months' THEN maturity_amount ELSE 0 END) AS maturity_24m,
  -- Total outstanding
  SUM(maturity_amount) AS total_outstanding
FROM maturity_schedule
GROUP BY security_type
ORDER BY maturity_6m DESC;

COMMENT ON VIEW vw_refinancing_cliff IS 'Cumulative Treasury maturities over 6M, 12M, 24M windows';

-- =====================================================
-- View: vw_g20_reserves_gold
-- =====================================================
-- G20 gold reserves with YoY changes and USD share trends
-- Used by: De-dollarization tracking section

CREATE OR REPLACE VIEW vw_g20_reserves_gold AS
WITH latest_reserves AS (
  SELECT DISTINCT ON (country_code)
    country_code,
    as_of_date,
    fx_reserves_usd,
    gold_tonnes,
    gold_usd,
    usd_share_pct
  FROM country_reserves
  ORDER BY country_code, as_of_date DESC
),
yoy_reserves AS (
  SELECT DISTINCT ON (country_code)
    country_code,
    as_of_date AS yoy_date,
    gold_tonnes AS gold_tonnes_yoy,
    usd_share_pct AS usd_share_pct_yoy
  FROM country_reserves
  WHERE as_of_date >= CURRENT_DATE - INTERVAL '1 year' - INTERVAL '30 days'
    AND as_of_date <= CURRENT_DATE - INTERVAL '1 year' + INTERVAL '30 days'
  ORDER BY country_code, as_of_date DESC
)
SELECT 
  g.code AS country_code,
  g.name AS country_name,
  g.is_major,
  g.region,
  lr.as_of_date,
  lr.fx_reserves_usd,
  lr.gold_tonnes,
  lr.gold_usd,
  lr.usd_share_pct,
  -- YoY changes
  CASE 
    WHEN yr.gold_tonnes_yoy > 0 
    THEN ((lr.gold_tonnes - yr.gold_tonnes_yoy) / yr.gold_tonnes_yoy) * 100 
    ELSE NULL 
  END AS gold_yoy_pct_change,
  lr.usd_share_pct - COALESCE(yr.usd_share_pct_yoy, lr.usd_share_pct) AS usd_share_change_yoy,
  -- Flags
  CASE WHEN lr.usd_share_pct < 50 THEN TRUE ELSE FALSE END AS is_dedollarizing,
  CASE WHEN lr.gold_tonnes > COALESCE(yr.gold_tonnes_yoy, 0) THEN TRUE ELSE FALSE END AS is_accumulating_gold
FROM g20_countries g
LEFT JOIN latest_reserves lr ON g.code = lr.country_code
LEFT JOIN yoy_reserves yr ON g.code = yr.country_code
ORDER BY lr.gold_tonnes DESC NULLS LAST;

COMMENT ON VIEW vw_g20_reserves_gold IS 'G20 gold reserves with YoY changes and de-dollarization flags';

-- =====================================================
-- Refresh materialized views (if needed in future)
-- =====================================================
-- Note: Currently using regular views for real-time data
-- If performance becomes an issue, convert to materialized views
-- and add refresh logic in edge functions
