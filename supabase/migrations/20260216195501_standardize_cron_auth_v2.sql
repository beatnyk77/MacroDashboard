-- Migration to standardize cron job authentication (v2)
-- Uses cron.schedule to update existing jobs, preserving schedules

-- 1. ingest-market-pulse-daily
SELECT cron.schedule('ingest-market-pulse-daily', '0 1 * * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-market-pulse',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 2. ingest-fred-daily
SELECT cron.schedule('ingest-fred-daily', '0 6 * * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fred',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 3. ingest-fiscaldata-daily
SELECT cron.schedule('ingest-fiscaldata-daily', '30 6 * * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-fiscaldata',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 4. ingest-nyfed-markets-daily
SELECT cron.schedule('ingest-nyfed-markets-daily', '0 12 * * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nyfed-markets',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 5. ingest-macro-news-headlines
SELECT cron.schedule('ingest-macro-news-headlines', '0 */6 * * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-macro-news-headlines',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 6. ingest-ecb-weekly
SELECT cron.schedule('ingest-ecb-weekly', '0 10 * * 1', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-ecb-balance-sheet',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 7. ingest-boj-weekly
SELECT cron.schedule('ingest-boj-weekly', '5 10 * * 1', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-boj-balance-sheet',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 8. ingest-imf-sdr-monthly
SELECT cron.schedule('ingest-imf-sdr-monthly', '0 8 1 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-sdr',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 9. ingest-precious-divergence-daily
SELECT cron.schedule('ingest-precious-divergence-daily', '0 19 * * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-precious-divergence',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 10. check-data-health
SELECT cron.schedule('check-data-health', '0 7 * * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/check-data-health',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 11. ingest-copper-gold-ratio-daily
SELECT cron.schedule('ingest-copper-gold-ratio-daily', '0 15 * * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-copper-gold-ratio',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 12. ingest-bis-reer-monthly
SELECT cron.schedule('ingest-bis-reer-monthly', '0 6 15 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-bis-reer',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 13. ingest-imf-ca-monthly
SELECT cron.schedule('ingest-imf-ca-monthly', '0 8 20 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-imf-current-account',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 14. ingest-oecd-cli-monthly
SELECT cron.schedule('ingest-oecd-cli-monthly', '0 9 10 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-oecd-cli',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 15. ingest-institutional-loans-monthly
SELECT cron.schedule('ingest-institutional-loans-monthly', '0 4 1 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-institutional-loans',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 16. ingest-trade-global-monthly
SELECT cron.schedule('ingest-trade-global-monthly', '30 6 15 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-global',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 17. ingest-us-treasury-auctions-weekly
SELECT cron.schedule('ingest-us-treasury-auctions-weekly', '0 9 * * 1', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-treasury-auctions',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 18. ingest-us-fiscal-stress-monthly
SELECT cron.schedule('ingest-us-fiscal-stress-monthly', '0 10 5 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-us-fiscal-stress',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 19. ingest-india-fiscal-stress-monthly
SELECT cron.schedule('ingest-india-fiscal-stress-monthly', '0 11 5 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-india-fiscal-stress',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 20. ingest-cb-gold-net-quarterly
SELECT cron.schedule('ingest-cb-gold-net-quarterly', '0 2 1 */3 *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cb-gold-net',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 21. ingest-commodity-reserves-weekly
SELECT cron.schedule('ingest-commodity-reserves-weekly', '0 0 * * 0', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-commodity-reserves',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);

-- 22. ingest-india-market-pulse-daily
SELECT cron.schedule('ingest-india-market-pulse-daily', '0 16 * * 1-5', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nse-flows',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);
