-- =====================================================
-- ASI Data Ingestion Cron Job
-- =====================================================
-- Schedule: Annual refresh on August 1st at 3 AM
-- (ASI data typically released in July/August)

SELECT cron.schedule(
    'ingest-asi-annual',
    '0 3 1 8 *', -- 3 AM on August 1st every year
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/ingest-asi',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        )
    ) AS request_id;
    $$
);

COMMENT ON EXTENSION pg_cron IS 'ASI annual data refresh scheduled for August 1st';
