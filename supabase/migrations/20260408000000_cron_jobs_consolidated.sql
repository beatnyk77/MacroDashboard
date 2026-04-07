-- =====================================================
-- MASTER CRON CONSOLIDATION MIGRATION
-- =====================================================
-- Date: 2026-04-08
-- Purpose: Centralize all cron job scheduling with idempotent, secure patterns
-- Fixes: Hardcoded secrets, duplicate schedules, missing timeouts, auth inconsistencies
-- =====================================================

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Unschedule ALL existing jobs to start fresh
-- This ensures no duplicates or conflicting schedules
DO $$
DECLARE
    job_rec RECORD;
BEGIN
    FOR job_rec IN SELECT jobid, jobname FROM cron.job LOOP
        BEGIN
            PERFORM cron.unschedule(job_rec.jobname);
            RAISE NOTICE 'Unscheduled: %', job_rec.jobname;
        EXCEPTION WHEN OTHERS THEN
            -- Job might not exist, continue
            RAISE NOTICE 'Could not unschedule %: %', job_rec.jobname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Create helper function for idempotent, secure scheduling
CREATE OR REPLACE FUNCTION public.schedule_standard_cron(
    p_job_name TEXT,
    p_schedule TEXT,
    p_function_name TEXT,
    p_timeout_seconds INTEGER DEFAULT 55
) RETURNS VOID AS $$
BEGIN
    -- First unschedule any existing job with this name (idempotency)
    -- Use exception handling in case job doesn't exist
    BEGIN
        PERFORM cron.unschedule(p_job_name);
    EXCEPTION WHEN OTHERS THEN
        -- Job doesn't exist or can't be unscheduled, continue
        RAISE NOTICE 'No existing job to unschedule (or already gone): %', p_job_name;
    END;

    -- Then schedule with secure vault-based auth
    PERFORM cron.schedule(
        p_job_name,
        p_schedule,
        format(
            'SELECT net.http_post(' ||
            'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/%s'', ' ||
            'headers := jsonb_build_object(' ||
            '''Content-Type'', ''application/json'', ' ||
            '''Authorization'', ''Bearer '' || COALESCE(' ||
            '(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1),' ||
            '(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SERVICE_ROLE_KEY'' LIMIT 1)' ||
            ')' ||
            '), ' ||
            'body := ''{}''::jsonb, ' ||
            'timeout_milliseconds := %s' ||
            ') AS request_id;',
            p_function_name,
            p_timeout_seconds * 1000
        )
    );

    RAISE NOTICE 'Scheduled: % (%s)', p_job_name, p_function_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORE DAILY INGESTION JOBS
-- =====================================================

-- Market Pulse (India & Global) - Runs after market close
SELECT public.schedule_standard_cron('ingest-market-pulse-daily', '0 1 * * *', 'ingest-market-pulse');

-- FRED Data (liquidity, yields, gold) - 6:00 AM UTC
SELECT public.schedule_standard_cron('ingest-fred-daily', '0 6 * * *', 'ingest-fred');

-- Fiscal Data (US debt to the penny) - 6:30 AM UTC
SELECT public.schedule_standard_cron('ingest-fiscaldata-daily', '30 6 * * *', 'ingest-fiscaldata');

-- NY Fed Markets (RRP, TGA, SOFR) - 12:00 UTC
SELECT public.schedule_standard_cron('ingest-nyfed-markets-daily', '0 12 * * *', 'ingest-nyfed-markets');

-- Macro News Headlines - Every 6 hours
SELECT public.schedule_standard_cron('ingest-macro-news-headlines', '0 */6 * * *', 'ingest-macro-news-headlines');

-- =====================================================
-- INDIA-SPECIFIC JOBS (Weekdays)
-- =====================================================

-- NSE Flows (FII/DII, F&O) - 13:30 UTC = 7:00 PM IST (after market close)
SELECT public.schedule_standard_cron('ingest-nse-flows-daily', '30 13 * * 1-5', 'ingest-nse-flows');

-- India Market Pulse - 14:00 UTC = 7:30 PM IST
SELECT public.schedule_standard_cron('ingest-india-market-pulse-daily', '0 14 * * 1-5', 'ingest-market-pulse');

-- India Money Market (RBI LAF) - 15:00 UTC
SELECT public.schedule_standard_cron('ingest-rbi-money-market-daily', '0 15 * * 1-5', 'ingest-rbi-money-market');

-- =====================================================
-- WEEKLY JOBS
-- =====================================================

-- ECB Balance Sheet - Monday 10:00 UTC
SELECT public.schedule_standard_cron('ingest-ecb-balance-sheet-weekly', '0 10 * * 1', 'ingest-ecb-balance-sheet');

-- BoJ Balance Sheet - Monday 10:05 UTC
SELECT public.schedule_standard_cron('ingest-boj-balance-sheet-weekly', '5 10 * * 1', 'ingest-boj-balance-sheet');

-- US Treasury Auctions - Monday 09:00 UTC
SELECT public.schedule_standard_cron('ingest-us-treasury-auctions-weekly', '0 9 * * 1', 'ingest-us-treasury-auctions');

-- Commodity Reserves & Prices - Sunday 00:00 UTC
SELECT public.schedule_standard_cron('ingest-commodity-reserves-weekly', '0 0 * * 0', 'ingest-commodity-reserves');

-- India Energy Data - Sunday 00:00 UTC
SELECT public.schedule_standard_cron('ingest-india-energy-weekly', '0 0 * * 0', 'ingest-energy');

-- Institutional Loans (13F, etc.) - Sunday 01:00 UTC
SELECT public.schedule_standard_cron('ingest-institutional-loans-weekly', '0 1 * * 0', 'ingest-institutional-loans');

-- Global Refining Imbalance - Sunday 03:00 UTC
SELECT public.schedule_standard_cron('ingest-global-refining-weekly', '0 3 * * 0', 'ingest-global-refining');

-- Global Oil Data (EIA) - Sunday 04:00 UTC
SELECT public.schedule_standard_cron('ingest-oil-eia-weekly', '0 4 * * 0', 'ingest-oil-eia');

-- Global Oil (Refining + Imports) - Sunday 05:00 UTC
SELECT public.schedule_standard_cron('ingest-oil-global-weekly', '0 5 * * 0', 'ingest-oil-global');

-- Oil India/China Costs - Sunday 06:00 UTC
SELECT public.schedule_standard_cron('ingest-oil-india-china-weekly', '0 6 * * 0', 'ingest-oil-india-china');

-- Institutional 13F Data - Sunday 03:00 UTC
SELECT public.schedule_standard_cron('ingest-institutional-13f-weekly', '0 3 * * 0', 'ingest-institutional-13f');

-- Weekly Narrative Generation - Sunday 23:30 UTC
SELECT public.schedule_standard_cron('ingest-weekly-narrative-weekly', '30 23 * * 0', 'ingest-weekly-narrative');

-- =====================================================
-- MONTHLY JOBS
-- =====================================================

-- IMF COFER (Currency Composition) - 1st of month 02:00 UTC
SELECT public.schedule_standard_cron('ingest-cofer-monthly', '0 2 1 * *', 'ingest-cofer');

-- IMF BRICS+ Data - 1st of month 03:00 UTC
SELECT public.schedule_standard_cron('ingest-imf-brics-monthly', '0 3 1 * *', 'ingest-imf-brics');

-- IMF SDR - 1st of month 08:00 UTC
SELECT public.schedule_standard_cron('ingest-imf-sdr-monthly', '0 8 1 * *', 'ingest-imf-sdr');

-- BIS REER - 15th of month 06:00 UTC
SELECT public.schedule_standard_cron('ingest-bis-reer-monthly', '0 6 15 * *', 'ingest-bis-reer');

-- IMF Current Account - 20th of month 08:00 UTC
SELECT public.schedule_standard_cron('ingest-imf-current-account-monthly', '0 8 20 * *', 'ingest-imf-current-account');

-- OECD CLI - 10th of month 09:00 UTC
SELECT public.schedule_standard_cron('ingest-oecd-cli-monthly', '0 9 10 * *', 'ingest-oecd-cli');

-- Trade Global - 15th of month 06:30 UTC
SELECT public.schedule_standard_cron('ingest-trade-global-monthly', '30 6 15 * *', 'ingest-trade-global');

-- Commodity Imports - 1st of month 07:00 UTC
SELECT public.schedule_standard_cron('ingest-commodity-imports-monthly', '0 7 1 * *', 'ingest-commodity-imports');

-- Energy Global Mix - 1st of month 02:30 UTC
SELECT public.schedule_standard_cron('ingest-energy-global-monthly', '30 2 1 * *', 'ingest-energy-global');

-- Institutional Loans - 1st of month 04:00 UTC
SELECT public.schedule_standard_cron('ingest-institutional-loans-monthly', '0 4 1 * *', 'ingest-institutional-loans');

-- US Treasury Auctions (weekly already, but monthly backup) - 5th of month 10:00 UTC
SELECT public.schedule_standard_cron('ingest-us-treasury-auctions-monthly', '0 10 5 * *', 'ingest-us-treasury-auctions');

-- US Fiscal Stress - 5th of month 10:00 UTC
SELECT public.schedule_standard_cron('ingest-us-fiscal-stress-monthly', '0 10 5 * *', 'ingest-us-fiscal-stress');

-- India Fiscal Stress - 5th of month 11:00 UTC
SELECT public.schedule_standard_cron('ingest-india-fiscal-stress-monthly', '0 11 5 * *', 'ingest-india-fiscal-stress');

-- Central Bank Gold Net - Quarterly: 1st of Jan, Apr, Jul, Oct at 02:00 UTC
SELECT public.schedule_standard_cron('ingest-cb-gold-net-quarterly', '0 2 1 1,4,7,10 *', 'ingest-cb-gold-net');

-- US Macro (consolidated) - Daily 03:00 UTC
SELECT public.schedule_standard_cron('ingest-us-macro-daily', '0 3 * * *', 'ingest-us-macro');

-- India Credit Cycle - Monthly (schedule TBD)
SELECT public.schedule_standard_cron('ingest-india-credit-cycle-monthly', '0 5 1 * *', 'ingest-india-credit-cycle');

-- India Debt Maturities - Monthly (schedule TBD)
SELECT public.schedule_standard_cron('ingest-india-debt-maturities-monthly', '0 6 1 * *', 'ingest-india-debt-maturities');

-- India Inflation - Monthly (schedule TBD)
SELECT public.schedule_standard_cron('ingest-india-inflation-monthly', '0 7 1 * *', 'ingest-india-inflation');

-- India Liquidity - Daily (after market)
SELECT public.schedule_standard_cron('ingest-india-liquidity-daily', '0 15 * * 1-5', 'ingest-india-liquidity');

-- India Digitization - Monthly
SELECT public.schedule_standard_cron('ingest-india-digitization-monthly', '0 8 1 * *', 'ingest-india-digitization');

-- India Fiscal Allocation - Monthly
SELECT public.schedule_standard_cron('ingest-india-fiscal-allocation-monthly', '0 9 1 * *', 'ingest-india-fiscal-allocation');

-- State Fiscal Health - Monthly
SELECT public.schedule_standard_cron('ingest-state-fiscal-health-monthly', '0 10 1 * *', 'ingest-state-fiscal-health');

-- =====================================================
-- GEOPOLITICAL & OSINT
-- =====================================================

-- Geopolitical OSINT - Every 6 hours
SELECT public.schedule_standard_cron('ingest-geopolitical-osint', '0 */6 * * *', 'ingest-geopolitical-osint');

-- Macro Events & Markers - Daily at 11:00 UTC
SELECT public.schedule_standard_cron('ingest-events-markers-daily', '0 11 * * *', 'ingest-events-markers');

-- =====================================================
-- METRICS & COMPUTATIONS
-- =====================================================

-- Gold History - Daily
SELECT public.schedule_standard_cron('ingest-gold-history-daily', '0 5 * * *', 'ingest-gold-history');

-- Gold Positions - Daily
SELECT public.schedule_standard_cron('ingest-gold-daily', '0 4 * * *', 'ingest-gold');

-- Gold Debt Coverage G20 - Monthly (15th)
SELECT public.schedule_standard_cron('ingest-gold-debt-coverage-monthly', '0 8 15 * *', 'ingest-gold-debt-coverage');

-- Copper Gold Ratio - Daily 15:00 UTC
SELECT public.schedule_standard_cron('ingest-copper-gold-ratio-daily', '0 15 * * *', 'ingest-copper-gold-ratio');

-- Precious Divergence - Daily 19:00 UTC
SELECT public.schedule_standard_cron('ingest-precious-divergence-daily', '0 19 * * *', 'ingest-precious-divergence');

-- Major Economies - Monthly
SELECT public.schedule_standard_cron('ingest-major-economies-monthly', '0 12 1 * *', 'ingest-major-economies');

-- G20 Sovereign Matrix - Monthly
SELECT public.schedule_standard_cron('ingest-g20-sovereign-monthly', '0 13 1 * *', 'ingest-g20-sovereign');

-- Capital Flows Radar - Monthly
SELECT public.schedule_standard_cron('ingest-capital-flows-monthly', '0 14 1 * *', 'ingest-capital-flows');

-- Currency Wars - Monthly
SELECT public.schedule_standard_cron('ingest-currency-wars-monthly', '0 16 1 * *', 'ingest-currency-wars');

-- Yield Curves - Daily
SELECT public.schedule_standard_cron('ingest-yield-curves-daily', '0 2 * * *', 'ingest-yield-curves');

-- =====================================================
-- CHINA & EAST ASIA
-- =====================================================

-- China Macro - Daily (after PBOC releases)
SELECT public.schedule_standard_cron('ingest-china-macro-daily', '0 3 * * *', 'ingest-china-macro');

-- China Energy Grid - Weekly
SELECT public.schedule_standard_cron('ingest-china-energy-weekly', '0 7 * * 0', 'ingest-china-energy');

-- China Real Economy - Monthly
SELECT public.schedule_standard_cron('ingest-china-real-economy-monthly', '0 11 1 * *', 'ingest-china-real-economy');

-- PBOC Liquidity - Daily
SELECT public.schedule_standard_cron('ingest-pboc-liquidity-daily', '0 2 * * *', 'ingest-pboc-liquidity');

-- =====================================================
-- CORPORATE & INSTITUTIONAL (CIE)
-- =====================================================

-- CIE Fundamentals - Daily after market
SELECT public.schedule_standard_cron('ingest-cie-fundamentals-daily', '0 18 * * 1-5', 'ingest-cie-fundamentals');

-- CIE Promoters - Daily
SELECT public.schedule_standard_cron('ingest-cie-promoters-daily', '0 19 * * 1-5', 'ingest-cie-promoters');

-- CIE Deals - Daily
SELECT public.schedule_standard_cron('ingest-cie-deals-daily', '0 20 * * 1-5', 'ingest-cie-deals');

-- CIE Short Selling - Daily
SELECT public.schedule_standard_cron('ingest-cie-short-selling-daily', '0 21 * * 1-5', 'ingest-cie-short-selling');

-- CIE IPOs - Daily
SELECT public.schedule_standard_cron('ingest-cie-ipos-daily', '0 22 * * 1-5', 'ingest-cie-ipos');

-- Corporate Debt Maturities - Daily
SELECT public.schedule_standard_cron('ingest-corporate-debt-maturity-daily', '0 2 * * *', 'ingest-corporate-debt-maturity');

-- =====================================================
-- HEALTH & MONITORING
-- =====================================================

-- Data Health Check - Daily 07:00 UTC
SELECT public.schedule_standard_cron('check-data-health-daily', '0 7 * * *', 'check-data-health');

-- =====================================================
-- NEWSLETTER & CONTENT
-- =====================================================

-- Generate Newsletter - 1st of month 00:30 UTC
SELECT public.schedule_standard_cron('generate-newsletter-monthly', '30 0 1 * *', 'generate-newsletter');

-- Compute CIE Macro Scores - Weekly
SELECT public.schedule_standard_cron('compute-cie-macro-scores-weekly', '0 12 * * 0', 'compute-cie-macro-scores');

-- =====================================================
-- CLEANUP: Drop helper function (optional - keep for debugging)
-- =====================================================
-- DROP FUNCTION IF EXISTS public.schedule_standard_cron(TEXT, TEXT, TEXT, INTEGER);

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify:
-- =====================================================
--
-- SELECT jobid, jobname, schedule, active
-- FROM cron.job
-- ORDER BY jobname;
--
-- SELECT COUNT(*) as total_jobs FROM cron.job WHERE active = true;
--
-- SELECT * FROM public.vw_cron_job_status
-- WHERE last_run_status = 'failed'
--    OR last_run_at < NOW() - INTERVAL '2 days';
-- =====================================================
