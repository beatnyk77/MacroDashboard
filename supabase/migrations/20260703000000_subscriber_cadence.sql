-- =====================================================
-- Subscriber cadence + daily brief sends + self-serve management
-- =====================================================
-- Newsletter growth loop (roadmap F4):
--   1. cadence column — subscribers choose weekly digest, daily brief, or both.
--   2. brief_sends — idempotency log for the daily brief sender (mirrors
--      digest_sends for the weekly digest).
--   3. 'unsubscribed' status + manage_subscription() — token-based, no-auth
--      unsubscribe / cadence change from email footer links. Reuses the
--      existing confirm_token as the management token (same trust model as
--      confirm_subscription: possession of the token proves inbox ownership).
-- =====================================================

-- 1. Cadence choice. Existing rows stay 'weekly' (today's behaviour).
ALTER TABLE public.subscribers
    ADD COLUMN IF NOT EXISTS cadence TEXT NOT NULL DEFAULT 'weekly'
    CHECK (cadence IN ('weekly', 'daily', 'both'));

-- 2. Allow an 'unsubscribed' terminal state. Senders filter status='confirmed',
--    so unsubscribed rows drop out of every list automatically while keeping
--    the audit trail (no row deletion).
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_status_check;
ALTER TABLE public.subscribers
    ADD CONSTRAINT subscribers_status_check
    CHECK (status IN ('pending', 'confirmed', 'unsubscribed'));

-- 3. Idempotency log for send-daily-brief — one row per brief date emailed.
CREATE TABLE IF NOT EXISTS public.brief_sends (
    brief_date       DATE PRIMARY KEY,
    sent_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    recipient_count  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.brief_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access to brief_sends" ON public.brief_sends;
CREATE POLICY "Allow service role full access to brief_sends"
  ON public.brief_sends
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- 4. manage_subscription(token, action) — self-serve from email footers.
--    SECURITY DEFINER so it can update the RLS-sealed subscribers table;
--    only ever acts on the single row matching the supplied token.
--    Actions: 'unsubscribe' | 'cadence_weekly' | 'cadence_daily' | 'cadence_both'
CREATE OR REPLACE FUNCTION public.manage_subscription(p_token TEXT, p_action TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_token IS NULL OR length(p_token) = 0 THEN
        RETURN 'invalid';
    END IF;

    IF p_action = 'unsubscribe' THEN
        UPDATE public.subscribers
           SET status = 'unsubscribed'
         WHERE confirm_token = p_token
           AND status <> 'unsubscribed'
         RETURNING id INTO v_id;
        IF v_id IS NULL THEN RETURN 'invalid'; END IF;
        RETURN 'unsubscribed';
    ELSIF p_action IN ('cadence_weekly', 'cadence_daily', 'cadence_both') THEN
        UPDATE public.subscribers
           SET cadence = replace(p_action, 'cadence_', ''),
               -- Re-activate a previously unsubscribed reader who explicitly
               -- picks a cadence again (still required their token).
               status = CASE WHEN status = 'unsubscribed' THEN 'confirmed' ELSE status END
         WHERE confirm_token = p_token
         RETURNING id INTO v_id;
        IF v_id IS NULL THEN RETURN 'invalid'; END IF;
        RETURN replace(p_action, 'cadence_', '');
    END IF;

    RETURN 'invalid';
END;
$$;

GRANT EXECUTE ON FUNCTION public.manage_subscription(TEXT, TEXT) TO anon, authenticated;
