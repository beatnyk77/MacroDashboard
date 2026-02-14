-- US Treasury Auction Data Table
CREATE TABLE IF NOT EXISTS public.us_treasury_auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_date DATE NOT NULL,
    security_type VARCHAR(50) NOT NULL, -- 'Bill', 'Note', 'Bond', 'TIPS', 'FRN'
    term VARCHAR(20), -- '4-Week', '13-Week', '2-Year', '10-Year', etc.
    
    -- Core Auction Metrics
    bid_to_cover NUMERIC, -- Bid-to-Cover Ratio
    high_yield NUMERIC, -- High Yield %
    total_tendered NUMERIC, -- Total amount bid (millions)
    total_accepted NUMERIC, -- Total amount accepted (millions)
    
    -- Bidder Breakdown (%)
    primary_dealer_pct NUMERIC, -- Primary dealer take-down %
    indirect_bidder_pct NUMERIC, -- Foreign/institutional demand proxy
    direct_bidder_pct NUMERIC, -- Direct bidder %
    
    -- Calculated Metrics
    demand_strength_score NUMERIC, -- bid_to_cover × (indirect_bidder_pct / 100)
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(auction_date, security_type, term)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_auctions_date ON public.us_treasury_auctions(auction_date DESC);
CREATE INDEX IF NOT EXISTS idx_auctions_score ON public.us_treasury_auctions(demand_strength_score DESC);

-- Enable RLS
ALTER TABLE public.us_treasury_auctions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to us_treasury_auctions" 
ON public.us_treasury_auctions FOR SELECT 
USING (true);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_us_treasury_auctions_updated_at
    BEFORE UPDATE ON public.us_treasury_auctions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
