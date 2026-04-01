-- ============================================================
-- CIE Initial Backfill: One-off trigger for fundamentals and macro scores
-- Migration: 20260402000012_cie_backfill_initial.sql
-- 
-- Manually triggers the CIE pipeline to populate the tables 
-- immediately after the schema and cron setup is complete.
-- ============================================================

DO $$
BEGIN
    -- 1. Trigger Fundamentals Ingestion (Backfill)
    PERFORM net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cie-fundamentals',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
    );
    
    RAISE NOTICE 'Fundamentals ingestion backfill triggered.';

    -- 2. Trigger Macro Score Computation (Backfill)
    -- This follows fundamentals, but will run in parallel unless we wait
    -- However, the compute function usually checks for latest fundamentals
    PERFORM net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/compute-cie-macro-scores',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
    );

    RAISE NOTICE 'Macro scores computation backfill triggered.';
END $$;
