-- Split ingest-us-macro-daily into four separate crons to avoid WORKER_RESOURCE_LIMIT timeouts
-- They will be spaced out slightly.

-- 1. Remove the old bundled cron
SELECT cron.unschedule('ingest-us-macro-daily');

-- 2. Create independent crons for each task, spaced out by 5-10 minutes
-- Run at 02:00, 02:10, 02:20, 02:30 UTC

SELECT cron.schedule(
  'ingest-us-macro-fiscal-daily',
  '0 2 * * *',
  $$
    select net.http_post(
      url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro?task=fiscal',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      timeout_milliseconds:=300000
    );
  $$
);

SELECT cron.schedule(
  'ingest-us-macro-ust-daily',
  '10 2 * * *',
  $$
    select net.http_post(
      url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro?task=ust',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      timeout_milliseconds:=300000
    );
  $$
);

SELECT cron.schedule(
  'ingest-us-macro-fred-daily',
  '20 2 * * *',
  $$
    select net.http_post(
      url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro?task=fred',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      timeout_milliseconds:=600000 
    );
  $$
);

SELECT cron.schedule(
  'ingest-us-macro-auctions-daily',
  '30 2 * * *',
  $$
    select net.http_post(
      url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-macro?task=auctions',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      timeout_milliseconds:=300000
    );
  $$
);
