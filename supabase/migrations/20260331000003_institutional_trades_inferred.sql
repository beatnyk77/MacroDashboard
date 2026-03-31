-- =====================================================
-- Migration: Institutional Trades Inferred Table
-- Created: 2026-03-31
-- Purpose: Store recently inferred institutional trades from 13-F QoQ changes for Trade Tape display
-- =====================================================

-- Store recently inferred trades for the Trade Tape
CREATE TABLE IF NOT EXISTS institutional_trades_inferred (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cik TEXT NOT NULL,
    fund_name TEXT NOT NULL,
    ticker TEXT,
    cusip TEXT,
    trade_type TEXT CHECK (trade_type IN ('BUY', 'SELL', 'INITIATE', 'EXIT', 'INCREASE', 'DECREASE')),
    direction TEXT CHECK (direction IN ('ACCUMULATE', 'DISTRIBUTE', 'NEUTRAL')),
    sector TEXT,
    prior_qty_usd NUMERIC,
    current_qty_usd NUMERIC,
    delta_usd NUMERIC,
    delta_pct NUMERIC,
    price_change_pct NUMERIC,  -- Alpha Vantage 3M return for context
    conviction_score NUMERIC,   -- 1-10 based on delta_pct relative to AUM
    as_of_date DATE NOT NULL,  -- Report date (13-F quarter end)
    inferred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast recent-trade queries
CREATE INDEX IF NOT EXISTS idx_trades_inferred_cik_date ON institutional_trades_inferred(cik, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_inferred_inferred_at ON institutional_trades_inferred(inferred_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_inferred_conviction ON institutional_trades_inferred(conviction_score DESC);
CREATE INDEX IF NOT EXISTS idx_trades_inferred_sector ON institutional_trades_inferred(sector);

-- Row Level Security (RLS) - allow public read for now, adjust as needed
ALTER TABLE institutional_trades_inferred ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (dashboard is public)
CREATE POLICY "Public read access for trades inferred" ON institutional_trades_inferred
    FOR SELECT USING (true);

-- Policy: Allow service role to insert/delete
CREATE POLICY "Service role full access" ON institutional_trades_inferred
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Comment
COMMENT ON TABLE institutional_trades_inferred IS 'Inferred recent institutional trades derived from 13-F quarter-over-quarter changes combined with market price context. Powers the Trade Tape.';
COMMENT ON COLUMN institutional_trades_inferred.conviction_score IS '1-10 score based on delta_pct relative to fund AUM; higher means higher conviction move.';
COMMENT ON COLUMN institutional_trades_inferred.trade_type IS 'Type of trade: BUY/SELL for direction; INITIATE/EXIT for new/discontinued positions; INCREASE/DECREASE for position sizing changes.';
COMMENT ON COLUMN institutional_trades_inferred.direction IS 'Aggregated directional signal: ACCUMULATE (net buying), DISTRIBUTE (net selling), NEUTRAL.';
