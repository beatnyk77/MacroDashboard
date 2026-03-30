-- =====================================================
-- Schedule Yield Curve Ingest
-- =====================================================
-- Schedules the ingest-yield-curves Edge Function to run daily at 22:00 UTC
-- (after US market close). Requires FRED_API_KEY to be set in Supabase Vault.

SELECT cron.schedule(
    'ingest-yield-curves',
    '0 22 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://YOUR-PROJECT-REF.supabase.co/functions/v1/ingest-yield-curves',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
