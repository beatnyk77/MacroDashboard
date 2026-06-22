-- CNY/INR cross-rate (derived from USD/INR ÷ USD/CNY) + monthly aggregation view

DO $$
DECLARE
    fred_id integer;
BEGIN
    SELECT id INTO fred_id FROM data_sources WHERE name = 'FRED';

    INSERT INTO metrics (id, name, unit, description, native_frequency, display_frequency, expected_interval_days, category, source_id)
    VALUES (
        'CNY_INR_RATE',
        'CNY/INR Cross Rate (derived)',
        'index',
        'Chinese Yuan to Indian Rupee cross-rate: USD/INR ÷ USD/CNY — institutional market convention',
        'daily',
        'daily',
        1,
        'capital_flows',
        fred_id
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        unit = EXCLUDED.unit,
        description = EXCLUDED.description,
        category = EXCLUDED.category;
END $$;

CREATE OR REPLACE VIEW vw_fx_monthly_cross_rates AS
WITH monthly AS (
    SELECT
        metric_id,
        date_trunc('month', as_of_date::date)::date AS month_date,
        AVG(value) AS avg_value,
        COUNT(*)::integer AS observation_count
    FROM metric_observations
    WHERE metric_id IN ('USD_INR_RATE', 'USD_CNY_RATE', 'CNY_INR_RATE')
    GROUP BY metric_id, date_trunc('month', as_of_date::date)
),
pivoted AS (
    SELECT
        month_date,
        MAX(CASE WHEN metric_id = 'USD_INR_RATE' THEN avg_value END) AS usd_inr,
        MAX(CASE WHEN metric_id = 'USD_CNY_RATE' THEN avg_value END) AS usd_cny,
        MAX(CASE WHEN metric_id = 'CNY_INR_RATE' THEN avg_value END) AS cny_inr,
        SUM(observation_count) AS observation_count
    FROM monthly
    GROUP BY month_date
    HAVING
        MAX(CASE WHEN metric_id = 'USD_INR_RATE' THEN avg_value END) IS NOT NULL
        AND MAX(CASE WHEN metric_id = 'USD_CNY_RATE' THEN avg_value END) IS NOT NULL
        AND MAX(CASE WHEN metric_id = 'USD_CNY_RATE' THEN avg_value END) > 0
)
SELECT
    to_char(month_date, 'YYYY-MM') AS month,
    ROUND(usd_inr::numeric, 4) AS usd_inr,
    ROUND(usd_cny::numeric, 4) AS usd_cny,
    ROUND(COALESCE(cny_inr, usd_inr / usd_cny)::numeric, 4) AS cny_inr,
    observation_count
FROM pivoted
ORDER BY month_date;

GRANT SELECT ON vw_fx_monthly_cross_rates TO anon, authenticated;