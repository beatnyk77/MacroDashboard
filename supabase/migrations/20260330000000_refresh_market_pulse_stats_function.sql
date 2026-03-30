-- Refresh function for market_pulse_stats materialized view
-- Called by ingestion functions after data upsert

CREATE OR REPLACE FUNCTION refresh_market_pulse_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY market_pulse_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION refresh_market_pulse_stats() TO anon, authenticated;
