-- ============================================================
-- Fix: oil_market_spread — add missing computed_at column
--      and register a correct daily cron using vault auth
-- Date: 2026-05-19
-- ============================================================

-- 1. Add the missing computed_at column (edge function writes it but it never existed in the schema)
ALTER TABLE public.oil_market_spread
    ADD COLUMN IF NOT EXISTS computed_at timestamptz DEFAULT now();

-- Update any existing rows that have null computed_at so staleness checks work
UPDATE public.oil_market_spread
    SET computed_at = created_at
    WHERE computed_at IS NULL;

-- 2. Remove any leftover broken cron (uses old app_config pattern)
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-oil-spread');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No existing ingest-oil-spread cron to remove';
END $$;

-- 3. Register daily cron using the same secure vault-based pattern as all other jobs
SELECT cron.schedule(
    'ingest-oil-spread-daily',
    '0 5 * * 1-5',  -- 05:00 UTC Monday–Friday (oil markets closed weekends)
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-oil-spread',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
            )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
    ) AS request_id;
    $$
);
