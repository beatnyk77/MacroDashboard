-- Migration: Create country_terminal view for country profile pages
-- Creates a unified view joining G20 countries with their latest macro metrics
-- Uses ONLY existing FRED data (no new API integrations)
-- Top 25 countries: G20 + major EMs (US, CN, IN, JP, DE, GB, FR, IT, CA, AU, BR, MX, RU, KR, ID, SA, TR, ZA, AR, SG, CH, TH, MY, AE, QA)

-- Drop view if exists to allow recreation
DROP VIEW IF EXISTS vw_country_terminal CASCADE;

-- =====================================================
-- View: vw_country_terminal
-- =====================================================
-- One row per Top 25 country with latest macro metrics
-- Data sources:
--   • metric_observations: FRED policy rates (US_POLICY_RATE, etc.)
--   • yield_curves: Sovereign yields (2Y, 10Y) from FRED/ECB/RBI
--   • country_reserves: FX reserves & gold (WGC/IMF)
-- Coverage guarantee: All 25 countries show as rows; NULLs indicate metric not available

CREATE OR REPLACE VIEW vw_country_terminal AS
WITH
-- Latest observation per metric_id (policy rates from metric_observations)
latest_obs AS (
  SELECT DISTINCT ON (metric_id)
    metric_id,
    as_of_date,
    value
  FROM metric_observations
  ORDER BY metric_id, as_of_date DESC
),

-- FRED policy rates: {ISO}_POLICY_RATE or {ISO}_SHORTTERM_INTEREST_RATE
-- Use latest per country (max as_of_date)
policy_rates AS (
  SELECT DISTINCT ON (c.code)
    c.code AS iso,
    lo.value AS central_bank_rate_pct,
    lo.as_of_date AS central_bank_rate_date
  FROM g20_countries c
  LEFT JOIN latest_obs lo
    ON lo.metric_id = c.code || '_POLICY_RATE'
    OR lo.metric_id = c.code || '_SHORTTERM_INTEREST_RATE'
  WHERE c.code IN (
    'US','CN','IN','JP','DE','GB','FR','IT','CA','AU',
    'BR','MX','RU','KR','ID','SA','TR','ZA','AR','SG',
    'CH','TH','MY','AE','QA'
  )
  ORDER BY c.code, lo.as_of_date DESC NULLS LAST
),

-- 2Y sovereign yields from yield_curves (most recent per country)
yields_2y AS (
  SELECT DISTINCT ON (country)
    country AS iso,
    yield_pct AS yield_2y_pct,
    as_of_date AS yield_2y_date
  FROM yield_curves
  WHERE tenor = '2Y'
    AND yield_pct IS NOT NULL
  ORDER BY country, as_of_date DESC
),

-- 10Y sovereign yields
yields_10y AS (
  SELECT DISTINCT ON (country)
    country AS iso,
    yield_pct AS yield_10y_pct,
    as_of_date AS yield_10y_date
  FROM yield_curves
  WHERE tenor = '10Y'
    AND yield_pct IS NOT NULL
  ORDER BY country, as_of_date DESC
),

-- FX reserves in $Bn - latest per country
fx_reserves AS (
  SELECT DISTINCT ON (country_code)
    country_code AS iso,
    fx_reserves_usd / 1000000000.0 AS fx_reserves_bn,
    as_of_date AS fx_reserves_date
  FROM country_reserves
  WHERE fx_reserves_usd IS NOT NULL
  ORDER BY country_code, as_of_date DESC
),

-- Gold reserves in tonnes - latest per country
gold_reserves AS (
  SELECT DISTINCT ON (country_code)
    country_code AS iso,
    gold_tonnes,
    as_of_date AS gold_date
  FROM country_reserves
  WHERE gold_tonnes IS NOT NULL
  ORDER BY country_code, as_of_date DESC
)

-- Combined wide view: one row per country with all metrics
SELECT
  -- Country identity
  c.code AS iso,
  c.name AS country_name,
  c.region,

  -- Policy rate (FRED)
  pr.central_bank_rate_pct,
  pr.central_bank_rate_date,

  -- 2Y yield
  y2.yield_2y_pct,
  y2.yield_2y_date,

  -- 10Y yield
  y10.yield_10y_pct,
  y10.yield_10y_date,

  -- Derived slope in bps (2s10s)
  CASE
    WHEN y2.yield_2y_pct IS NOT NULL AND y10.yield_10y_pct IS NOT NULL
    THEN ROUND((y2.yield_2y_pct - y10.yield_10y_pct) * 100, 2)
    ELSE NULL
  END AS yield_slope_2s10s,

  -- FX reserves ($Bn)
  fx.fx_reserves_bn,
  fx.fx_reserves_date,

  -- Gold reserves (tonnes)
  g.gold_tonnes,
  g.gold_date,

  -- Metadata
  NOW() AS updated_at

FROM (
  SELECT * FROM g20_countries
  WHERE code IN (
    'US','CN','IN','JP','DE','GB','FR','IT','CA','AU',
    'BR','MX','RU','KR','ID','SA','TR','ZA','AR','SG',
    'CH','TH','MY','AE','QA'
  )
) c

LEFT JOIN policy_rates pr ON pr.iso = c.code
LEFT JOIN yields_2y y2 ON y2.iso = c.code
LEFT JOIN yields_10y y10 ON y10.iso = c.code
LEFT JOIN fx_reserves fx ON fx.iso = c.code
LEFT JOIN gold_reserves g ON g.iso = c.code

ORDER BY c.code;

COMMENT ON VIEW vw_country_terminal IS
  'Country-level macro terminal view for Top 25 economies. Combined FRED policy rates (metric_observations), sovereign yields (yield_curves), and reserves (country_reserves). Columns may be NULL per-source availability.';
