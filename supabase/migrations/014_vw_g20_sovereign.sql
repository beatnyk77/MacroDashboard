-- View: vw_g20_sovereign
-- Purpose: Aggregates latest G20 metrics and computes Real Rates and Deltas for the dashboard.

CREATE OR REPLACE VIEW vw_g20_sovereign AS
WITH latest_values AS (
    -- Get the most recent observation for each G20 and US proxy metric
    SELECT 
        m.id AS metric_id,
        m.name AS metric_name,
        mo.value,
        mo.as_of_date,
        -- Calculate previous value for deltas (naively looking at the observation immediately preceding)
        LAG(mo.value) OVER (PARTITION BY m.id ORDER BY mo.as_of_date) AS prev_value,
        LAG(mo.as_of_date) OVER (PARTITION BY m.id ORDER BY mo.as_of_date) AS prev_date
    FROM metrics m
    JOIN metric_observations mo ON m.id = mo.metric_id
    WHERE m.id IN (
        'G20_DEBT_GDP_PCT', 
        'G20_INFLATION_YOY', 
        'G20_INTEREST_BURDEN_PCT',
        'US_FED_FUNDS',
        'US_PCE_PI'
    )
),
ranked_values AS (
    -- Rank observations to pick only the very latest for the main view
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY metric_id ORDER BY as_of_date DESC) as rn
    FROM latest_values
),
current_metrics AS (
    SELECT 
        metric_id, 
        value as current_val, 
        prev_value,
        as_of_date as current_date
    FROM ranked_values 
    WHERE rn = 1
),
derived_metrics AS (
    SELECT
        -- Debt/GDP
        (SELECT current_val FROM current_metrics WHERE metric_id = 'G20_DEBT_GDP_PCT') as g20_debt_gdp,
        (SELECT prev_value FROM current_metrics WHERE metric_id = 'G20_DEBT_GDP_PCT') as g20_debt_gdp_prev,
        
        -- Inflation
        (SELECT current_val FROM current_metrics WHERE metric_id = 'G20_INFLATION_YOY') as g20_inflation,
        (SELECT prev_value FROM current_metrics WHERE metric_id = 'G20_INFLATION_YOY') as g20_inflation_prev,
        
        -- Interest Burden
        (SELECT current_val FROM current_metrics WHERE metric_id = 'G20_INTEREST_BURDEN_PCT') as g20_interest_burden,
        (SELECT prev_value FROM current_metrics WHERE metric_id = 'G20_INTEREST_BURDEN_PCT') as g20_interest_burden_prev,

        -- Real Rate Components
        (SELECT current_val FROM current_metrics WHERE metric_id = 'US_FED_FUNDS') as us_fed_funds,
        (SELECT current_val FROM current_metrics WHERE metric_id = 'US_PCE_PI') as us_pce_pi_index,
         -- Note: Real Rate calculation usually needs Inflation Rate, not Index. 
         -- Assuming US_PCE_PI might be the Rate (YoY) or we need a separate US_INFLATION metric.
         -- For now, let's assume we use FED_FUNDS - G20_INFLATION as a "Global Real Rate Proxy"
         -- OR better: FED_FUNDS - US_CPI (if we had it).
         -- Let's use FED_FUNDS - G20_INFLATION for the "Global" proxy aspect since it's a G20 view,
         -- or just return the raw values to let frontend calculate if needed.
         -- Actually, let's compute a "Global Proxy Real Rate" = Fed Funds (Global Risk Free) - G20 Inflation.
         (SELECT current_val FROM current_metrics WHERE metric_id = 'US_FED_FUNDS') - 
         (SELECT current_val FROM current_metrics WHERE metric_id = 'G20_INFLATION_YOY') as global_real_rate_proxy
)
SELECT
    g20_debt_gdp as debt_gdp_current,
    (g20_debt_gdp - g20_debt_gdp_prev) as debt_gdp_delta,
    
    g20_inflation as inflation_current,
    (g20_inflation - g20_inflation_prev) as inflation_delta,
    
    global_real_rate_proxy as real_rate_current,
    -- Cannot easily compute real rate delta without historical series joins, leaving null for now or computing later
    NULL as real_rate_delta,
    
    g20_interest_burden as interest_burden_current,
    (g20_interest_burden - g20_interest_burden_prev) as interest_burden_delta,
    
    CURRENT_TIMESTAMP as last_computed_at
FROM derived_metrics;
