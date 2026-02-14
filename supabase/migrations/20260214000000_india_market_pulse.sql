-- India Market Pulse Daily Data Table
CREATE TABLE IF NOT EXISTS public.market_pulse_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    
    -- Cash Market Flows
    fii_cash_net NUMERIC, -- FII net in Cr
    dii_cash_net NUMERIC, -- DII net in Cr
    
    -- Derivatives Sentiment
    fii_idx_fut_net NUMERIC, -- FII Index Futures Net in Cr
    pcr NUMERIC, -- Put-Call Ratio
    india_vix NUMERIC, -- India VIX Close
    india_vix_zscore NUMERIC, -- Z-score for India VIX
    
    -- Breadth & Quality
    advances INTEGER,
    declines INTEGER,
    delivery_pct NUMERIC, -- Delivery % across Nifty 50 or total market
    circuits_pct NUMERIC, -- % of stocks hitting upper/lower circuits
    
    -- Sector Rotation (JSONB map of sector -> % change)
    sector_returns JSONB DEFAULT '{}'::jsonb,
    
    -- Mid/Smallcap Risk
    midcap_perf NUMERIC, -- Midcap 100 % change
    smallcap_perf NUMERIC, -- Smallcap 100 % change
    nifty_perf NUMERIC, -- Nifty 50 % change
    new_highs_52w INTEGER,
    new_lows_52w INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_market_pulse_date ON public.market_pulse_daily(date DESC);

-- Enable RLS
ALTER TABLE public.market_pulse_daily ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to market_pulse_daily" 
ON public.market_pulse_daily FOR SELECT 
USING (true);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_market_pulse_daily_updated_at
    BEFORE UPDATE ON public.market_pulse_daily
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
