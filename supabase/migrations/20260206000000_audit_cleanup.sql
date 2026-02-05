-- Audit Cleanup & Metric Materialization
-- Consolidate TGA metrics and populate derived gold ratios

-- 1. Deactivate old TGA_BALANCE and point to TGA_BALANCE_BN
UPDATE metrics 
SET is_active = false, 
    methodology_note = 'Deprecated in favor of TGA_BALANCE_BN'
WHERE id = 'TGA_BALANCE';

-- 2. Ensure RATIO_SPX_GOLD and RATIO_M2_GOLD are active in metrics table
UPDATE metrics 
SET is_active = true,
    expected_interval_days = 1
WHERE id IN ('RATIO_SPX_GOLD', 'RATIO_M2_GOLD');

-- 3. Function to materialize gold ratios
-- This takes data from vw_gold_ratios_historical and statistics from vw_gold_ratios_stats
CREATE OR REPLACE FUNCTION populate_gold_ratios()
RETURNS void AS $$
BEGIN
    -- Materialize all historical ratios
    INSERT INTO metric_observations (metric_id, as_of_date, value, z_score, percentile, last_updated_at)
    SELECT 
        CASE 
            WHEN s.ratio_name = 'M2/Gold' THEN 'RATIO_M2_GOLD'
            WHEN s.ratio_name = 'SPX/Gold' THEN 'RATIO_SPX_GOLD'
            WHEN s.ratio_name = 'DEBT/Gold' THEN 'RATIO_DEBT_GOLD'
            WHEN s.ratio_name = 'Gold/Silver' THEN 'RATIO_GOLD_SILVER'
        END AS metric_id,
        s.as_of_date,
        s.current_value,
        s.z_score,
        p.percentile,
        NOW()
    FROM vw_gold_ratios_stats s
    LEFT JOIN vw_gold_ratios_percentiles p ON s.ratio_name = p.ratio_name AND s.as_of_date = p.as_of_date
    WHERE s.ratio_name IN ('M2/Gold', 'SPX/Gold', 'DEBT/Gold', 'Gold/Silver')
    ON CONFLICT (metric_id, as_of_date) DO UPDATE 
    SET value = EXCLUDED.value,
        z_score = EXCLUDED.z_score,
        percentile = EXCLUDED.percentile,
        last_updated_at = EXCLUDED.last_updated_at;
END;
$$ LANGUAGE plpgsql;

-- 4. Initial population
SELECT populate_gold_ratios();
