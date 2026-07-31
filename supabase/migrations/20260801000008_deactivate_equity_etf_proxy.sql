-- CAPITAL_FROM_EQUITY_ETF_BN was given fred_id_proxy=WLODLL in Task 1, but no
-- special-case branch was added in Task 4 (only COPPER_GOLD_RATIO + CNY_INR).
-- Leaving it active would keep it silently stale forever. Deactivate until a
-- real scaled fund-flow proxy is designed.
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'Proxy requires scaled equity fund-flow model (fred_id_proxy=WLODLL set but no ingest branch). Out of scope for this fix — deactivate rather than leave silently orphaned.'
    )
WHERE id = 'CAPITAL_FROM_EQUITY_ETF_BN';
