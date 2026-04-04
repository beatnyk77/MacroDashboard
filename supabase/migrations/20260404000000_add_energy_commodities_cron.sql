-- =====================================================
-- Migration: Add Missing Cron Jobs for Energy & Commodities
-- Created: 2026-04-04
-- =====================================================
-- Adds scheduled ingestion for critical energy/commodities data pipelines
-- that were missing from the cron configuration.
--
-- Uses vault.decrypted_secrets for service_role authentication (permanent fix)
-- Timeout: 55 seconds to handle slower API responses
-- =====================================================

CREATE OR REPLACE FUNCTION public.schedule_standard_cron(
    p_job_name TEXT,
    p_schedule TEXT,
    p_function_name TEXT
) RETURNS VOID AS $$
BEGIN
    PERFORM cron.schedule(
        p_job_name,
        p_schedule,
        format(
            'SELECT net.http_post(' ||
            'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/%s'', ' ||
            'headers := jsonb_build_object(' ||
            '''Content-Type'', ''application/json'', ' ||
            '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1)' ||
            '), ' ||
            'body := ''{}''::jsonb, ' ||
            'timeout_milliseconds := 55000' ||
            ') AS request_id;',
            p_function_name
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Schedule Oil & Refining Ingestion Jobs

-- Weekly: US Oil Data (SPR, Utilization) via EIA
SELECT public.schedule_standard_cron('ingest-oil-eia-weekly', '0 3 * * 0', 'ingest-oil-eia');

-- Weekly: Global Oil (Refining Capacity + Imports) via EIA
SELECT public.schedule_standard_cron('ingest-oil-global-weekly', '0 4 * * 0', 'ingest-oil-global');

-- Weekly: India/China Oil Import Costs (Brent + FX) via EIA + FRED
SELECT public.schedule_standard_cron('ingest-oil-india-china-weekly', '0 5 * * 0', 'ingest-oil-india-china');

-- Monthly: Global Energy Mix (Ember + GIE) — 1st of month at 02:30 UTC
SELECT public.schedule_standard_cron('ingest-energy-global-monthly', '30 2 1 * *', 'ingest-energy-global');

-- Monthly: Commodity Imports (Gold, Silver, REM) via UN Comtrade
SELECT public.schedule_standard_cron('ingest-commodity-imports-monthly', '0 7 1 * *', 'ingest-commodity-imports');

-- Weekly: Commodity Terminal (Prices, Reserves, Flows)
SELECT public.schedule_standard_cron('ingest-commodity-terminal-weekly', '0 8 * * 0', 'ingest-commodity-terminal');

-- 3. Cleanup: Drop the helper function (optional)
-- DROP FUNCTION IF EXISTS public.schedule_standard_cron(TEXT, TEXT, TEXT);

-- =====================================================
-- Verification Queries (run after migration)
-- =====================================================
-- SELECT * FROM cron.job WHERE command LIKE '%ingest-oil-%' OR command LIKE '%ingest-energy-global%' OR command LIKE '%ingest-commodity-%' ORDER BY jobname;
-- =====================================================
