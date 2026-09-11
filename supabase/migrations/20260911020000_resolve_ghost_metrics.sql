-- Migration: 20260911020000_resolve_ghost_metrics.sql
-- Description: Backfill remaining US fiscal capacity indicators from historical NIPA series
-- and mark unpopulated metrics without ingestion pipelines as inactive.

-- 1. Ensure metrics metadata is updated for the remaining US fiscal indicators
UPDATE public.metrics
SET 
  expected_interval_days = 120,
  frequency_type = 'structural',
  is_active = true,
  updated_at = NOW()
WHERE id IN (
  'US_FISCAL_ENTITLEMENTS_TO_RECEIPTS_PCT',
  'US_FISCAL_MANDATORY_TO_RECEIPTS_PCT',
  'US_FISCAL_EMPLOYMENT_TAX_SHARE_PCT'
);

-- 2. Backfill historical observations for US_FISCAL_ENTITLEMENTS_TO_RECEIPTS_PCT
INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref, is_provisional)
SELECT 
    'US_FISCAL_ENTITLEMENTS_TO_RECEIPTS_PCT' AS metric_id,
    date AS as_of_date,
    ROUND((entitlements / total_receipts * 100)::numeric, 2) AS value,
    NOW() AS last_updated_at,
    'api_live' AS provenance,
    'live_api:fred' AS source_ref,
    false AS is_provisional
FROM public.us_fiscal_stress
WHERE total_receipts IS NOT NULL AND total_receipts > 0 AND entitlements IS NOT NULL
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
    value = EXCLUDED.value,
    last_updated_at = EXCLUDED.last_updated_at,
    provenance = EXCLUDED.provenance,
    source_ref = EXCLUDED.source_ref,
    is_provisional = EXCLUDED.is_provisional;

-- 3. Backfill historical observations for US_FISCAL_MANDATORY_TO_RECEIPTS_PCT
INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref, is_provisional)
SELECT 
    'US_FISCAL_MANDATORY_TO_RECEIPTS_PCT' AS metric_id,
    date AS as_of_date,
    ROUND(fiscal_dominance_ratio::numeric, 2) AS value,
    NOW() AS last_updated_at,
    'api_live' AS provenance,
    'live_api:fred' AS source_ref,
    false AS is_provisional
FROM public.us_fiscal_stress
WHERE total_receipts IS NOT NULL AND total_receipts > 0 AND fiscal_dominance_ratio IS NOT NULL
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
    value = EXCLUDED.value,
    last_updated_at = EXCLUDED.last_updated_at,
    provenance = EXCLUDED.provenance,
    source_ref = EXCLUDED.source_ref,
    is_provisional = EXCLUDED.is_provisional;

-- 4. Backfill historical observations for US_FISCAL_EMPLOYMENT_TAX_SHARE_PCT
INSERT INTO public.metric_observations (metric_id, as_of_date, value, last_updated_at, provenance, source_ref, is_provisional)
SELECT 
    'US_FISCAL_EMPLOYMENT_TAX_SHARE_PCT' AS metric_id,
    date AS as_of_date,
    ROUND((employment_tax_share * 100)::numeric, 2) AS value,
    NOW() AS last_updated_at,
    'api_live' AS provenance,
    'live_api:fred' AS source_ref,
    false AS is_provisional
FROM public.us_fiscal_stress
WHERE total_receipts IS NOT NULL AND total_receipts > 0 AND employment_tax_share IS NOT NULL
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
    value = EXCLUDED.value,
    last_updated_at = EXCLUDED.last_updated_at,
    provenance = EXCLUDED.provenance,
    source_ref = EXCLUDED.source_ref,
    is_provisional = EXCLUDED.is_provisional;

-- 5. Mark unpopulated metrics without ingestion pipelines as is_active = false
-- to prevent empty cards and broken data feeds from surfacing in the terminal
UPDATE public.metrics
SET 
  is_active = false,
  updated_at = NOW()
WHERE id IN (
  'AFRICA_CHINA_TRADE_GRAVITY',
  'AFRICA_DEBT_GDP_AVG',
  'CB_GOLD_NET',
  'CN_COAL_GENERATION_TWH',
  'CN_CREDIT_IMPULSE',
  'CN_DEBT_CENTRAL_GDP_PCT',
  'CN_DEBT_WALL_PROXIMITY',
  'CN_FISCAL_BALANCE_GDP_PCT',
  'CN_ICEBERG_RATIO',
  'CN_IP_YOY',
  'CN_LAND_FISCAL_DEPENDENCE',
  'CN_LGFV_STRESS_INDEX',
  'CN_MONETIZATION_PRESSURE',
  'CN_PPI_YOY',
  'CN_RENEWABLE_SHARE_PCT',
  'CN_RG_DIFFERENTIAL',
  'CRACK_SPREAD_321_USD',
  'EU_RENEWABLE_SHARE_PCT',
  'GLOBAL_OIL_REFINING_UTILIZATION',
  'IN_BANK_CREDIT_GROWTH_YOY',
  'IN_FII_INDEX_FUTURE_LONG_SHORT_RATIO',
  'IN_FII_INDEX_FUTURE_NET',
  'IN_FII_PUT_CALL_POSITIONING',
  'IN_FUEL_CONSUMPTION_MBPD',
  'IN_FUEL_IMPORT_COST_INR',
  'IN_FUEL_RESERVES_DAYS',
  'IN_GEOPOLITICAL_RISK_SCORE',
  'IN_MARKET_BREADTH',
  'IN_NSDL_SECTOR_AUM',
  'IN_NSDL_SECTOR_FLOW',
  'IN_NSDL_SECTOR_FLOWS',
  'IN_NSE_FLOWS',
  'US_13F',
  'US_EDGAR_FUNDAMENTALS',
  'US_FILINGS_COUNT',
  'US_INSIDER_TRADES'
);
