SELECT cron.schedule(
    'ingest-energy-monthly',
    '0 2 1 * *', -- 2 AM on 1st of every month
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/ingest-energy',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        )
    ) AS request_id;
    $$
);
