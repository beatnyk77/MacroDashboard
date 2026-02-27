-- Phase 6: Liquidity Risk Details
-- Adds Liquidity Transmission Lag proxy column

ALTER TABLE public.cie_macro_signals ADD COLUMN IF NOT EXISTS liquidity_transmission_lag NUMERIC;
