-- Add MSF and SDF rate columns to rbi_liquidity_ops

ALTER TABLE public.rbi_liquidity_ops
ADD COLUMN IF NOT EXISTS msf_rate numeric,
ADD COLUMN IF NOT EXISTS sdf_rate numeric;

COMMENT ON COLUMN public.rbi_liquidity_ops.msf_rate IS 'Marginal Standing Facility (MSF) rate in percent for the day';
COMMENT ON COLUMN public.rbi_liquidity_ops.sdf_rate IS 'Standing Deposit Facility (SDF) rate in percent for the day';
