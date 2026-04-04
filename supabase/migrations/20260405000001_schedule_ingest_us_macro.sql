-- =====================================================
-- Migration: Schedule US Macro Ingestion
-- =====================================================
-- This sets up the daily cron job for ingest-us-macro Edge Function.
-- The function handles multiple US macro data sources including:
-- - FiscalData (debt to the penny)
-- - UST yields
-- - FRED metrics
-- - Treasury auctions
-- - Debt maturities (the key source for US Debt Maturity Wall)
--
-- Schedule: Daily at 03:00 UTC
-- =====================================================

-- Schedule the ingest-us-macro function to run daily at 03:00 UTC
SELECT cron.schedule(
    'ingest-us-macro-daily',
    '0 3 * * *', -- Every day at 03:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', current_setting('request.jwt.claim.service_role_key', true)
        ),
        body := '{}'::jsonb
    );
    $$
);
