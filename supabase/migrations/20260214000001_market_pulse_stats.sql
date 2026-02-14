-- Stats helper functions for Market Pulse
-- These functions will help calculate distributions dynamically or via a materialized view

-- 1. Calculate Percentile
CREATE OR REPLACE FUNCTION calculate_percentile(target_val NUMERIC, metric_name TEXT, window_days INTEGER DEFAULT 2520) 
RETURNS NUMERIC AS $$
DECLARE
    total_count BIGINT;
    lower_count BIGINT;
BEGIN
    EXECUTE format('SELECT count(*), count(*) FILTER (WHERE %I < $1) FROM market_pulse_daily WHERE date > (NOW() - interval %L)', metric_name, window_days || ' days')
    INTO total_count, lower_count
    USING target_val;
    
    IF total_count = 0 THEN RETURN 0; END IF;
    RETURN (lower_count::NUMERIC / total_count::NUMERIC) * 100;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Calculate Z-Score
CREATE OR REPLACE FUNCTION calculate_zscore(target_val NUMERIC, metric_name TEXT, window_days INTEGER DEFAULT 2520) 
RETURNS NUMERIC AS $$
DECLARE
    avg_val NUMERIC;
    stddev_val NUMERIC;
BEGIN
    EXECUTE format('SELECT avg(%I), stddev(%I) FROM market_pulse_daily WHERE date > (NOW() - interval %L)', metric_name, metric_name, window_days || ' days')
    INTO avg_val, stddev_val;
    
    IF stddev_val = 0 OR stddev_val IS NULL THEN RETURN 0; END IF;
    RETURN (target_val - avg_val) / stddev_val;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Materialized View for performance (Refreshed nightly)
CREATE MATERIALIZED VIEW IF NOT EXISTS market_pulse_stats AS
WITH daily_stats AS (
    SELECT
        date,
        fii_cash_net,
        dii_cash_net,
        fii_idx_fut_net,
        pcr,
        india_vix,
        advances,
        declines,
        delivery_pct,
        -- Window functions for running stats (Last 10 years or all available)
        AVG(fii_cash_net) OVER(ORDER BY date ROWS BETWEEN 2520 PRECEDING AND CURRENT ROW) as fii_avg,
        STDDEV(fii_cash_net) OVER(ORDER BY date ROWS BETWEEN 2520 PRECEDING AND CURRENT ROW) as fii_std,
        AVG(india_vix) OVER(ORDER BY date ROWS BETWEEN 2520 PRECEDING AND CURRENT ROW) as vix_avg,
        STDDEV(india_vix) OVER(ORDER BY date ROWS BETWEEN 2520 PRECEDING AND CURRENT ROW) as vix_std
    FROM market_pulse_daily
)
SELECT 
    date,
    fii_cash_net,
    (fii_cash_net - fii_avg) / NULLIF(fii_std, 0) as fii_zscore,
    india_vix,
    (india_vix - vix_avg) / NULLIF(vix_std, 0) as vix_zscore,
    -- Percentiles are harder in window functions without CUME_DIST, let's use CUME_DIST
    CUME_DIST() OVER(ORDER BY fii_cash_net) * 100 as fii_percentile,
    CUME_DIST() OVER(ORDER BY india_vix) * 100 as vix_percentile
FROM daily_stats;

CREATE UNIQUE INDEX IF NOT EXISTS idx_market_pulse_stats_date ON market_pulse_stats(date);
