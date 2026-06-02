-- =====================================================
-- Subscribers — Weekly Regime Digest email capture
-- =====================================================
-- Backs the "traction instrument" (north-star metric: confirmed subscribers).
-- Double opt-in: rows land as 'pending', a confirm token flips them to 'confirmed'.
-- Security: the public (anon) client may INSERT only — it can never read, update,
-- or delete rows, so captured emails are never exposed via the anon key.
-- Token confirmation and aggregate stats are served through SECURITY DEFINER
-- functions so the raw table stays sealed.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscribers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        TEXT NOT NULL UNIQUE,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed')),
    confirm_token TEXT NOT NULL,
    source       TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscribers_status ON public.subscribers (status);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirm_token ON public.subscribers (confirm_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers (created_at DESC);

-- =====================================================
-- Row Level Security — insert-only for the public client
-- =====================================================
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- anon/authenticated may insert a new (pending) subscriber, nothing else.
-- WITH CHECK pins the inserted row to an unconfirmed state so the public client
-- can never self-promote a row to 'confirmed' — the only path to 'confirmed' is
-- the SECURITY DEFINER confirm_subscription() function below. This keeps the
-- north-star metric (confirmed count) honest.
CREATE POLICY "Allow public insert into subscribers"
  ON public.subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND confirmed_at IS NULL);

-- Service role (edge functions) has full control.
CREATE POLICY "Allow service role full access to subscribers"
  ON public.subscribers
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

COMMENT ON POLICY "Allow public insert into subscribers" ON public.subscribers IS
  'Public capture form may insert pending subscribers only; no read/update/delete from anon (emails stay sealed).';

-- =====================================================
-- confirm_subscription(token) — double opt-in confirmation
-- =====================================================
-- Flips a pending subscriber to confirmed. SECURITY DEFINER so it can update
-- the RLS-sealed table; callable by anon (the /subscribe/confirm route) but only
-- ever acts on the single row matching the supplied token.
CREATE OR REPLACE FUNCTION public.confirm_subscription(p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status TEXT;
BEGIN
    IF p_token IS NULL OR length(p_token) = 0 THEN
        RETURN 'invalid';
    END IF;

    UPDATE public.subscribers
       SET status = 'confirmed',
           confirmed_at = COALESCE(confirmed_at, timezone('utc'::text, now()))
     WHERE confirm_token = p_token
     RETURNING status INTO v_status;

    IF v_status IS NULL THEN
        RETURN 'invalid';
    END IF;

    RETURN 'confirmed';
END;
$$;

-- =====================================================
-- get_subscriber_stats() — aggregate metric for the admin widget
-- =====================================================
-- Returns counts only (never raw emails), so the AdminDashboard can render the
-- traction number, 7/30-day deltas, a daily sparkline series, and recent sources
-- without granting anon read access to the table.
CREATE OR REPLACE FUNCTION public.get_subscriber_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'confirmed_total', (SELECT count(*) FROM subscribers WHERE status = 'confirmed'),
        'pending_total',   (SELECT count(*) FROM subscribers WHERE status = 'pending'),
        'confirmed_7d',    (SELECT count(*) FROM subscribers WHERE status = 'confirmed' AND confirmed_at >= now() - interval '7 days'),
        'confirmed_30d',   (SELECT count(*) FROM subscribers WHERE status = 'confirmed' AND confirmed_at >= now() - interval '30 days'),
        'daily', (
            SELECT COALESCE(jsonb_agg(d ORDER BY d->>'day'), '[]'::jsonb)
            FROM (
                SELECT jsonb_build_object('day', day::date, 'count', count(s.id)) AS d
                FROM generate_series(
                        (now()::date - interval '11 days'),
                        now()::date,
                        interval '1 day'
                     ) AS day
                LEFT JOIN subscribers s
                       ON s.status = 'confirmed'
                      AND s.confirmed_at::date = day::date
                GROUP BY day
            ) series
        ),
        'recent_sources', (
            SELECT COALESCE(jsonb_agg(rs), '[]'::jsonb)
            FROM (
                SELECT jsonb_build_object('source', COALESCE(source, 'unknown'), 'count', count(*)) AS rs
                FROM subscribers
                WHERE status = 'confirmed'
                GROUP BY COALESCE(source, 'unknown')
                ORDER BY count(*) DESC
                LIMIT 5
            ) src
        )
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_subscription(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscriber_stats() TO anon, authenticated;

-- =====================================================
-- digest_sends — idempotency log for the weekly auto-send
-- =====================================================
-- One row per weekly edition that has been emailed, so the scheduled
-- send-weekly-digest function never double-sends the same digest.
CREATE TABLE IF NOT EXISTS public.digest_sends (
    week_ending_date DATE PRIMARY KEY,
    sent_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    recipient_count  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.digest_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to digest_sends"
  ON public.digest_sends
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);
