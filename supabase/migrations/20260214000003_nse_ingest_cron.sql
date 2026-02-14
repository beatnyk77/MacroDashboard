-- Schedule the NSE ingestion job to run daily at 14:00 UTC (19:30 IST)
-- NSE usually updates EOD data by 7 PM IST.

SELECT cron.schedule(
    'ingest-nse-flows-daily',
    '0 14 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://pwhmnjanfdtgqqikamsa.supabase.co/functions/v1/ingest-nse-flows',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
