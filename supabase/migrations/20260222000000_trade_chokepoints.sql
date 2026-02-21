-- Create trade_chokepoints table
CREATE TABLE IF NOT EXISTS public.trade_chokepoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- e.g., 'Semiconductors', 'Energy', 'Rare Earths'
    hs_code TEXT NOT NULL, -- e.g., '8542'
    reporter_code TEXT NOT NULL, -- ISO code of reporting country
    reporter_name TEXT NOT NULL,
    partner_code TEXT NOT NULL, -- ISO code of partner country
    partner_name TEXT NOT NULL,
    period TEXT NOT NULL, -- e.g., '2023' or '2023-M01'
    trade_value_usd NUMERIC NOT NULL,
    net_weight_kg NUMERIC,
    reporter_is_exporter BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(category, hs_code, reporter_code, partner_code, period, reporter_is_exporter)
);

-- Enable RLS
ALTER TABLE public.trade_chokepoints ENABLE ROW LEVEL SECURITY;

-- Add read policy
CREATE POLICY "Allow public read access to trade_chokepoints"
    ON public.trade_chokepoints FOR SELECT
    USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_chokepoints_category ON public.trade_chokepoints(category);
CREATE INDEX IF NOT EXISTS idx_trade_chokepoints_hs_code ON public.trade_chokepoints(hs_code);
CREATE INDEX IF NOT EXISTS idx_trade_chokepoints_reporter ON public.trade_chokepoints(reporter_code);
CREATE INDEX IF NOT EXISTS idx_trade_chokepoints_partner ON public.trade_chokepoints(partner_code);
CREATE INDEX IF NOT EXISTS idx_trade_chokepoints_period ON public.trade_chokepoints(period);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trade_chokepoints_updated_at
    BEFORE UPDATE ON public.trade_chokepoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
