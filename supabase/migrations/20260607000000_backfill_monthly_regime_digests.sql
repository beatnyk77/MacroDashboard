-- Backfill monthly regime digests that failed to generate
-- The edge function previously only supported AIMLAPI_KEY (paid); it now supports
-- OPENROUTER_API_KEY (free). This migration fires the function for missing months.

-- May 2026 (cron ran on 2026-05-01 but failed; backfilling now)
SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-monthly-regime-digest',
    headers := (
        '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1) ||
        '"}'
    )::jsonb,
    body := '{"year_month": "2026-05"}'::jsonb
) AS may_backfill;

-- June 2026 (cron ran on 2026-06-01 but failed; backfilling now)
SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-monthly-regime-digest',
    headers := (
        '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1) ||
        '"}'
    )::jsonb,
    body := '{"year_month": "2026-06"}'::jsonb
) AS jun_backfill;
