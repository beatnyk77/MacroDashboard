-- Migration: Kalshi Fed Funds Integration
-- Create the probabilities table, indices, and RLS policies

CREATE TABLE IF NOT EXISTS public.kalshi_fomc_probabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL,
    market_name TEXT NOT NULL,
    probability NUMERIC(5, 2) NOT NULL,
    volume_contracts INTEGER NOT NULL DEFAULT 0,
    prev_day_probability NUMERIC(5, 2),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_kalshi_ticker ON public.kalshi_fomc_probabilities(ticker);
CREATE INDEX IF NOT EXISTS idx_kalshi_fetched_at ON public.kalshi_fomc_probabilities(fetched_at);

-- Enable RLS
ALTER TABLE public.kalshi_fomc_probabilities ENABLE ROW LEVEL SECURITY;

-- Create public read policy
CREATE POLICY "Allow public read access"
ON public.kalshi_fomc_probabilities
FOR SELECT
TO public
USING (true);

-- Grant permissions (if needed)
GRANT SELECT ON public.kalshi_fomc_probabilities TO anon, authenticated;
