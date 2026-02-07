-- Schedule the MoSPI ingestion job to run daily at 07:00 UTC (12:30 IST)
-- MoSPI often updates around noon IST.

SELECT cron.schedule(
    'ingest-mospi-daily',
    '0 7 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://pwhmnjanfdtgqqikamsa.supabase.co/functions/v1/ingest-mospi',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
