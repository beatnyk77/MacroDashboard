-- =====================================================
-- Schedule China Macro Pulse Ingestion
-- Run monthly on the 1st at 06:00 UTC
-- =====================================================

select
  cron.schedule (
    'ingest-china-macro-monthly',
    '0 6 1 * *', -- At 06:00 on day-of-month 1
    $$
    select
      net.http_post (
        url := 'https://scwunmjwqivrdwlyfavn.supabase.co/functions/v1/ingest-china-macro',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claim.sub', true) || '"}'::jsonb
      ) as request_id;
    $$
  );
