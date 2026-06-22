-- Derive CNY/INR cross-rate from overlapping USD/INR and USD/CNY observations
INSERT INTO metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref)
SELECT
    'CNY_INR_RATE',
    u.as_of_date,
    u.value / c.value,
    NOW(),
    'verified_historical',
    'computed:currency-wars-cross-rate'
FROM metric_observations u
JOIN metric_observations c
    ON c.metric_id = 'USD_CNY_RATE'
   AND c.as_of_date = u.as_of_date
WHERE u.metric_id = 'USD_INR_RATE'
  AND c.value > 0
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
    value = EXCLUDED.value,
    last_updated_at = EXCLUDED.last_updated_at,
    provenance = EXCLUDED.provenance;