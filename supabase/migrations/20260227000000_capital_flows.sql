-- =====================================================
-- Capital Flows Terminal – Database Schema
-- =====================================================

-- 1. Table: capital_flows_bop
-- Tracks official Balance of Payments data (Equity/Debt/Reserves)
CREATE TABLE capital_flows_bop (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL REFERENCES g20_countries(code) ON DELETE CASCADE,
  as_of_date DATE NOT NULL,
  asset_class TEXT NOT NULL CHECK (asset_class IN ('equity', 'debt', 'gold_reserves')),
  net_flow_usd NUMERIC NOT NULL,
  gross_inflow_usd NUMERIC,
  gross_outflow_usd NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (country_code, as_of_date, asset_class)
);

COMMENT ON TABLE capital_flows_bop IS 'Official Balance of Payments capital flow data by country and asset class';

-- 2. Table: capital_flows_proxies
-- Tracks ETF-based high-frequency flow proxies
CREATE TABLE capital_flows_proxies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proxy_ticker TEXT NOT NULL, -- e.g., SPY, EEM, GLD
  as_of_date DATE NOT NULL,
  volume_proxy NUMERIC,
  price_proxy NUMERIC,
  flow_estimate_usd NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (proxy_ticker, as_of_date)
);

COMMENT ON TABLE capital_flows_proxies IS 'High-frequency proxies for capital flows using ETF data';

-- 3. Table: capital_flow_anomalies
-- Tracks z-score based anomaly flags and regime status
CREATE TABLE capital_flow_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL REFERENCES g20_countries(code) ON DELETE CASCADE,
  asset_class TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  z_score NUMERIC NOT NULL,
  regime TEXT NOT NULL CHECK (regime IN ('NORMAL', 'WATCH', 'CRITICAL')),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (country_code, asset_class, as_of_date)
);

COMMENT ON TABLE capital_flow_anomalies IS 'Computed anomaly flags and regime status for capital flows';

-- 4. RLS Policies
-- Enable row level security
ALTER TABLE capital_flows_bop ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_flows_proxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_flow_anomalies ENABLE ROW LEVEL SECURITY;

-- Public READ access
CREATE POLICY "Public Read Capital Flows BOP" ON capital_flows_bop FOR SELECT USING (true);
CREATE POLICY "Public Read Capital Flows Proxies" ON capital_flows_proxies FOR SELECT USING (true);
CREATE POLICY "Public Read Capital Flow Anomalies" ON capital_flow_anomalies FOR SELECT USING (true);

-- Indices for performance
CREATE INDEX idx_cf_bop_date ON capital_flows_bop(as_of_date);
CREATE INDEX idx_cf_proxies_ticker ON capital_flows_proxies(proxy_ticker, as_of_date);
CREATE INDEX idx_cf_anomalies_regime ON capital_flow_anomalies(regime);
