-- =====================================================
-- Migration: Create trade_gravity table for TradeGravityCard
-- Created: 2026-04-08
-- =====================================================
-- This table stores aggregated trade share data for key
-- "swing states" showing the shift between G7 and BRICS+
-- trade allegiances over time (2018-2023).
--
-- Primary Key: (swing_state_code, bloc, period)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trade_gravity (
    swing_state_code TEXT NOT NULL,
    swing_state_name TEXT NOT NULL,
    bloc TEXT NOT NULL CHECK (bloc IN ('BRICS+', 'G7')),
    period TEXT NOT NULL,
    trade_value_usd NUMERIC NOT NULL,
    trade_share_pct NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (swing_state_code, bloc, period)
);

ALTER TABLE public.trade_gravity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to trade_gravity"
    ON public.trade_gravity FOR SELECT USING (true);

CREATE POLICY "Allow service_role full access to trade_gravity"
    ON public.trade_gravity FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT ON public.trade_gravity TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_trade_gravity_state_name ON public.trade_gravity(swing_state_name);
CREATE INDEX IF NOT EXISTS idx_trade_gravity_period ON public.trade_gravity(period);
CREATE INDEX IF NOT EXISTS idx_trade_gravity_bloc ON public.trade_gravity(bloc);

CREATE OR REPLACE FUNCTION update_trade_gravity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trade_gravity_updated_at ON public.trade_gravity;

CREATE TRIGGER update_trade_gravity_updated_at
    BEFORE UPDATE ON public.trade_gravity
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_gravity_updated_at();

COMMENT ON TABLE public.trade_gravity IS 'Aggregated trade share by economic bloc (BRICS+ vs G7) for key swing states. Used by TradeGravityCard component.';