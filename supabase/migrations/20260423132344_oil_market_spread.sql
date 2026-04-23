-- ============================================================
-- Oil Market Stress Indicator: Schema Migration
-- Creates: oil_market_spread
-- ============================================================

CREATE TABLE IF NOT EXISTS public.oil_market_spread (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date              date NOT NULL,
    front_price       numeric(10,2) NOT NULL,
    next_price        numeric(10,2) NOT NULL,
    spread            numeric(10,2) NOT NULL,
    regime            text NOT NULL CHECK (regime IN ('OVERSUPPLY', 'NORMAL', 'TIGHTENING', 'STRESSED', 'EXTREME')),
    change_1d         numeric(10,2),
    change_3d         numeric(10,2),
    metadata          jsonb DEFAULT '{}',
    created_at        timestamptz DEFAULT now(),
    CONSTRAINT oil_market_spread_date_unique UNIQUE (date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oil_market_spread_date
    ON public.oil_market_spread(date DESC);

-- RLS Policies
ALTER TABLE public.oil_market_spread ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oil_market_spread_public_read"
    ON public.oil_market_spread FOR SELECT USING (true);

CREATE POLICY "oil_market_spread_service_write"
    ON public.oil_market_spread FOR ALL
    TO service_role USING (true) WITH CHECK (true);
