-- Fix job #22: ingest-macro-news-headlines
UPDATE cron.job
SET command = $$
    SELECT
      net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-macro-news-headlines',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
      ) as request_id;
    $$
WHERE jobid = 22;

-- Fix job #17: ingest-gfcf (wrong project ref + config)
UPDATE cron.job
SET command = $$
    SELECT
      net.http_post(
          url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-gfcf',
          headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        )
      ) as request_id;
    $$
WHERE jobid = 17;

-- Fix job #16: ingest-upi-autopay
UPDATE cron.job
SET command = $$
    SELECT
      net.http_post(
          url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-upi-autopay',
           headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        )
      ) as request_id;
    $$
WHERE jobid = 16;
