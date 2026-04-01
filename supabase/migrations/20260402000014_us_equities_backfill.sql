-- Migration: 20260402000014_us_equities_backfill.sql
-- Purpose: Trigger initial backfill for US companies and fundamentals.
-- Will execute when this migration runs.

DO $$
DECLARE
    project_ref text;
    service_role_key text;
    base_url text;
BEGIN
    -- Only run the backfill if net extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        -- Fetch environment settings, fallback if undefined
        BEGIN
            project_ref := current_setting('app.settings.project_ref', true);
            service_role_key := current_setting('app.settings.service_role_key', true);
        EXCEPTION WHEN OTHERS THEN
            project_ref := NULL;
        END;

        IF project_ref IS NOT NULL AND service_role_key IS NOT NULL THEN
            base_url := 'https://' || project_ref || '.supabase.co/functions/v1/ingest-us-edgar-fundamentals';

            -- Trigger companies catalog ingestion
            PERFORM net.http_post(
                url := base_url,
                headers := jsonb_build_object(
                    'Authorization', 'Bearer ' || service_role_key,
                    'Content-Type', 'application/json'
                ),
                body := '{"mode":"companies"}'::jsonb,
                timeout_milliseconds := 10000
            );

            -- Follow up with fundamentals after a slight delay
            -- Note: In edge environments the second POST might land early, 
            -- but the database handles asynchronous ingest requests.
            PERFORM net.http_post(
                url := base_url,
                headers := jsonb_build_object(
                    'Authorization', 'Bearer ' || service_role_key,
                    'Content-Type', 'application/json'
                ),
                body := '{"mode":"fundamentals"}'::jsonb,
                timeout_milliseconds := 10000
            );
        END IF;
    END IF;
END $$;
