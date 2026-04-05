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

-- 1. Ensure the SERVICE_ROLE_KEY is in the vault for background ingestion auth.
-- IMPORTANT: To avoid permission errors (crypto_aead_det_noncegen), 
-- please add the secret manually in the Supabase Dashboard Vault:
-- NAME: 'SERVICE_ROLE_KEY'
-- SECRET: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' (use your service role key)

-- 2. Schedule the ingest-us-macro function to run daily at 03:00 UTC
-- Use the vault secret for secure authentication in pg_cron background jobs.
SELECT cron.schedule(
    'ingest-us-macro-daily',
    '0 3 * * *', -- Every day at 03:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', (SELECT 'Bearer ' || secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    );
    $$
);
