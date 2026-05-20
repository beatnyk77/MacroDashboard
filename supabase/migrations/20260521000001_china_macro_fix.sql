-- ============================================================
-- Fix: ingest-china-macro cron
-- Ensure it runs daily at 03:00 UTC using secure vault auth
-- and add missing metric definitions for CN_FX_RESERVES
-- ============================================================

-- Add missing China metrics
INSERT INTO public.metrics (id, name, description, category, native_frequency, display_frequency, expected_interval_days, is_active, metadata)
VALUES 
  ('CN_FX_RESERVES', 'China FX Reserves (USD Millions)', 'China total foreign exchange reserves in USD millions. Source: SAFE via FRED (TRESEGCNM052N).', 'china', 'monthly', 'monthly', 30, true, '{"fred_id": "TRESEGCNM052N"}'::jsonb),
  ('CN_FX_RESERVES_TN', 'China FX Reserves (USD Trillions)', 'China total foreign exchange reserves in USD trillions. Derived from SAFE via FRED (TRESEGCNM052N).', 'china', 'monthly', 'monthly', 30, true, '{"fred_id": "TRESEGCNM052N"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Reschedule cron with secure vault auth
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-china-macro-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
    'ingest-china-macro-daily',
    '0 3 * * *',  -- 03:00 UTC daily (09:30 CST = after NBS morning releases)
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-china-macro',
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
