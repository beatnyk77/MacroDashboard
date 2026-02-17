-- Migration: Schedule Delta Calculations
-- Purpose: Ensures delta_wow and delta_mom are populated daily

-- 1. Create a cron job to run calculate_metric_deltas() every day at midnight GMT
select cron.schedule(
    'calculate-metric-deltas-daily', -- name of the cron job
    '0 0 * * *',                     -- every day at midnight (00:00)
    $$
    select public.calculate_metric_deltas();
    $$
);
