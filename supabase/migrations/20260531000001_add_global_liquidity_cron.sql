-- 20260531000001_add_global_liquidity_cron.sql
-- Wires ingest-global-liquidity into the weekly cron schedule.
-- Function was deployed but never scheduled — table has been stale since 2026-03-25.
-- Primary inputs (WALCL, ECBASSETSW) are weekly series; schedule after
-- ingest-ecb-balance-sheet-weekly (10:00 UTC Mon) and
-- ingest-boj-balance-sheet-weekly (10:05 UTC Mon) to ensure fresh CB data.
-- Timeout raised to 120s (vs 55s default) to cover 5 FRED API calls + TIC DB query.

SELECT public.schedule_standard_cron(
    'ingest-global-liquidity-weekly',
    '15 10 * * 1',
    'ingest-global-liquidity',
    120
);
