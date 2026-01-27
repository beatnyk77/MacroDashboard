-- =====================================================
-- Macro Intelligence Dashboard – Initial Schema
-- =====================================================
-- Creates core tables for metrics tracking, time-series observations,
-- and reserve data for G20 countries.
--
-- Design principles:
-- 1. Idempotent upserts on (metric_id, as_of_date)
-- 2. Staleness tracking for data quality monitoring
-- 3. Composite version tracking for reproducibility
-- 4. Native frequency metadata for proper UI rendering
-- =====================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: data_sources
-- =====================================================
-- Registry of external data APIs (FRED, FiscalData, IMF, BIS)
-- Used by edge functions for ingestion orchestration

CREATE TABLE data_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  api_endpoint TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'oauth', 'none')),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE data_sources IS 'External data source registry for API ingestion';
COMMENT ON COLUMN data_sources.auth_type IS 'Authentication method: api_key, oauth, or none';
COMMENT ON COLUMN data_sources.last_checked IS 'Last successful API health check timestamp';
COMMENT ON COLUMN data_sources.metadata IS 'Additional source-specific configuration (rate limits, etc.)';

-- =====================================================
-- Table: metrics
-- =====================================================
-- Canonical metric catalog with frequency and tier metadata

CREATE TABLE metrics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source_id INTEGER REFERENCES data_sources(id) ON DELETE SET NULL,
  native_frequency TEXT NOT NULL CHECK (native_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  display_frequency TEXT NOT NULL CHECK (display_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  unit TEXT,
  unit_label TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('core', 'secondary', 'experimental')) DEFAULT 'secondary',
  category TEXT NOT NULL CHECK (category IN ('liquidity', 'valuation', 'funding', 'de_dollarization', 'sovereign', 'macro_regime')),
  methodology_note TEXT,
  expected_interval_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE metrics IS 'Canonical metric definitions with frequency and tier classification';
COMMENT ON COLUMN metrics.id IS 'Unique metric identifier (e.g., US_M2, SPX_GOLD_RATIO)';
COMMENT ON COLUMN metrics.native_frequency IS 'How often data is published by source';
COMMENT ON COLUMN metrics.display_frequency IS 'How to render in UI (can differ from native)';
COMMENT ON COLUMN metrics.tier IS 'Data quality tier: core (tier 1), secondary (tier 2), experimental (tier 3)';
COMMENT ON COLUMN metrics.expected_interval_days IS 'Expected days between updates (used for staleness calculation)';
COMMENT ON COLUMN metrics.methodology_note IS 'Calculation methodology or source notes for transparency';

-- =====================================================
-- Table: metric_observations
-- =====================================================
-- Time-series data warehouse with computed statistics
-- Primary key ensures idempotent upserts

CREATE TABLE metric_observations (
  metric_id TEXT NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  as_of_date DATE NOT NULL,
  value NUMERIC NOT NULL,
  z_score NUMERIC,
  percentile NUMERIC CHECK (percentile >= 0 AND percentile <= 100),
  delta_wow NUMERIC,  -- Week-over-week change
  delta_mom NUMERIC,  -- Month-over-month change
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  staleness_flag TEXT CHECK (staleness_flag IN ('fresh', 'lagged', 'very_lagged')),
  composite_version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (metric_id, as_of_date)
);

COMMENT ON TABLE metric_observations IS 'Time-series observations with computed statistics';
COMMENT ON COLUMN metric_observations.z_score IS 'Z-score over rolling window (typically 252 or 1260 days)';
COMMENT ON COLUMN metric_observations.percentile IS 'Percentile rank over historical data (0-100)';
COMMENT ON COLUMN metric_observations.delta_wow IS 'Week-over-week change (7-day delta)';
COMMENT ON COLUMN metric_observations.delta_mom IS 'Month-over-month change (30-day delta)';
COMMENT ON COLUMN metric_observations.staleness_flag IS 'Data freshness: fresh, lagged, or very_lagged';
COMMENT ON COLUMN metric_observations.composite_version IS 'Version number for composite metric calculations';

-- =====================================================
-- Table: g20_countries
-- =====================================================
-- Reference table for G20 country codes

CREATE TABLE g20_countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_major BOOLEAN DEFAULT FALSE,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE g20_countries IS 'G20 country reference table';
COMMENT ON COLUMN g20_countries.is_major IS 'Flag for major economies (US, EU, CN, JP)';

-- =====================================================
-- Table: country_reserves
-- =====================================================
-- FX and gold reserves tracking for de-dollarization analysis

CREATE TABLE country_reserves (
  country_code TEXT NOT NULL REFERENCES g20_countries(code) ON DELETE CASCADE,
  as_of_date DATE NOT NULL,
  fx_reserves_usd NUMERIC,
  gold_tonnes NUMERIC,
  gold_usd NUMERIC,
  usd_share_pct NUMERIC CHECK (usd_share_pct >= 0 AND usd_share_pct <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (country_code, as_of_date)
);

COMMENT ON TABLE country_reserves IS 'FX and gold reserves for G20 countries';
COMMENT ON COLUMN country_reserves.fx_reserves_usd IS 'Total FX reserves in USD';
COMMENT ON COLUMN country_reserves.gold_tonnes IS 'Gold holdings in metric tonnes';
COMMENT ON COLUMN country_reserves.gold_usd IS 'Gold holdings valued in USD';
COMMENT ON COLUMN country_reserves.usd_share_pct IS 'Percentage of reserves held in USD';

-- =====================================================
-- Seed Data: G20 Countries
-- =====================================================

INSERT INTO g20_countries (code, name, is_major, region) VALUES
  ('US', 'United States', TRUE, 'North America'),
  ('EU', 'European Union', TRUE, 'Europe'),
  ('CN', 'China', TRUE, 'Asia'),
  ('JP', 'Japan', TRUE, 'Asia'),
  ('GB', 'United Kingdom', FALSE, 'Europe'),
  ('DE', 'Germany', FALSE, 'Europe'),
  ('FR', 'France', FALSE, 'Europe'),
  ('IT', 'Italy', FALSE, 'Europe'),
  ('CA', 'Canada', FALSE, 'North America'),
  ('BR', 'Brazil', FALSE, 'South America'),
  ('MX', 'Mexico', FALSE, 'North America'),
  ('AR', 'Argentina', FALSE, 'South America'),
  ('IN', 'India', FALSE, 'Asia'),
  ('KR', 'South Korea', FALSE, 'Asia'),
  ('ID', 'Indonesia', FALSE, 'Asia'),
  ('SA', 'Saudi Arabia', FALSE, 'Middle East'),
  ('TR', 'Turkey', FALSE, 'Middle East'),
  ('ZA', 'South Africa', FALSE, 'Africa'),
  ('AU', 'Australia', FALSE, 'Oceania'),
  ('RU', 'Russia', FALSE, 'Europe/Asia')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Seed Data: Sample Data Sources
-- =====================================================

INSERT INTO data_sources (name, api_endpoint, auth_type, metadata) VALUES
  ('FRED', 'https://api.stlouisfed.org/fred', 'api_key', '{"rate_limit": 120, "rate_window": "60s"}'),
  ('FiscalData', 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service', 'none', '{"rate_limit": 1000, "rate_window": "3600s"}'),
  ('IMF', 'https://www.imf.org/external/datamapper/api', 'none', '{"update_frequency": "quarterly"}'),
  ('BIS', 'https://data.bis.org/api', 'none', '{"update_frequency": "quarterly"}')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Triggers: Update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON data_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at
  BEFORE UPDATE ON metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
