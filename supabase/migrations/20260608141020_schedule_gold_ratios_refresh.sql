-- Schedule Gold Ratios Refresh
-- Date: 2026-06-09
-- Purpose: Ensure populate_gold_ratios() is called daily to refresh metric_observations
-- with current gold ratio data from vw_gold_ratios_stats

-- 1. Schedule the refresh to run daily at 7:00 AM UTC
-- This runs after ingest-gold-history (05:00 UTC) and ingest-gold (04:00 UTC)
-- The edge function refresh-gold-ratios calls the populate_gold_ratios() SQL function
SELECT public.schedule_standard_cron(
    'refresh-gold-ratios-daily',
    '0 7 * * *',
    'refresh-gold-ratios'
);

-- 2. Also run populate_gold_ratios immediately to refresh with current data
SELECT populate_gold_ratios();
