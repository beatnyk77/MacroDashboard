-- =====================================================
-- Mutual Fund Ingestion Cron Schedule
-- Migration: 20260410000005_mutual_fund_cron.sql
-- =====================================================

-- Schedule: Daily at 14:30 UTC (8:00 PM IST)
-- This runs after Indian markets have closed and NAVs are typically updated.
SELECT public.schedule_standard_cron(
    'ingest-mutual-funds-daily', 
    '30 14 * * *', 
    'ingest-mutual-funds',
    120 -- Increased timeout to 2 minutes given the number of schemes
);
