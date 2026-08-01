-- supabase/migrations/20260801130000_revoke_public_grant_dangerous_rpcs.sql
--
-- Follow-up to 20260801120000_security_hardening_pre_launch.sql: that
-- migration ran `REVOKE EXECUTE ... FROM anon, authenticated` on four
-- internal maintenance/metering RPCs, but Postgres grants EXECUTE to the
-- PUBLIC pseudo-role by default on function creation, and anon/authenticated
-- inherit through PUBLIC regardless of a role-specific revoke. Verified via
-- has_function_privilege('anon', ..., 'EXECUTE') that all four were still
-- executable by anon/authenticated after the prior migration. This migration
-- revokes from PUBLIC directly and grants back only to service_role, which
-- is how these are actually invoked (scheduled jobs / server-side code).

REVOKE EXECUTE ON FUNCTION public.increment_api_usage(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_us_sector_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_latest_metrics() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_metric_deltas() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_api_usage(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_us_sector_summary() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_latest_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_metric_deltas() TO service_role;

-- NOTE: public.confirm_subscription(text) and public.manage_subscription(text, text)
-- are intentionally left untouched — both are token-gated and back the public
-- email confirmation/unsubscribe links, which must remain anon-executable.
