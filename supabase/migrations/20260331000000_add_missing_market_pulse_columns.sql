-- Add missing columns to market_pulse_daily for complete FII/DII coverage

ALTER TABLE public.market_pulse_daily
    ADD COLUMN IF NOT EXISTS fii_stk_fut_net NUMERIC,
    ADD COLUMN IF NOT EXISTS dii_idx_fut_net NUMERIC,
    ADD COLUMN IF NOT EXISTS dii_stk_fut_net NUMERIC,
    ADD COLUMN IF NOT EXISTS client_idx_fut_net NUMERIC,
    ADD COLUMN IF NOT EXISTS client_stk_fut_net NUMERIC;

-- Existing columns check (these should already exist, but ensure)
-- circuits_pct, delivery_pct, new_highs_52w, new_lows_52w are already in schema
