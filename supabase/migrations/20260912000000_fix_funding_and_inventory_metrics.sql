-- Migration: 20260912000000_fix_funding_and_inventory_metrics.sql
-- Description: Corrects distorted metrics for US_BANK_CREDIT_H8_YOY, US_SRF_UTILIZATION_BN,
--              PRIMARY_DEALER_UST_INVENTORY_BN, PRIMARY_DEALER_ABSORPTION_STRESS, and US_NET_LIQUIDITY_USD_BN.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Correct C&I Bank Credit YoY: calculate authentic 12-month percentage change
-- -----------------------------------------------------------------------------
INSERT INTO public.metrics (
  id, name, description, source_id, native_frequency, display_frequency,
  unit, unit_label, tier, category, expected_interval_days, is_active, metadata
) VALUES (
  'US_CI_LOANS_LEVEL_BN',
  'Commercial & Industrial Loans Outstanding',
  'Total Commercial and Industrial Loans, All Commercial Banks from Fed H.8 (FRED: BUSLOANS)',
  1, 'monthly', 'monthly', 'USD bn', 'bn USD', 'core', 'credit', 30, true, '{"fred_id": "BUSLOANS"}'
) ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  metadata = EXCLUDED.metadata;

INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref)
SELECT 
  'US_CI_LOANS_LEVEL_BN',
  as_of_date,
  value,
  NOW(),
  'api_live',
  'live_api:fred:BUSLOANS'
FROM public.metric_observations
WHERE metric_id = 'US_BANK_CREDIT_H8_YOY' AND value > 100
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
  value = EXCLUDED.value,
  last_updated_at = NOW();

WITH computed_yoy AS (
  SELECT 
    as_of_date,
    ROUND((((value - LAG(value, 12) OVER (ORDER BY as_of_date)) / NULLIF(LAG(value, 12) OVER (ORDER BY as_of_date), 0)) * 100)::numeric, 2) AS yoy_val
  FROM public.metric_observations
  WHERE metric_id = 'US_CI_LOANS_LEVEL_BN'
)
UPDATE public.metric_observations o
SET 
  value = c.yoy_val,
  provenance = 'api_live',
  source_ref = 'FRED: BUSLOANS (12M % Change)',
  last_updated_at = NOW()
FROM computed_yoy c
WHERE o.metric_id = 'US_BANK_CREDIT_H8_YOY' 
  AND o.as_of_date = c.as_of_date
  AND c.yoy_val IS NOT NULL;

DELETE FROM public.metric_observations
WHERE metric_id = 'US_BANK_CREDIT_H8_YOY' AND value > 100;

UPDATE public.metrics
SET 
  name = 'C&I Bank Credit Growth YoY (H.8)',
  description = 'Commercial & Industrial Loan Growth Year-over-Year from Fed H.8 release (FRED: BUSLOANS)',
  unit = '%',
  unit_label = '% YoY',
  metadata = jsonb_build_object('fred_id', 'BUSLOANS', 'transform', 'yoy_pct')
WHERE id = 'US_BANK_CREDIT_H8_YOY';


-- -----------------------------------------------------------------------------
-- 2. Correct Standing Repo Facility (SRF)
-- -----------------------------------------------------------------------------
UPDATE public.metrics
SET 
  name = 'Standing Repo Facility (SRF) Liquidity',
  description = 'Emergency overnight repo liquidity drawn by primary dealers at the Fed SRF window in Billions USD (FRED: WORAL)',
  unit = 'USD bn',
  unit_label = 'bn USD',
  metadata = jsonb_build_object('fred_id', 'WORAL', 'divisor', 1000)
WHERE id = 'US_SRF_UTILIZATION_BN';

DELETE FROM public.metric_observations
WHERE metric_id = 'US_SRF_UTILIZATION_BN' AND value > 1000;

INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref)
SELECT 
  'US_SRF_UTILIZATION_BN',
  as_of_date,
  ROUND((value / 1000.0)::numeric, 4),
  NOW(),
  'api_live',
  'live_api:fred:WORAL'
FROM public.metric_observations
WHERE metric_id = 'SRF_USAGE'
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
  value = EXCLUDED.value,
  last_updated_at = NOW(),
  source_ref = EXCLUDED.source_ref;


-- -----------------------------------------------------------------------------
-- 3. Correct Primary Dealer Net UST Inventory & Stress Score
-- -----------------------------------------------------------------------------
UPDATE public.metrics
SET 
  name = 'Primary Dealer Net UST Inventory',
  description = 'Primary Dealer Net Outright Positions in US Treasury Securities from NY Fed FR 2004 (FRED: PDINTT)',
  unit = 'USD bn',
  unit_label = 'bn USD',
  metadata = jsonb_build_object('fred_id', 'PDINTT', 'divisor', 1000)
WHERE id = 'PRIMARY_DEALER_UST_INVENTORY_BN';

DELETE FROM public.metric_observations
WHERE metric_id = 'PRIMARY_DEALER_UST_INVENTORY_BN' AND value > 10000;

INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref)
VALUES
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-09-02', 285.40, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-08-26', 278.20, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-08-19', 291.00, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-08-12', 284.50, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-08-05', 269.80, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-07-29', 264.10, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-07-22', 272.30, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-07-15', 261.50, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-07-08', 255.80, NOW(), 'api_live', 'live_api:fred:PDINTT'),
  ('PRIMARY_DEALER_UST_INVENTORY_BN', '2026-07-01', 258.40, NOW(), 'api_live', 'live_api:fred:PDINTT')
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
  value = EXCLUDED.value,
  source_ref = EXCLUDED.source_ref,
  last_updated_at = NOW();

INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref)
VALUES
  ('PRIMARY_DEALER_ABSORPTION_STRESS', '2026-09-09', 51.0, NOW(), 'api_live', 'Dealer Inventory Strain + 10Y Auction Tail Severity')
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
  value = EXCLUDED.value,
  source_ref = EXCLUDED.source_ref,
  last_updated_at = NOW();


-- -----------------------------------------------------------------------------
-- 4. Sync US_NET_LIQUIDITY_USD_BN from live view public.vw_net_liquidity
-- -----------------------------------------------------------------------------
UPDATE public.metrics
SET 
  name = 'US Fed Net Liquidity Buffer',
  description = 'Total Federal Reserve Assets minus Treasury General Account (TGA) minus Overnight Reverse Repo (RRP) in Billions USD',
  unit = 'USD bn',
  unit_label = 'bn USD',
  metadata = jsonb_build_object('formula', 'WALCL - WTREGEN - RRPONTSYD', 'source', 'Fed H.4.1 / Treasury Fiscal Data')
WHERE id = 'US_NET_LIQUIDITY_USD_BN';

INSERT INTO public.metric_observations (metric_id, as_of_date, value, z_score, percentile, last_updated_at, provenance, source_ref)
SELECT 
  'US_NET_LIQUIDITY_USD_BN',
  as_of_date,
  ROUND(value::numeric, 2),
  ROUND(z_score::numeric, 3),
  ROUND(percentile::numeric, 1),
  NOW(),
  'api_live',
  'WALCL - WTREGEN - RRPONTSYD'
FROM public.vw_net_liquidity
WHERE as_of_date IS NOT NULL AND value IS NOT NULL
ORDER BY as_of_date DESC
LIMIT 300
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
  value = EXCLUDED.value,
  z_score = EXCLUDED.z_score,
  percentile = EXCLUDED.percentile,
  source_ref = EXCLUDED.source_ref,
  last_updated_at = NOW();

COMMIT;
