-- =====================================================
-- Macro Intelligence Dashboard – Performance Indexes
-- =====================================================
-- Strategic indexes for fast time-series queries and latest-value lookups
-- =====================================================

-- =====================================================
-- Indexes: metric_observations
-- =====================================================

-- Latest value queries (most common pattern)
-- Enables fast: SELECT * FROM metric_observations WHERE metric_id = 'X' ORDER BY as_of_date DESC LIMIT 1
CREATE INDEX idx_observations_latest 
  ON metric_observations (metric_id, as_of_date DESC);

-- Time-series range queries
-- Enables fast: SELECT * FROM metric_observations WHERE metric_id = 'X' AND as_of_date >= '2020-01-01'
CREATE INDEX idx_observations_range 
  ON metric_observations (metric_id, as_of_date);

-- Staleness monitoring queries
-- Enables fast: SELECT * FROM metric_observations WHERE staleness_flag = 'very_lagged'
CREATE INDEX idx_observations_staleness 
  ON metric_observations (staleness_flag, last_updated_at);

-- Composite version tracking
-- Enables fast: SELECT * FROM metric_observations WHERE composite_version = 1
CREATE INDEX idx_observations_composite_version 
  ON metric_observations (composite_version);

-- =====================================================
-- Indexes: country_reserves
-- =====================================================

-- Latest reserves per country
-- Enables fast: SELECT * FROM country_reserves WHERE country_code = 'US' ORDER BY as_of_date DESC LIMIT 1
CREATE INDEX idx_reserves_country_date 
  ON country_reserves (country_code, as_of_date DESC);

-- Time-series range queries for reserves
CREATE INDEX idx_reserves_date_range 
  ON country_reserves (as_of_date);

-- USD share tracking
-- Enables fast: SELECT * FROM country_reserves WHERE usd_share_pct < 50 ORDER BY as_of_date DESC
CREATE INDEX idx_reserves_usd_share 
  ON country_reserves (usd_share_pct, as_of_date DESC);

-- =====================================================
-- Indexes: metrics
-- =====================================================

-- Category filtering
-- Enables fast: SELECT * FROM metrics WHERE category = 'liquidity' AND is_active = TRUE
CREATE INDEX idx_metrics_category 
  ON metrics (category, is_active);

-- Tier filtering
-- Enables fast: SELECT * FROM metrics WHERE tier = 'core'
CREATE INDEX idx_metrics_tier 
  ON metrics (tier);

-- Source lookup
-- Enables fast: SELECT * FROM metrics WHERE source_id = 1
CREATE INDEX idx_metrics_source 
  ON metrics (source_id);

-- =====================================================
-- Analyze tables for query planner
-- =====================================================

ANALYZE data_sources;
ANALYZE metrics;
ANALYZE metric_observations;
ANALYZE g20_countries;
ANALYZE country_reserves;
