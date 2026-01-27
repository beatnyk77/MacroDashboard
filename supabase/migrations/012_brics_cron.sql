-- =====================================================
-- Cron Schedule for BRICS Ingestion
-- =====================================================
-- Adds monthly cron job for IMF BRICS+ data ingestion
-- Runs on 1st of every month at 03:00 UTC
-- =====================================================

-- Note: Replace [PROJECT_REF] and [SERVICE_ROLE_KEY] with actual values
-- In Supabase dashboard, this can be automated via Vault secrets.

SELECT cron.schedule(
    'ingest-imf-brics-monthly',
    '0 3 1 * *',
    $$
    SELECT
      net.http_post(
          url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-brics',
          headers:=(
            '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
            (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1) || 
            '"}'
          )::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
