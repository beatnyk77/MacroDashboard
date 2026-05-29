-- 20260530000001_restore_missing_crons.sql

-- Restoring ingestion jobs that were wiped during the bulk cron migration
-- and addressing publication date variability by polling more frequently.
-- As per review, heavy jobs are polled weekly to save cost/API limits, 
-- while lightweight FRED/MoSPI jobs are polled daily.

BEGIN;

-- 1. ingest-gfcf (Lightweight FRED requests) -> Daily
SELECT public.schedule_standard_cron(
    'ingest-gfcf',
    '30 5 * * *',
    'ingest-gfcf'
);

-- 2. ingest-mospi (Lightweight API) -> Daily
SELECT public.schedule_standard_cron(
    'ingest-mospi',
    '0 7 * * *',
    'ingest-mospi'
);

-- 3. ingest-tic-foreign-holders (Monthly file, but we check weekly to catch exact pub date)
SELECT public.schedule_standard_cron(
    'ingest-tic-foreign-holders',
    '0 10 * * 0',
    'ingest-tic-foreign-holders'
);

-- 4. ingest-imf (Heavy G20 data) -> Weekly on Sundays
SELECT public.schedule_standard_cron(
    'ingest-imf',
    '0 8 * * 0',
    'ingest-imf'
);

-- 5. ingest-commodity-terminal (Heavy COMTRADE data) -> Weekly on Sundays
SELECT public.schedule_standard_cron(
    'ingest-commodity-terminal',
    '30 8 * * 0', -- offset 30m from IMF to prevent spike
    'ingest-commodity-terminal'
);

COMMIT;
