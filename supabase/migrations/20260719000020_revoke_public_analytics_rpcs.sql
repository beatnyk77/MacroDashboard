-- ============================================================
-- Migration: revoke_public_analytics_rpcs
-- Date: 2026-07-19
-- Purpose: Advisor finding — SECURITY DEFINER RPCs callable by anon leak
--          subscriber counts / traffic intelligence. Revoke public EXECUTE.
--          Admin UI must use service_role (edge) or be re-wired later.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_traffic_intelligence_summary(integer)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_subscriber_stats()
  FROM PUBLIC, anon, authenticated;

-- Keep execute for service_role (dashboard/edge if needed)
GRANT EXECUTE ON FUNCTION public.get_traffic_intelligence_summary(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_subscriber_stats() TO service_role;

COMMENT ON FUNCTION public.get_traffic_intelligence_summary(integer) IS
  'Internal analytics aggregate. EXECUTE service_role only — revoked from anon/authenticated 2026-07-19.';

COMMENT ON FUNCTION public.get_subscriber_stats() IS
  'Internal subscriber counts. EXECUTE service_role only — revoked from anon/authenticated 2026-07-19.';
