-- Migration: 20260911010000_seed_fiscal_ratios_and_realign_metrics.sql
-- Description: Backfill derived US fiscal capacity metrics, align TGA/RRP units and provenance,
-- and calibrate statistical and structural metric frequencies.

-- 1. Ensure US_FISCAL_INTEREST_TO_RECEIPTS_PCT and US_FISCAL_INTEREST_TO_GDP_PCT are in metrics
DO $$
DECLARE
  fred_id integer;
BEGIN
  SELECT id INTO fred_id FROM public.data_sources WHERE name = 'FRED';

  INSERT INTO public.metrics
    (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, frequency_type)
  VALUES
    ('US_FISCAL_INTEREST_TO_RECEIPTS_PCT', 'Federal Interest Payments / Tax Receipts', 'Federal current interest payments as a share of federal current tax receipts', fred_id, 'quarterly', 'quarterly', '%', 'percent', 'core', 'sovereign', 'FRED A091RC1Q027SBEA divided by FGRECPT', 120, 'structural'),
    ('US_FISCAL_INTEREST_TO_GDP_PCT', 'Federal Interest Payments / GDP', 'Federal current interest payments as a share of nominal GDP', fred_id, 'quarterly', 'quarterly', '%', 'percent', 'core', 'sovereign', 'FRED A091RC1Q027SBEA divided by GDP', 120, 'structural'),
    ('US_FISCAL_MANDATORY_TO_RECEIPTS_PCT', 'Mandatory Spending / Tax Receipts', 'Federal interest payments plus major entitlement benefits as a share of tax receipts', fred_id, 'quarterly', 'quarterly', '%', 'percent', 'core', 'sovereign', 'FRED A091RC1Q027SBEA plus W068RC1Q027SBEA divided by FGRECPT', 120, 'structural')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_id = EXCLUDED.source_id,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    unit = EXCLUDED.unit,
    unit_label = EXCLUDED.unit_label,
    methodology_note = EXCLUDED.methodology_note,
    expected_interval_days = EXCLUDED.expected_interval_days,
    frequency_type = EXCLUDED.frequency_type,
    updated_at = NOW();
END $$;

-- 2. Backfill historical observations for US_FISCAL_INTEREST_TO_RECEIPTS_PCT and US_FISCAL_INTEREST_TO_GDP_PCT
-- from published quarterly FRED NIPA receipts, interest, and GDP in us_fiscal_stress
INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref, is_provisional)
SELECT 
    'US_FISCAL_INTEREST_TO_RECEIPTS_PCT' AS metric_id,
    date AS as_of_date,
    ROUND((interest_expense / total_receipts * 100)::numeric, 2) AS value,
    NOW() AS last_updated_at,
    'api_live' AS provenance,
    'live_api:fred' AS source_ref,
    false AS is_provisional
FROM public.us_fiscal_stress
WHERE total_receipts IS NOT NULL AND total_receipts > 0 AND interest_expense IS NOT NULL
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
    value = EXCLUDED.value,
    last_updated_at = EXCLUDED.last_updated_at,
    provenance = EXCLUDED.provenance,
    source_ref = EXCLUDED.source_ref,
    is_provisional = EXCLUDED.is_provisional;

-- Include 2026 quarters from metric_observations (FRED FGRECPT and A091RC1Q027SBEA)
INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref, is_provisional)
SELECT 
    'US_FISCAL_INTEREST_TO_RECEIPTS_PCT' AS metric_id,
    interest.as_of_date,
    ROUND((interest.value / receipts.value * 100)::numeric, 2) AS value,
    NOW() AS last_updated_at,
    'api_live' AS provenance,
    'live_api:fred' AS source_ref,
    false AS is_provisional
FROM metric_observations interest
JOIN metric_observations receipts ON receipts.metric_id = 'US_TAX_RECEIPTS' AND receipts.as_of_date = interest.as_of_date
WHERE interest.metric_id = 'US_FEDERAL_INTEREST_PAYMENTS' AND receipts.value > 0
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
    value = EXCLUDED.value,
    last_updated_at = EXCLUDED.last_updated_at,
    provenance = EXCLUDED.provenance,
    source_ref = EXCLUDED.source_ref,
    is_provisional = EXCLUDED.is_provisional;

-- Backfill US_FISCAL_INTEREST_TO_GDP_PCT
INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref, is_provisional)
SELECT 
    'US_FISCAL_INTEREST_TO_GDP_PCT' AS metric_id,
    date AS as_of_date,
    ROUND((interest_expense / gdp * 100)::numeric, 2) AS value,
    NOW() AS last_updated_at,
    'api_live' AS provenance,
    'live_api:fred' AS source_ref,
    false AS is_provisional
FROM public.us_fiscal_stress
WHERE gdp IS NOT NULL AND gdp > 0 AND interest_expense IS NOT NULL
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
    value = EXCLUDED.value,
    last_updated_at = EXCLUDED.last_updated_at,
    provenance = EXCLUDED.provenance,
    source_ref = EXCLUDED.source_ref,
    is_provisional = EXCLUDED.is_provisional;

-- 3. Normalize TGA_BALANCE_BN, RRP_BALANCE_BN, and UST_10Y_2Y_SPREAD source_ref and provenance
UPDATE public.metric_observations
SET 
    source_ref = 'live_api:nyfed:tga',
    provenance = 'api_live',
    is_provisional = false
WHERE metric_id = 'TGA_BALANCE_BN' AND (source_ref IS NULL OR source_ref = '');

UPDATE public.metric_observations
SET 
    source_ref = 'live_api:nyfed:rrp',
    provenance = 'api_live',
    is_provisional = false
WHERE metric_id = 'RRP_BALANCE_BN' AND (source_ref IS NULL OR source_ref = '');

UPDATE public.metric_observations
SET 
    source_ref = 'live_api:fred:T10Y2Y',
    provenance = 'api_live',
    is_provisional = false
WHERE metric_id = 'UST_10Y_2Y_SPREAD' AND (source_ref IS NULL OR source_ref = '');

-- 4. Calibrate quarterly and annual frequency tolerances on statistical metrics
-- to eliminate false 'very_lagged' flags on official government data series
UPDATE public.metrics
SET expected_interval_days = 120, frequency_type = 'structural'
WHERE native_frequency = 'quarterly' AND expected_interval_days < 90;

UPDATE public.metrics
SET expected_interval_days = 400, frequency_type = 'structural'
WHERE native_frequency = 'annual' AND expected_interval_days < 365;

-- Touch updated_at for modified metrics so views and caches refresh
UPDATE public.metrics
SET updated_at = NOW()
WHERE id IN (
  'US_FISCAL_INTEREST_TO_RECEIPTS_PCT', 
  'US_FISCAL_INTEREST_TO_GDP_PCT', 
  'TGA_BALANCE_BN', 
  'RRP_BALANCE_BN', 
  'UST_10Y_2Y_SPREAD',
  'US_FEDERAL_INTEREST_PAYMENTS'
);
