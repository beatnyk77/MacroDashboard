-- Migration: Add Oil Import Cost in Local Currency
-- Description: Adds columns to store USD and local currency weighted average costs per barrel.

-- 1. Extend oil_imports_by_origin table
ALTER TABLE public.oil_imports_by_origin 
ADD COLUMN IF NOT EXISTS import_cost_usd NUMERIC,
ADD COLUMN IF NOT EXISTS import_cost_local_currency NUMERIC,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC,
ADD COLUMN IF NOT EXISTS brent_price_usd NUMERIC;

-- 2. Add description to columns
COMMENT ON COLUMN public.oil_imports_by_origin.import_cost_usd IS 'Crude oil import cost in USD per barrel (Weighted Average).';
COMMENT ON COLUMN public.oil_imports_by_origin.import_cost_local_currency IS 'Crude oil import cost in local currency (INR/CNY) per barrel (Weighted Average).';
COMMENT ON COLUMN public.oil_imports_by_origin.exchange_rate IS 'Exchange rate (INR/USD or CNY/USD) used for calculation.';
COMMENT ON COLUMN public.oil_imports_by_origin.brent_price_usd IS 'Benchmark Brent price in USD used as proxy for import cost.';

-- 3. Ensure OIL_BRENT_PRICE_USD metric exists (if not already there from general metrics)
WITH source AS (
    SELECT id FROM public.data_sources WHERE name = 'EIA' LIMIT 1
)
INSERT INTO public.metrics (id, name, description, category, source_id, native_frequency, display_frequency, expected_interval_days, is_active, metadata)
VALUES 
(
    'OIL_BRENT_PRICE_USD',
    'Brent Crude Oil Price',
    'Global benchmark price for crude oil (USD/bbl).',
    'energy',
    (SELECT id FROM source),
    'daily',
    'daily',
    1,
    true,
    '{"unit": "usd/bbl", "eia_series_id": "PET.RBRTE.D"}'::jsonb
)
ON CONFLICT (id) DO UPDATE 
SET 
    description = EXCLUDED.description,
    metadata = EXCLUDED.metadata;
