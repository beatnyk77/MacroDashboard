-- =====================================================
-- Macro Intelligence Dashboard – Row Level Security
-- =====================================================
-- RLS policies for secure data access
-- Read: Public (anon key) for all tables and views
-- Write: Service role only (edge functions)
-- =====================================================

-- =====================================================
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE g20_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_reserves ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Read Policies (Public Access)
-- =====================================================

-- data_sources: Allow public read access
CREATE POLICY "Allow public read access to data_sources"
  ON data_sources
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- metrics: Allow public read access
CREATE POLICY "Allow public read access to metrics"
  ON metrics
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- metric_observations: Allow public read access
CREATE POLICY "Allow public read access to metric_observations"
  ON metric_observations
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- g20_countries: Allow public read access
CREATE POLICY "Allow public read access to g20_countries"
  ON g20_countries
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- country_reserves: Allow public read access
CREATE POLICY "Allow public read access to country_reserves"
  ON country_reserves
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- =====================================================
-- Write Policies (Service Role Only)
-- =====================================================

-- data_sources: Service role only
CREATE POLICY "Allow service role to insert data_sources"
  ON data_sources
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to update data_sources"
  ON data_sources
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to delete data_sources"
  ON data_sources
  FOR DELETE
  TO service_role
  USING (TRUE);

-- metrics: Service role only
CREATE POLICY "Allow service role to insert metrics"
  ON metrics
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to update metrics"
  ON metrics
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to delete metrics"
  ON metrics
  FOR DELETE
  TO service_role
  USING (TRUE);

-- metric_observations: Service role only
CREATE POLICY "Allow service role to insert metric_observations"
  ON metric_observations
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to update metric_observations"
  ON metric_observations
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to delete metric_observations"
  ON metric_observations
  FOR DELETE
  TO service_role
  USING (TRUE);

-- g20_countries: Service role only (rarely modified)
CREATE POLICY "Allow service role to insert g20_countries"
  ON g20_countries
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to update g20_countries"
  ON g20_countries
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to delete g20_countries"
  ON g20_countries
  FOR DELETE
  TO service_role
  USING (TRUE);

-- country_reserves: Service role only
CREATE POLICY "Allow service role to insert country_reserves"
  ON country_reserves
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to update country_reserves"
  ON country_reserves
  FOR UPDATE
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow service role to delete country_reserves"
  ON country_reserves
  FOR DELETE
  TO service_role
  USING (TRUE);

-- =====================================================
-- Grant permissions on views
-- =====================================================

GRANT SELECT ON vw_latest_metrics TO anon, authenticated;
GRANT SELECT ON vw_gold_ratios TO anon, authenticated;
GRANT SELECT ON vw_net_supply_private TO anon, authenticated;
GRANT SELECT ON vw_refinancing_cliff TO anon, authenticated;
GRANT SELECT ON vw_g20_reserves_gold TO anon, authenticated;

-- =====================================================
-- Security Notes
-- =====================================================

COMMENT ON POLICY "Allow public read access to metrics" ON metrics IS 
  'Public read access enables frontend queries with publishable (anon) key';

COMMENT ON POLICY "Allow service role to insert metric_observations" ON metric_observations IS 
  'Only edge functions (service role) can write observations to prevent unauthorized data modification';
