SELECT cron.schedule(
    'ingest-global-refining-monthly',
    '0 2 1 * *', -- Run at 2 AM on the 1st of every month
    $$
    select net.http_post(
        url:='http://kong:8000/functions/v1/ingest-global-refining',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || (select current_setting('app.settings.service_role_key', true)) || '"}'::jsonb,
        body:='{}'::jsonb
    );
    $$
);
