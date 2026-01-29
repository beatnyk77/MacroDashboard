-- =====================================================
-- Migration: Add RPC for Gold Ratios
-- =====================================================

-- Function: get_latest_gold_ratios
-- Returns the latest value for each gold ratio
CREATE OR REPLACE FUNCTION get_latest_gold_ratios()
RETURNS SETOF vw_gold_ratios
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- Select the latest entry for each ratio
    SELECT DISTINCT ON (ratio_name) *
    FROM vw_gold_ratios
    ORDER BY ratio_name, last_updated DESC;
$$;

COMMENT ON FUNCTION get_latest_gold_ratios IS 'Returns the latest observations for Gold Ratios (M2/Gold, SPX/Gold, etc.)';
