-- =====================================================
-- Migration: Historical Gold Ratios with 25Y Rolling Z-Scores
-- =====================================================

-- 1. Create Historical Ratios View (All Time Series Data)
CREATE OR REPLACE VIEW vw_gold_ratios_historical AS
WITH gold_prices AS (
    SELECT as_of_date, value as gold_price 
    FROM metric_observations 
    WHERE metric_id = 'GOLD_PRICE_USD'
    AND value IS NOT NULL
),
silver_prices AS (
    SELECT as_of_date, value as silver_price 
    FROM metric_observations 
    WHERE metric_id = 'SILVER_PRICE_USD'
    AND value IS NOT NULL
),
m2_values AS (
    SELECT as_of_date, value as m2_value 
    FROM metric_observations 
    WHERE metric_id = 'US_M2'
    AND value IS NOT NULL
),
spx_values AS (
    SELECT as_of_date, value as spx_value 
    FROM metric_observations 
    WHERE metric_id = 'SPX_INDEX'
    AND value IS NOT NULL
),
debt_values AS (
    SELECT as_of_date, value as debt_value 
    FROM metric_observations 
    WHERE metric_id = 'UST_DEBT_TOTAL'
    AND value IS NOT NULL
),
gold_reserves AS (
    SELECT as_of_date, value as gold_tonnes 
    FROM metric_observations 
    WHERE metric_id = 'US_TREASURY_GOLD_TONNES'
    AND value IS NOT NULL
),
-- Calculate all ratios for all dates
ratios_wide AS (
    SELECT 
        g.as_of_date,
        -- M2/Gold
        CASE WHEN g.gold_price > 0 THEN m.m2_value / g.gold_price END as m2_gold_ratio,
        -- SPX/Gold
        CASE WHEN g.gold_price > 0 THEN s.spx_value / g.gold_price END as spx_gold_ratio,
        -- Debt/Gold (Coverage Ratio)
        CASE WHEN g.gold_price > 0 AND gr.gold_tonnes > 0 
            THEN d.debt_value / (gr.gold_tonnes * 32150.7466 * g.gold_price) 
        END as debt_gold_ratio,
        -- Gold/Silver
        CASE WHEN sl.silver_price > 0 THEN g.gold_price / sl.silver_price END as gold_silver_ratio
    FROM gold_prices g
    LEFT JOIN m2_values m ON g.as_of_date = m.as_of_date
    LEFT JOIN spx_values s ON g.as_of_date = s.as_of_date
    LEFT JOIN debt_values d ON g.as_of_date = d.as_of_date
    LEFT JOIN gold_reserves gr ON g.as_of_date = gr.as_of_date
    LEFT JOIN silver_prices sl ON g.as_of_date = sl.as_of_date
    WHERE g.as_of_date >= CURRENT_DATE - INTERVAL '30 years' -- Limit to 30Y for performance
)
-- Normalize to tall format
SELECT as_of_date, 'M2/Gold' as ratio_name, m2_gold_ratio as ratio_value FROM ratios_wide WHERE m2_gold_ratio IS NOT NULL
UNION ALL
SELECT as_of_date, 'SPX/Gold', spx_gold_ratio FROM ratios_wide WHERE spx_gold_ratio IS NOT NULL
UNION ALL
SELECT as_of_date, 'DEBT/Gold', debt_gold_ratio FROM ratios_wide WHERE debt_gold_ratio IS NOT NULL
UNION ALL
SELECT as_of_date, 'Gold/Silver', gold_silver_ratio FROM ratios_wide WHERE gold_silver_ratio IS NOT NULL
ORDER BY as_of_date DESC;

COMMENT ON VIEW vw_gold_ratios_historical IS 'Historical gold ratios in tall format for statistical analysis';

-- 2. Create Rolling Statistics View (25Y Window)
CREATE OR REPLACE VIEW vw_gold_ratios_stats AS
WITH rolling_window AS (
    SELECT 
        ratio_name,
        ratio_value as current_value,
        as_of_date,
        -- 25 years ≈ 6300 trading days (252 days/year * 25)
        AVG(ratio_value) OVER (
            PARTITION BY ratio_name 
            ORDER BY as_of_date 
            ROWS BETWEEN 6300 PRECEDING AND CURRENT ROW
        ) as rolling_mean,
        STDDEV(ratio_value) OVER (
            PARTITION BY ratio_name 
            ORDER BY as_of_date 
            ROWS BETWEEN 6300 PRECEDING AND CURRENT ROW
        ) as rolling_std,
        COUNT(*) OVER (
            PARTITION BY ratio_name 
            ORDER BY as_of_date 
            ROWS BETWEEN 6300 PRECEDING AND CURRENT ROW
        ) as window_size
    FROM vw_gold_ratios_historical
)
SELECT 
    ratio_name,
    current_value,
    rolling_mean,
    rolling_std,
    -- Calculate Z-score (only if we have sufficient data)
    CASE 
        WHEN window_size >= 1000 AND rolling_std > 0 
        THEN (current_value - rolling_mean) / rolling_std
        ELSE NULL
    END as z_score,
    as_of_date,
    window_size
FROM rolling_window
ORDER BY ratio_name, as_of_date DESC;

COMMENT ON VIEW vw_gold_ratios_stats IS '25-year rolling statistics for gold ratios with Z-scores';

-- 3. Create Percentile Rankings View
CREATE OR REPLACE VIEW vw_gold_ratios_percentiles AS
SELECT 
    ratio_name,
    ratio_value,
    as_of_date,
    PERCENT_RANK() OVER (PARTITION BY ratio_name ORDER BY ratio_value) * 100 as percentile
FROM vw_gold_ratios_historical;

COMMENT ON VIEW vw_gold_ratios_percentiles IS 'Percentile rankings for each ratio value';

-- 4. Update vw_gold_ratios_tall with Actual Statistics
DROP VIEW IF EXISTS vw_gold_ratios_tall CASCADE;

CREATE OR REPLACE VIEW vw_gold_ratios_tall AS
WITH latest_stats AS (
    SELECT DISTINCT ON (ratio_name)
        ratio_name,
        current_value,
        z_score,
        as_of_date
    FROM vw_gold_ratios_stats
    WHERE z_score IS NOT NULL -- Only use rows with valid Z-scores
    ORDER BY ratio_name, as_of_date DESC
),
latest_percentiles AS (
    SELECT DISTINCT ON (ratio_name)
        ratio_name,
        percentile
    FROM vw_gold_ratios_percentiles
    ORDER BY ratio_name, as_of_date DESC
)
SELECT 
    s.ratio_name,
    s.current_value,
    s.z_score,
    COALESCE(p.percentile, 50.0) as percentile,
    s.as_of_date as last_updated
FROM latest_stats s
LEFT JOIN latest_percentiles p ON s.ratio_name = p.ratio_name
ORDER BY s.ratio_name;

COMMENT ON VIEW vw_gold_ratios_tall IS 'Latest gold ratios with actual 25Y rolling Z-scores and percentiles';

-- 5. Recreate RPC (in case it was dropped)
CREATE OR REPLACE FUNCTION get_latest_gold_ratios()
RETURNS SETOF vw_gold_ratios_tall
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM vw_gold_ratios_tall;
$$;

COMMENT ON FUNCTION get_latest_gold_ratios IS 'Returns latest gold ratios with historical Z-scores';
