-- =====================================================
-- Subscribers — TradeFx affiliate lead capture fields
-- =====================================================
-- Extends the existing insert-only subscribers table for
-- /trade-fx partner referral leads. No new table required.

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS lead_type TEXT,
  ADD COLUMN IF NOT EXISTS trade_role TEXT,
  ADD COLUMN IF NOT EXISTS currency_pair TEXT,
  ADD COLUMN IF NOT EXISTS notional_range TEXT,
  ADD COLUMN IF NOT EXISTS partner_preference TEXT,
  ADD COLUMN IF NOT EXISTS interest_type TEXT;

COMMENT ON COLUMN public.subscribers.lead_type IS
  'TradeFx lead classification: trade_fx_bank_referral | trade_fx_skydo | trade_fx_alert';
COMMENT ON COLUMN public.subscribers.trade_role IS
  'TradeFx exposure role: exporter | importer | balanced';
COMMENT ON COLUMN public.subscribers.notional_range IS
  'Illustrative FC notional band: <1Cr | 1-5Cr | 5-25Cr | >25Cr';