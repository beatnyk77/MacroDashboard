-- Schedule ECB ingestion weekly
-- Note: Requires pg_cron and pg_net extensions
SELECT cron.schedule(
    'ingest-ecb-balance-sheet-weekly',
    '0 16 * * 5', -- Friday at 16:00 UTC
    $$
    SELECT
      net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.functions.supabase.co/ingest-ecb-balance-sheet',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('vault.service_role_key')
        ),
        body := '{}'
      ) as request_id;
    $$
);
