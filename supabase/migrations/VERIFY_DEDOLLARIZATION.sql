-- =====================================================
-- De-Dollarization Tracker Verification Queries
-- =====================================================
-- Run these queries to verify the implementation
-- =====================================================

-- 1. Check metrics were created
SELECT 
    id, 
    name, 
    expected_interval_days, 
    category,
    tier,
    native_frequency
FROM metrics 
WHERE category = 'de_dollarization'
ORDER BY 
    CASE 
        WHEN id = 'GLOBAL_USD_SHARE_PCT' THEN 1
        WHEN id = 'GLOBAL_GOLD_SHARE_PCT' THEN 2
        WHEN id = 'GLOBAL_RMB_SHARE_PCT' THEN 3
        ELSE 4
    END;

-- Expected: 6 rows (USD, EUR, RMB, OTHER, GOLD_SHARE, GOLD_HOLDINGS)

-- 2. View latest de-dollarization data
SELECT 
    metric_id,
    metric_name,
    value,
    delta_qoq,
    delta_yoy_pct,
    staleness_flag,
    days_since_update,
    as_of_date
FROM vw_dedollarization
ORDER BY 
    CASE 
        WHEN metric_id = 'GLOBAL_USD_SHARE_PCT' THEN 1
        WHEN metric_id = 'GLOBAL_GOLD_SHARE_PCT' THEN 2
        ELSE 3
    END;

-- Expected: 6 rows with latest values and deltas

-- 3. Check for stale data
SELECT 
    metric_id,
    staleness_flag,
    days_since_update,
    as_of_date,
    last_updated_at
FROM vw_dedollarization 
WHERE staleness_flag != 'fresh';

-- Expected: Empty if data is current, or rows with 'lagged'/'very_lagged' flags

-- 4. View historical USD share trend (last 5 years)
SELECT 
    as_of_date,
    value AS usd_share_pct,
    delta_qoq,
    delta_yoy
FROM metric_observations
WHERE metric_id = 'GLOBAL_USD_SHARE_PCT'
ORDER BY as_of_date DESC
LIMIT 20;

-- Expected: Quarterly observations showing USD share trend

-- 5. View historical gold accumulation (last 5 years)
SELECT 
    as_of_date,
    value AS gold_share_pct,
    delta_qoq,
    delta_yoy
FROM metric_observations
WHERE metric_id = 'GLOBAL_GOLD_SHARE_PCT'
ORDER BY as_of_date DESC
LIMIT 20;

-- Expected: Quarterly observations showing gold reserve trend

-- 6. Check cron job is scheduled
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job
WHERE jobname = 'ingest-cofer-monthly';

-- Expected: 1 row with schedule '0 2 1 * *' (monthly at 02:00 UTC)

-- 7. Test view performance
EXPLAIN ANALYZE
SELECT * FROM vw_dedollarization;

-- Expected: Query time < 50ms

-- 8. Verify all metrics have data
SELECT 
    m.id,
    m.name,
    COUNT(mo.as_of_date) AS observation_count,
    MAX(mo.as_of_date) AS latest_date,
    MIN(mo.as_of_date) AS earliest_date
FROM metrics m
LEFT JOIN metric_observations mo ON m.id = mo.metric_id
WHERE m.category = 'de_dollarization'
GROUP BY m.id, m.name
ORDER BY m.id;

-- Expected: 6 rows, each with observation_count > 0 after ingestion

-- =====================================================
-- Cleanup Queries (if needed)
-- =====================================================

-- Remove all de-dollarization observations (for re-ingestion)
-- DELETE FROM metric_observations WHERE metric_id LIKE 'GLOBAL_%';

-- Unschedule cron job
-- SELECT cron.unschedule('ingest-cofer-monthly');

-- Drop view (for re-creation)
-- DROP VIEW IF EXISTS vw_dedollarization;
