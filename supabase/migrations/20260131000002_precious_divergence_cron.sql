-- =====================================================
-- Schedule Precious Metals Divergence Ingestion
-- Run daily at 01:00 UTC
-- =====================================================

select
  cron.schedule (
    'ingest-precious-divergence-daily',
    '0 1 * * *', -- At 01:00 daily
    $$
    select
      net.http_post (
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-precious-divergence',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('vault.anon_key', true) || '"}'::jsonb
      ) as request_id;
    $$
  );
