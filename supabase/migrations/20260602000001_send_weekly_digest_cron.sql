-- =====================================================
-- Schedule the weekly digest auto-send (plan decision D14)
-- =====================================================
-- Fires Mondays 01:00 UTC — i.e. AFTER the digest is generated (the
-- generate-weekly-regime-digest job runs Sundays 23:00 UTC), so the send always
-- picks up the freshly created edition rather than the previous week's. The
-- send-weekly-digest function detects the latest weekly_regime_digests edition,
-- emails confirmed subscribers via Resend, and records the send in digest_sends
-- so it never double-sends.
SELECT
  cron.schedule(
    'send-weekly-digest-job',
    '0 1 * * 1',
    $$
    SELECT
      net.http_post(
        url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/send-weekly-digest',
        headers:=(
          '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1) ||
          '"}'
        )::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );
