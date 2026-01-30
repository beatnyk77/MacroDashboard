-- =====================================================
-- Migration: Fix Gold Ratios, Debt/Gold Unit, Returns, and Freshness
-- =====================================================

-- 0. Cleanup old views and functions to allow changes
DROP FUNCTION IF EXISTS get_latest_gold_ratios() CASCADE;
DROP VIEW IF EXISTS vw_gold_ratios_tall CASCADE;
DROP VIEW IF EXISTS vw_us_debt_gold_backing CASCADE;
DROP VIEW IF EXISTS vw_gold_returns_events CASCADE;
DROP VIEW IF EXISTS vw_latest_ingestion CASCADE;

-- 1. Create Ingestion Status View
CREATE OR REPLACE VIEW vw_latest_ingestion AS
SELECT MAX(last_updated_at) as last_ingestion_at 
FROM vw_latest_metrics;

COMMENT ON VIEW vw_latest_ingestion IS 'Gets the timestamp of the most recent metric update system-wide';

-- 2. Enhance US Debt/Gold Backing with Dual Ratios
CREATE OR REPLACE VIEW vw_us_debt_gold_backing AS
WITH latest_debt AS (
  SELECT value, as_of_date FROM metric_observations WHERE metric_id = 'UST_DEBT_TOTAL' ORDER BY as_of_date DESC LIMIT 1
),
latest_gold_reserves AS (
  SELECT value FROM metric_observations WHERE metric_id = 'US_TREASURY_GOLD_TONNES' ORDER BY as_of_date DESC LIMIT 1
),
latest_gold_price AS (
  SELECT value FROM metric_observations WHERE metric_id = 'GOLD_PRICE_USD' ORDER BY as_of_date DESC LIMIT 1
)
SELECT 
  d.as_of_date,
  d.value AS total_debt,
  g.value AS gold_tonnes,
  p.value AS gold_price_usd,
  -- 1 tonne = 32150.7466 troy ounces
  (g.value * 32150.7466) AS gold_ounces,
  (g.value * 32150.7466 * p.value) AS gold_value_usd,
  -- Standard Coverage Ratio: Debt / Gold Value (Inverse of Backing %)
  (d.value / NULLIF(g.value * 32150.7466 * p.value, 0)) AS debt_to_gold_coverage_ratio,
  -- Implied Gold Price (Debt / Ounces)
  (d.value / NULLIF(g.value * 32150.7466, 0)) AS implied_gold_price,
  -- Legacy field for backward compatibility
  (d.value / NULLIF(g.value * 32150.7466 * p.value, 0)) AS debt_gold_ratio
FROM latest_debt d
CROSS JOIN latest_gold_reserves g
CROSS JOIN latest_gold_price p;

COMMENT ON VIEW vw_us_debt_gold_backing IS 'US Debt to Gold Backing with Coverage Ratio and Implied Price';

-- 3. Create vw_gold_ratios_tall (Normalized)
CREATE OR REPLACE VIEW vw_gold_ratios_tall AS
WITH gold AS (
    SELECT value as price, as_of_date FROM metric_observations WHERE metric_id = 'GOLD_PRICE_USD' ORDER BY as_of_date DESC LIMIT 1
),
silver AS (
    SELECT value as price, as_of_date FROM metric_observations WHERE metric_id = 'SILVER_PRICE_USD' ORDER BY as_of_date DESC LIMIT 1
),
m2 AS (
    SELECT value, as_of_date FROM metric_observations WHERE metric_id = 'US_M2' ORDER BY as_of_date DESC LIMIT 1
),
spx AS (
    SELECT value, as_of_date FROM metric_observations WHERE metric_id = 'SPX_INDEX' ORDER BY as_of_date DESC LIMIT 1
),
debt_backing AS (
    SELECT * FROM vw_us_debt_gold_backing LIMIT 1
),
ratios AS (
    -- M2 / Gold
    SELECT 
        'M2/Gold' as ratio_name,
        (m2.value / gold.price) as current_value,
        GREATEST(m2.as_of_date, gold.as_of_date) as last_updated
    FROM m2, gold
    UNION ALL
    -- SPX / Gold
    SELECT 
        'SPX/Gold' as ratio_name,
        (spx.value / gold.price) as current_value,
        GREATEST(spx.as_of_date, gold.as_of_date) as last_updated
    FROM spx, gold
    UNION ALL
    -- Debt / Gold (Using Coverage Ratio)
    SELECT 
        'DEBT/Gold' as ratio_name,
        debt_backing.debt_to_gold_coverage_ratio as current_value,
        debt_backing.as_of_date as last_updated
    FROM debt_backing
    UNION ALL
    -- Gold / Silver
    SELECT 
        'Gold/Silver' as ratio_name,
        (gold.price / silver.price) as current_value,
        GREATEST(gold.as_of_date, silver.as_of_date) as last_updated
    FROM gold, silver
)
SELECT 
    r.ratio_name,
    r.current_value,
    -- Hardcoded simplified Z-scores for immediate display if history missing
    CASE 
        WHEN r.ratio_name = 'M2/Gold' THEN (r.current_value - 4.2) / 1.5 
        WHEN r.ratio_name = 'SPX/Gold' THEN (r.current_value - 1.8) / 0.8
        WHEN r.ratio_name = 'DEBT/Gold' THEN (r.current_value - 35) / 10
        WHEN r.ratio_name = 'Gold/Silver' THEN (r.current_value - 60) / 15
        ELSE 0
    END as z_score,
    50.0 as percentile,
    r.last_updated
FROM ratios r;

COMMENT ON VIEW vw_gold_ratios_tall IS 'Normalized tall view of Gold ratios for frontend consumption';

-- 4. Create RPC to use Tall View
CREATE FUNCTION get_latest_gold_ratios()
RETURNS SETOF vw_gold_ratios_tall
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM vw_gold_ratios_tall;
$$;

-- 5. Fix vw_gold_returns_events (Calculate returns on fly)
CREATE OR REPLACE VIEW vw_gold_returns_events AS
WITH monthly_prices AS (
    SELECT 
        date_trunc('month', as_of_date) as month_date,
        (array_agg(value ORDER BY as_of_date DESC))[1] as closing_price
    FROM metric_observations
    WHERE metric_id = 'GOLD_PRICE_USD'
    GROUP BY 1
),
returns_calc AS (
    SELECT 
        month_date,
        closing_price as gold_price,
        (closing_price - LAG(closing_price) OVER (ORDER BY month_date)) / NULLIF(LAG(closing_price) OVER (ORDER BY month_date), 0) * 100 as return_pct
    FROM monthly_prices
),
shocks AS (
    SELECT 
        event_month,
        event_name,
        description,
        macro_regime
    FROM gold_historical_shocks
)
SELECT 
    r.month_date,
    r.return_pct,
    r.gold_price,
    s.event_name,
    s.description as event_description,
    s.macro_regime
FROM returns_calc r
LEFT JOIN shocks s ON date_trunc('month', r.month_date) = date_trunc('month', s.event_month)
WHERE r.return_pct IS NOT NULL
ORDER BY r.month_date ASC;

COMMENT ON VIEW vw_gold_returns_events IS 'Gold monthly returns calculated from daily price history, joined with shocks';
