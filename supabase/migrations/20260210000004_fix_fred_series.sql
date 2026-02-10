-- Fix failing FRED series IDs and metadata
-- 1. Updates Japan Bank Loans to valid FRED series
-- 2. Updates BoJ Monetary Base to BoJ Total Assets (proxy) due to API failures
-- 3. Deactivates ECB MRO/DF metrics (no valid FRED series for outstanding amounts)
-- 4. Corrects Primary Dealer Holdings to use NY Fed source, not FRED

BEGIN;

-- 1. Japan Bank Loans: JPNLOAN -> JPNFCSODCXDC
UPDATE public.metrics
SET metadata = jsonb_set(metadata, '{fred_id}', '"JPNFCSODCXDC"'),
    name = 'Japan Bank Loans (Commercial)',
    description = 'Outstanding Loans at Commercial Banks for Japan'
WHERE id = 'JP_CREDIT_TOTAL';

-- 2. BoJ Monetary Base -> BoJ Total Assets (JPNASSETS)
-- BASEML2257AMI is failing 400. We use JPNASSETS (Total Assets) as a proxy for the balance sheet size metric.
-- We keep the ID 'BOJ_MONETARY_BASE_TRJPY' to avoid FK violations, but update the name and metadata.
UPDATE public.metrics
SET name = 'BoJ Total Assets',
    description = 'Bank of Japan: Total Assets (Proxy for Monetary Base)',
    metadata = jsonb_set(metadata, '{fred_id}', '"JPNASSETS"')
WHERE id = 'BOJ_MONETARY_BASE_TRJPY';

-- 3. Deactivate ECB MRO/DF (Only rates available on FRED, not outstanding amounts)
UPDATE public.metrics
SET is_active = false
WHERE id IN ('ECB_MRO_OUTSTANDING_MEUR', 'ECB_DF_OUTSTANDING_MEUR');

-- 4. Fix Primary Dealer Holdings source
-- It was incorrectly assigned source_id = 1 (FRED) but has no FRED ID.
-- Assign to NY Fed Markets (source_id = 8, per data_sources query) and remove fred_id if present.
UPDATE public.metrics
SET source_id = (SELECT id FROM public.data_sources WHERE name = 'NY Fed Markets'),
    metadata = metadata - 'fred_id'
WHERE id = 'PRIMARY_DEALER_TREASURY_HOLDINGS_BN';

COMMIT;
