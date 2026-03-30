-- =====================================================
-- Migration: Fuel Security Clock – India
-- Created: 2026-03-31
-- =====================================================
-- Creates fuel_security_clock_india table for tracking
-- India's petroleum reserves, consumption, tanker pipeline,
-- and geopolitical risk metrics.
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: fuel_security_clock_india
-- =====================================================

CREATE TABLE IF NOT EXISTS public.fuel_security_clock_india (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    as_of_date DATE NOT NULL,

    -- Core metrics
    reserves_days_coverage NUMERIC NOT NULL,          -- Total days of fuel reserves (weighted avg)
    reserves_days_official NUMERIC NOT NULL,          -- Government reported (PPAC)
    reserves_days_actual NUMERIC,                     -- Independent estimate (if available)
    deviation_pct NUMERIC,                            -- (Actual - Official) / Official * 100
    daily_consumption_mbpd NUMERIC NOT NULL,         -- Current consumption rate
    brent_price_usd NUMERIC NOT NULL,
    inr_per_barrel NUMERIC NOT NULL,                 -- Local currency import cost

    -- Tanker pipeline
    active_tankers_count INTEGER DEFAULT 0,
    tanker_pipeline_json JSONB DEFAULT '[]'::jsonb,  -- Array of {
                                                       --   vessel_name, origin, eta,
                                                       --   volume_mbbl, risk_flag, vessel_type
                                                       -- }

    -- Geopolitical risk
    -- Note: Using separate table for risk scores; see 20260331_geopolitical_risk_fuel.sql
    -- This column stores the aggregated daily score for this section
    geopolitical_risk_score NUMERIC CHECK (geopolitical_risk_score >= 0 AND geopolitical_risk_score <= 100),

    -- Scenario projections (in days of coverage)
    scenario_baseline_days NUMERIC NOT NULL,         -- Linear projection @ current consumption
    scenario_disruption_days NUMERIC NOT NULL,       -- 30% import reduction
    scenario_rationing_days NUMERIC NOT NULL,        -- 50% consumption reduction

    -- Metadata
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,              -- {source_reliability, notes, ingestion_version}

    UNIQUE(as_of_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fuel_security_india_date ON fuel_security_clock_india(as_of_date DESC);

-- Row Level Security
ALTER TABLE public.fuel_security_clock_india ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.fuel_security_clock_india
    FOR SELECT USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_fuel_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fuel_security_clock_india_updated_at
    BEFORE UPDATE ON public.fuel_security_clock_india
    FOR EACH ROW
    EXECUTE FUNCTION update_fuel_security_updated_at();

-- =====================================================
-- Metrics Registration
-- =====================================================
-- These entries enable data health monitoring and discovery

INSERT INTO metrics (id, name, description, native_frequency, display_frequency, unit, unit_label, category, expected_interval_days) VALUES
  ('IN_FUEL_RESERVES_DAYS', 'India Fuel Reserves Days Coverage', 'Total days of petroleum reserves coverage at current consumption rates', 'daily', 'daily', 'days', 'Days', 'sovereign', 1),
  ('IN_FUEL_CONSUMPTION_MBPD', 'India Fuel Consumption', 'Daily petroleum consumption in million barrels per day', 'daily', 'daily', 'mbpd', 'Mbpd', 'sovereign', 1),
  ('IN_FUEL_IMPORT_COST_INR', 'India Fuel Import Cost (INR/Barrel)', 'Local currency cost of imported Brent crude', 'daily', 'daily', 'INR/barrel', 'INR/Barrel', 'sovereign', 1),
  ('IN_GEOPOLITICAL_RISK_SCORE', 'India Fuel Geopolitical Risk Score', '0-100 risk score based on chokepoint conditions and incidents', 'daily', 'daily', 'score', 'Score', 'sovereign', 1)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE fuel_security_clock_india IS 'Daily fuel security metrics for India: reserves coverage, tanker pipeline, consumption projections, and geopolitical risk overlay. Used in Energy & Commodities Lab Fuel Security Clock section.';
COMMENT ON COLUMN reserves_days_coverage IS 'Total days of fuel reserves = (total_reserves_mbbl / daily_consumption_mbbl). Weighted average of strategic + commercial reserves.';
COMMENT ON COLUMN reserves_days_official IS 'Government-reported reserves coverage (PPAC). May differ from independent estimates due to classification or measurement methodology.';
COMMENT ON COLUMN reserves_days_actual IS 'Independent estimate of reserves coverage. Used to compute deviation_pct. May be NULL if no independent source available.';
COMMENT ON COLUMN deviation_pct IS 'Percentage difference between actual and official reserves: ((actual - official) / official) * 100. Positive = overstatement by govt, Negative = understatement.';
COMMENT ON COLUMN daily_consumption_mbpd IS 'Current daily petroleum consumption in million barrels per day. Source: PPAC or IEA.';
COMMENT ON COLUMN brent_price_usd IS 'Brent crude price in USD (from existing metric_observations). Used for context.';
COMMENT ON COLUMN inr_per_barrel IS 'Cost to import one barrel of Brent in Indian Rupees. Computed as Brent USD * INR/USD FX rate.';
COMMENT ON COLUMN active_tankers_count IS 'Estimated number of tankers currently en route to India with crude oil cargo. Based on import volumes and shipping time heuristics (V1).';
COMMENT ON COLUMN tanker_pipeline_json IS 'JSON array of tanker estimates: vessel name, origin country, ETA, volume (Mbbl), risk_flag, vessel_type. Sorted by ETA ascending.';
COMMENT ON COLUMN geopolitical_risk_score IS 'Aggregated daily risk score 0-100 for Hormuz, Malacca, Red Sea chokepoint conditions affecting India oil imports. Computed from geopolitical_risk_events table.';
COMMENT ON COLUMN scenario_baseline_days IS 'Projected days of coverage if consumption continues at current rate and imports arrive on schedule.';
COMMENT ON COLUMN scenario_disruption_days IS 'Projected days under disruption scenario: 30% reduction in import volumes (partial supply shock).';
COMMENT ON COLUMN scenario_rationing_days IS 'Projected days under rationing scenario: 50% reduction in consumption (government-mandated).';
COMMENT ON COLUMN metadata IS 'Additional metadata: source_reliability (high/medium/low), notes (human context), ingestion_version (monotonic integer for reproducibility).';