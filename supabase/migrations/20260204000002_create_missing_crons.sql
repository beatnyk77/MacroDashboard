-- Daily: NY Fed Markets (RRP, TGA, SOFR-EFFR) - 12:00 PM UTC
SELECT cron.schedule(
    'ingest-nyfed-markets-daily',
    '0 12 * * *',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nyfed-markets',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);

-- Weekly: ECB Balance Sheet - Every Monday 10:00 AM UTC
SELECT cron.schedule(
    'ingest-ecb-balance-sheet-weekly',
    '0 10 * * 1',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-ecb-balance-sheet',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);

-- Weekly: BoJ Balance Sheet - Every Monday 10:00 AM UTC
SELECT cron.schedule(
    'ingest-boj-balance-sheet-weekly',
    '0 10 * * 1',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-boj-balance-sheet',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);

-- Monthly: IMF SDR (1st of month, 8 AM UTC)
SELECT cron.schedule(
    'ingest-imf-sdr-monthly',
    '0 8 1 * *',
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-sdr',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);
