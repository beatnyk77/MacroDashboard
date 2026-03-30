-- Enhanced materialized view for market_pulse_stats with derived metrics
-- Replaces existing view to support FII/DII Flow Monitor requirements

DROP MATERIALIZED VIEW IF EXISTS market_pulse_stats;

CREATE MATERIALIZED VIEW market_pulse_stats AS
WITH daily_with_derived AS (
    SELECT
        md.*,
        -- Derived aggregates
        COALESCE(md.fii_cash_net, 0) + COALESCE(md.dii_cash_net, 0) AS fii_dii_net,
        COALESCE(md.fii_idx_fut_net, 0) + COALESCE(md.fii_stk_fut_net, 0) AS fii_fno_net,
        COALESCE(md.client_idx_fut_net, 0) + COALESCE(md.client_stk_fut_net, 0) AS client_fno_net,
        -- Sentiment score formula (matches frontend logic)
        LEAST(100, GREATEST(0,
            ROUND(
                50
                + COALESCE(md.fii_cash_net, 0) / 200.0
                + COALESCE(md.fii_idx_fut_net, 0) / 5000.0
                + CASE
                    WHEN COALESCE(md.pcr, 1) > 1.3 THEN -10
                    WHEN COALESCE(md.pcr, 1) < 0.7 THEN 10
                    ELSE 0
                  END
            , 1))) AS sentiment_score
    FROM public.market_pulse_daily md
)
SELECT
    d.date,
    d.fii_cash_net,
    d.dii_cash_net,
    d.fii_idx_fut_net,
    d.pcr,
    d.india_vix,
    d.advances,
    d.declines,
    d.delivery_pct,
    d.circuits_pct,
    d.sector_returns,
    d.midcap_perf,
    d.smallcap_perf,
    d.nifty_perf,
    d.new_highs_52w,
    d.new_lows_52w,
    -- Computed aggregates
    d.fii_dii_net,
    d.fii_fno_net,
    d.client_fno_net,
    d.sentiment_score,
    -- Z-scores and percentiles (10-year window)
    (d.fii_cash_net - stats_avg.fii_avg) / NULLIF(stats_std.fii_std, 0) AS fii_zscore,
    (d.india_vix - vix_avg.vix_avg) / NULLIF(vix_std.vix_std, 0) AS vix_zscore,
    stats_pct.fii_pct AS fii_percentile,
    vix_pct.vix_pct AS vix_percentile
FROM daily_with_derived d
-- FII cash net stats (10y window)
LEFT JOIN (
    SELECT date, AVG(fii_cash_net) OVER (ORDER BY date ROWS BETWEEN 2520 PRECEDING AND CURRENT ROW) AS fii_avg
    FROM public.market_pulse_daily
) stats_avg ON stats_avg.date = d.date
LEFT JOIN (
    SELECT date, STDDEV(fii_cash_net) OVER (ORDER BY date ROWS BETWEEN 2520 PRECEDING AND CURRENT ROW) AS fii_std
    FROM public.market_pulse_daily
) stats_std ON stats_std.date = d.date
LEFT JOIN (
    SELECT date, AVG(india_vix) OVER (ORDER BY date ROWS BETWEEN 2520 PRECEDING AND CURRENT ROW) AS vix_avg
    FROM public.market_pulse_daily
) vix_avg ON vix_avg.date = d.date
LEFT JOIN (
    SELECT date, STDDEV(india_vix) OVER (ORDER BY date ROWS BETWEEN 2520 PRECEDING AND CURRENT ROW) AS vix_std
    FROM public.market_pulse_daily
) vix_std ON vix_std.date = d.date
-- Percentiles using CUME_DIST
LEFT JOIN (
    SELECT date, CUME_DIST() OVER (ORDER BY fii_cash_net) * 100 AS fii_pct
    FROM public.market_pulse_daily
) stats_pct ON stats_pct.date = d.date
LEFT JOIN (
    SELECT date, CUME_DIST() OVER (ORDER BY india_vix) * 100 AS vix_pct
    FROM public.market_pulse_daily
) vix_pct ON vix_pct.date = d.date;

-- Unique index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_pulse_stats_date ON market_pulse_stats(date);
