-- Migration: Prediction Market Integration via DomeAPI
-- Create the markets table, indices, and RLS policies

CREATE TABLE IF NOT EXISTS public.domeapi_markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id TEXT NOT NULL,
    question TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'kalshi', 'polymarket', 'predictit', etc.
    probability NUMERIC(5, 2) NOT NULL,
    volume NUMERIC(15, 2) DEFAULT 0,
    liquidity NUMERIC(15, 2) DEFAULT 0,
    open_interest NUMERIC(15, 2) DEFAULT 0,
    best_odds JSONB, -- { "yes": 0.65, "no": 0.35 }
    category TEXT, -- 'Monetary Policy', 'Inflation', 'Geopolitics', 'Elections', etc.
    affiliate_url TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, market_id)
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_domeapi_platform ON public.domeapi_markets(platform);
CREATE INDEX IF NOT EXISTS idx_domeapi_category ON public.domeapi_markets(category);
CREATE INDEX IF NOT EXISTS idx_domeapi_updated ON public.domeapi_markets(last_updated);

-- Enable RLS
ALTER TABLE public.domeapi_markets ENABLE ROW LEVEL SECURITY;

-- Create public read policy
CREATE POLICY "Allow public read access"
ON public.domeapi_markets
FOR SELECT
TO public
USING (true);

-- Grant permissions
GRANT SELECT ON public.domeapi_markets TO anon, authenticated;
