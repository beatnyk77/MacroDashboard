-- Setup pg_cron for the corporate debt maturity edge function
SELECT cron.schedule(
    'corporate-debt-maturity-ingest',
    '0 2 * * *', -- Everyday at 02:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-corporate-debt-maturity',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', current_setting('request.jwt.claim.service_role_key', true)
        )
    );
    $$
);
