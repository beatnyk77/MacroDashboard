SELECT
    (SELECT count(*) FROM metric_observations WHERE metric_id = 'USD_INR_RATE') AS usd_inr_rows,
    (SELECT count(*) FROM metric_observations WHERE metric_id = 'USD_CNY_RATE') AS usd_cny_rows,
    (SELECT count(*) FROM metric_observations WHERE metric_id = 'CNY_INR_RATE') AS cny_inr_rows,
    (SELECT count(*) FROM vw_fx_monthly_cross_rates) AS monthly_view_rows,
    (SELECT month FROM vw_fx_monthly_cross_rates ORDER BY month DESC LIMIT 1) AS latest_month,
    (SELECT cny_inr FROM vw_fx_monthly_cross_rates ORDER BY month DESC LIMIT 1) AS latest_cny_inr;