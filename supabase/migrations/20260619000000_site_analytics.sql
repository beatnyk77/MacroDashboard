-- Lightweight first-party analytics for admin traffic intelligence (GA4-style aggregates).
-- Raw events: insert-only from client beacon. Reads via SECURITY DEFINER RPC only.

CREATE TABLE IF NOT EXISTS public.site_analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    event_name text NOT NULL,
    page_path text,
    value_numeric numeric,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_analytics_events_created_at
    ON public.site_analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_analytics_events_event_created
    ON public.site_analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_analytics_events_session_created
    ON public.site_analytics_events (session_id, created_at DESC);

ALTER TABLE public.site_analytics_events ENABLE ROW LEVEL SECURITY;

-- Client beacon: insert only (no raw event reads for anon)
DROP POLICY IF EXISTS "Allow anon insert site_analytics_events" ON public.site_analytics_events;
CREATE POLICY "Allow anon insert site_analytics_events"
    ON public.site_analytics_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role full access site_analytics_events" ON public.site_analytics_events;
CREATE POLICY "Allow service role full access site_analytics_events"
    ON public.site_analytics_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Aggregate RPC for admin dashboard (matches get_subscriber_stats pattern)
CREATE OR REPLACE FUNCTION public.get_traffic_intelligence_summary(p_days integer DEFAULT 28)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_days integer := GREATEST(7, LEAST(COALESCE(p_days, 28), 90));
    v_result jsonb;
    v_gsc_last date;
BEGIN
    SELECT max(date) INTO v_gsc_last FROM gsc_performance;

    SELECT jsonb_build_object(
        'period_days', v_days,
        'generated_at', now(),
        'gsc_connected', v_gsc_last IS NOT NULL,
        'gsc_last_date', v_gsc_last,
        'active_users_7d', (
            SELECT count(DISTINCT session_id)
            FROM site_analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= now() - interval '7 days'
        ),
        'active_users_28d', (
            SELECT count(DISTINCT session_id)
            FROM site_analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= now() - make_interval(days => v_days)
        ),
        'page_views_7d', (
            SELECT count(*)
            FROM site_analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= now() - interval '7 days'
        ),
        'page_views_28d', (
            SELECT count(*)
            FROM site_analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= now() - make_interval(days => v_days)
        ),
        'avg_engagement_seconds_7d', (
            SELECT round(avg(value_numeric)::numeric, 1)
            FROM site_analytics_events
            WHERE event_name = 'time_on_page'
              AND created_at >= now() - interval '7 days'
              AND value_numeric IS NOT NULL
        ),
        'top_pages', (
            SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.views DESC), '[]'::jsonb)
            FROM (
                SELECT
                    page_path AS path,
                    count(*) AS views
                FROM site_analytics_events
                WHERE event_name = 'page_view'
                  AND created_at >= now() - make_interval(days => v_days)
                  AND page_path IS NOT NULL
                GROUP BY page_path
                ORDER BY count(*) DESC
                LIMIT 12
            ) t
        ),
        'entry_pages', (
            SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.entries DESC), '[]'::jsonb)
            FROM (
                SELECT entry_page AS path, count(*) AS entries
                FROM (
                    SELECT
                        session_id,
                        (array_agg(page_path ORDER BY created_at ASC))[1] AS entry_page
                    FROM site_analytics_events
                    WHERE event_name = 'page_view'
                      AND created_at >= now() - make_interval(days => v_days)
                      AND page_path IS NOT NULL
                    GROUP BY session_id
                ) s
                GROUP BY entry_page
                ORDER BY count(*) DESC
                LIMIT 8
            ) t
        ),
        'exit_pages', (
            SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.exits DESC), '[]'::jsonb)
            FROM (
                SELECT exit_page AS path, count(*) AS exits
                FROM (
                    SELECT
                        session_id,
                        (array_agg(page_path ORDER BY created_at DESC))[1] AS exit_page
                    FROM site_analytics_events
                    WHERE event_name = 'page_view'
                      AND created_at >= now() - make_interval(days => v_days)
                      AND page_path IS NOT NULL
                    GROUP BY session_id
                ) s
                GROUP BY exit_page
                ORDER BY count(*) DESC
                LIMIT 8
            ) t
        ),
        'engagement_trend', (
            SELECT COALESCE(jsonb_agg(d ORDER BY d->>'day'), '[]'::jsonb)
            FROM (
                SELECT jsonb_build_object(
                    'day', day::date,
                    'avg_seconds', (
                        SELECT round(avg(value_numeric)::numeric, 1)
                        FROM site_analytics_events e
                        WHERE e.event_name = 'time_on_page'
                          AND e.created_at::date = day::date
                          AND e.value_numeric IS NOT NULL
                    ),
                    'sessions', (
                        SELECT count(DISTINCT session_id)
                        FROM site_analytics_events e
                        WHERE e.event_name = 'page_view'
                          AND e.created_at::date = day::date
                    )
                ) AS d
                FROM generate_series(
                    (now()::date - make_interval(days => v_days - 1)),
                    now()::date,
                    interval '1 day'
                ) AS day
            ) series
        ),
        'gsc_organic', jsonb_build_object(
            'impressions_7d', COALESCE((
                SELECT sum(impressions)
                FROM gsc_performance
                WHERE date >= (CURRENT_DATE - interval '7 days')
            ), 0),
            'clicks_7d', COALESCE((
                SELECT sum(clicks)
                FROM gsc_performance
                WHERE date >= (CURRENT_DATE - interval '7 days')
            ), 0),
            'impressions_28d', COALESCE((
                SELECT sum(impressions)
                FROM gsc_performance
                WHERE date >= (CURRENT_DATE - make_interval(days => v_days))
            ), 0),
            'clicks_28d', COALESCE((
                SELECT sum(clicks)
                FROM gsc_performance
                WHERE date >= (CURRENT_DATE - make_interval(days => v_days))
            ), 0),
            'ctr_7d', COALESCE((
                SELECT CASE WHEN sum(impressions) > 0
                    THEN round((sum(clicks)::numeric / sum(impressions)::numeric) * 100, 2)
                    ELSE 0 END
                FROM gsc_performance
                WHERE date >= (CURRENT_DATE - interval '7 days')
            ), 0),
            'trend', (
                SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.date), '[]'::jsonb)
                FROM (
                    SELECT
                        date,
                        sum(impressions) AS impressions,
                        sum(clicks) AS clicks
                    FROM gsc_performance
                    WHERE date >= (CURRENT_DATE - make_interval(days => v_days))
                    GROUP BY date
                    ORDER BY date
                ) t
            )
        ),
        'top_countries', (
            SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.impressions DESC), '[]'::jsonb)
            FROM (
                SELECT
                    COALESCE(country, 'unknown') AS country,
                    sum(impressions) AS impressions,
                    sum(clicks) AS clicks
                FROM gsc_performance
                WHERE date >= (CURRENT_DATE - make_interval(days => v_days))
                GROUP BY COALESCE(country, 'unknown')
                ORDER BY sum(impressions) DESC
                LIMIT 10
            ) t
        ),
        'top_gsc_pages', (
            SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.clicks DESC), '[]'::jsonb)
            FROM (
                SELECT
                    page,
                    sum(impressions) AS impressions,
                    sum(clicks) AS clicks
                FROM gsc_performance
                WHERE date >= (CURRENT_DATE - make_interval(days => v_days))
                GROUP BY page
                ORDER BY sum(clicks) DESC
                LIMIT 10
            ) t
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_traffic_intelligence_summary(integer) TO anon, authenticated;