-- =====================================================
-- Migration: Extend institutional_13f_holdings with richer analytics
-- Created: 2026-03-31
-- Purpose: Support flagship 13-F Smart Money Tracker enhancements
-- =====================================================

-- Add new columns to institutional_13f_holdings
ALTER TABLE institutional_13f_holdings
ADD COLUMN IF NOT EXISTS asset_class_allocation JSONB DEFAULT '{"equity_pct": 0, "bond_pct": 0, "gold_pct": 0, "other_pct": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS top_holdings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS concentration_score NUMERIC,
ADD COLUMN IF NOT EXISTS sector_rotation_signal TEXT CHECK (sector_rotation_signal IN ('ACCUMULATE', 'REDUCE', 'NEUTRAL')),
ADD COLUMN IF NOT EXISTS spy_comparison NUMERIC,
ADD COLUMN IF NOT EXISTS tlt_comparison NUMERIC,
ADD COLUMN IF NOT EXISTS gld_comparison NUMERIC,
ADD COLUMN IF NOT EXISTS regime_z_score NUMERIC,
ADD COLUMN IF NOT EXISTS historical_allocation JSONB DEFAULT '[]'::jsonb;

-- Add comments for clarity
COMMENT ON COLUMN institutional_13f_holdings.asset_class_allocation IS 'Allocation percentages by asset class (equity, bond, gold, other)';
COMMENT ON COLUMN institutional_13f_holdings.top_holdings IS 'Array of top holdings with cusip, ticker, name, value, sector, concentration_contribution';
COMMENT ON COLUMN institutional_13f_holdings.concentration_score IS 'HHI or top 5 sum concentration metric (0-100)';
COMMENT ON COLUMN institutional_13f_holdings.sector_rotation_signal IS 'Sector rotation signal based on QoQ change vs historical average';
COMMENT ON COLUMN institutional_13f_holdings.spy_comparison IS 'Institution performance relative to SPY (3-month alpha %)';
COMMENT ON COLUMN institutional_13f_holdings.tlt_comparison IS 'Institution performance relative to TLT (3-month alpha %)';
COMMENT ON COLUMN institutional_13f_holdings.gld_comparison IS 'Institution performance relative to GLD (3-month alpha %)';
COMMENT ON COLUMN institutional_13f_holdings.regime_z_score IS 'Z-score of equity allocation relative to 8-quarter history (bullish/bearish signal)';
COMMENT ON COLUMN institutional_13f_holdings.historical_allocation IS 'Array of historical quarterly allocations for trend analysis';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_institutional_13f_holdings_cik_date ON institutional_13f_holdings (cik, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_institutional_13f_holdings_date ON institutional_13f_holdings (as_of_date DESC);
