-- Update vw_country_terminal to include EU (Euro Area) and keep the list synchronized
-- Re-applying the view definition with 'EU' added to all internal filters

CREATE OR REPLACE VIEW vw_country_terminal AS
WITH
latest_obs AS (
  SELECT DISTINCT ON (metric_id) metric_id, as_of_date, value
  FROM metric_observations ORDER BY metric_id, as_of_date DESC
),
policy_rates AS (
  SELECT DISTINCT ON (c.code) c.code AS iso, lo.value AS central_bank_rate_pct, lo.as_of_date AS central_bank_rate_date
  FROM g20_countries c
  LEFT JOIN latest_obs lo ON lo.metric_id = c.code || '_POLICY_RATE' OR lo.metric_id = c.code || '_SHORTTERM_INTEREST_RATE'
  WHERE c.code IN (
    'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
    'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE',
    'EU'
  )
  ORDER BY c.code, lo.as_of_date DESC NULLS LAST
),
yields_2y AS (
  SELECT DISTINCT ON (country) country AS iso, yield_pct AS yield_2y_pct, as_of_date AS yield_2y_date
  FROM yield_curves WHERE tenor = '2Y' AND yield_pct IS NOT NULL ORDER BY country, as_of_date DESC
),
yields_10y AS (
  SELECT DISTINCT ON (country) country AS iso, yield_pct AS yield_10y_pct, as_of_date AS yield_10y_date
  FROM yield_curves WHERE tenor = '10Y' AND yield_pct IS NOT NULL ORDER BY country, as_of_date DESC
),
fx_reserves AS (
  SELECT DISTINCT ON (country_code) country_code AS iso, fx_reserves_usd / 1e9 AS fx_reserves_bn, as_of_date AS fx_reserves_date
  FROM country_reserves WHERE fx_reserves_usd IS NOT NULL ORDER BY country_code, as_of_date DESC
),
gold_reserves AS (
  SELECT DISTINCT ON (country_code) country_code AS iso, gold_tonnes, as_of_date AS gold_date
  FROM country_reserves WHERE gold_tonnes IS NOT NULL ORDER BY country_code, as_of_date DESC
),
gmd_metrics AS (
  SELECT
    iso,
    MAX(CASE WHEN metric_key = 'gdp_usd_bn'             THEN value END) AS gdp_usd_bn,
    MAX(CASE WHEN metric_key = 'gdp_yoy_pct'            THEN value END) AS gdp_yoy_pct,
    MAX(CASE WHEN metric_key = 'gdp_per_capita_usd'     THEN value END) AS gdp_per_capita_usd,
    MAX(CASE WHEN metric_key = 'population_mn'          THEN value END) AS population_mn,
    MAX(CASE WHEN metric_key = 'cpi_yoy_pct'            THEN value END) AS cpi_yoy_pct,
    MAX(CASE WHEN metric_key = 'unemployment_pct'       THEN value END) AS unemployment_pct,
    MAX(CASE WHEN metric_key = 'ca_gdp_pct'             THEN value END) AS ca_gdp_pct,
    MAX(CASE WHEN metric_key = 'exports_gdp_pct'        THEN value END) AS exports_gdp_pct,
    MAX(CASE WHEN metric_key = 'imports_gdp_pct'        THEN value END) AS imports_gdp_pct,
    MAX(CASE WHEN metric_key = 'gov_debt_gdp_pct'       THEN value END) AS gov_debt_gdp_pct,
    MAX(CASE WHEN metric_key = 'budget_deficit_gdp_pct' THEN value END) AS budget_deficit_gdp_pct
  FROM country_metrics
  WHERE source = 'GMD'
    AND iso IN (
      'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
      'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE',
      'EU'
    )
  GROUP BY iso
)
SELECT
  c.code AS iso,
  c.name AS country_name,
  c.region,
  pr.central_bank_rate_pct,
  pr.central_bank_rate_date,
  y2.yield_2y_pct, y2.yield_2y_date,
  y10.yield_10y_pct, y10.yield_10y_date,
  fx.fx_reserves_bn, fx.fx_reserves_date,
  g.gold_tonnes, g.gold_date,
  -- GMD supplements (annual fundamentals)
  gmd.gdp_usd_bn,
  gmd.gdp_yoy_pct,
  gmd.gdp_per_capita_usd,
  gmd.population_mn,
  gmd.cpi_yoy_pct,
  gmd.unemployment_pct,
  gmd.ca_gdp_pct,
  gmd.exports_gdp_pct,
  gmd.imports_gdp_pct,
  gmd.gov_debt_gdp_pct,
  gmd.budget_deficit_gdp_pct,
  -- Derived slope in bps
  CASE WHEN y2.yield_2y_pct IS NOT NULL AND y10.yield_10y_pct IS NOT NULL
    THEN ROUND((y10.yield_10y_pct - y2.yield_2y_pct) * 100, 2)
    ELSE NULL
  END AS yield_slope_2s10s,
  NOW() AS updated_at
FROM g20_countries c
LEFT JOIN policy_rates pr ON pr.iso = c.code
LEFT JOIN yields_2y y2 ON y2.iso = c.code
LEFT JOIN yields_10y y10 ON y10.iso = c.code
LEFT JOIN fx_reserves fx ON fx.iso = c.code
LEFT JOIN gold_reserves g ON g.iso = c.code
LEFT JOIN gmd_metrics gmd ON gmd.iso = c.code
WHERE c.code IN (
  'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE',
  'EU'
)
ORDER BY c.code;
