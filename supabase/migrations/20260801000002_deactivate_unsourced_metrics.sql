-- These metrics were registered under source=FRED but no such series exists
-- on FRED. Building a bespoke BIS/BOJ/China-bond-market API client is out of
-- scope for this fix (see design doc non-goals). Deactivating rather than
-- leaving them silently stale forever, per the project's "no fabricated
-- data, show unavailable" rule — a badge showing genuinely nothing is more
-- honest than a badge showing a number that will never update.

UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'No FRED-published series exists for this indicator; verified via FRED search 2026-08-01. Requires a dedicated BIS/BOJ/China-bond-market integration, tracked as a follow-up, not fabricated.'
    )
WHERE id IN (
    'CN_CGB_YIELD_10Y',
    'CN_CGB_YIELD_2Y',
    'BIS_GLOBAL_LIQUIDITY_USD_BN',
    'BIS_GLOBAL_LIQUIDITY_USD_YOY_PCT',
    'BOJ_CURRENT_ACCOUNT_DEPOSITS_TRJPY',
    'BOJ_EXCESS_RESERVES_TRJPY',
    'BOJ_JGB_HOLDINGS_TRJPY'
);
