-- ============================================================
-- Migration: daily_macro_briefs_service_write_only
-- Date: 2026-07-19
-- Purpose: Close public write path on daily_macro_briefs.
--
-- Advisor finding (live): INSERT/UPDATE policies with WITH CHECK (true)
-- for anon/authenticated/service_role allowed anyone with the public
-- anon key to poison morning briefs.
--
-- Intentional model:
--   - anon + authenticated: SELECT only (frontend useMacroBrief)
--   - service_role: full access via edge functions (bypasses RLS;
--     explicit ALL policy kept as defense-in-depth documentation)
-- ============================================================

ALTER TABLE public.daily_macro_briefs ENABLE ROW LEVEL SECURITY;

-- Drop every non-SELECT policy (covers duplicate/legacy names from live DB)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_macro_briefs'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.daily_macro_briefs',
      pol.policyname
    );
  END LOOP;
END $$;

-- Public read (needed for client-side brief fetch)
DROP POLICY IF EXISTS "daily_macro_briefs_select" ON public.daily_macro_briefs;
CREATE POLICY "daily_macro_briefs_select"
  ON public.daily_macro_briefs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Explicit service_role write policy (service_role already bypasses RLS;
-- this documents intentional write access for generate-morning-brief).
DROP POLICY IF EXISTS "daily_macro_briefs_service_write" ON public.daily_macro_briefs;
CREATE POLICY "daily_macro_briefs_service_write"
  ON public.daily_macro_briefs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Table-level grants: deny DML for public roles even if a policy is mis-added later
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.daily_macro_briefs FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.daily_macro_briefs FROM anon, authenticated;
GRANT SELECT ON public.daily_macro_briefs TO anon, authenticated;
GRANT ALL ON public.daily_macro_briefs TO service_role;

COMMENT ON TABLE public.daily_macro_briefs IS
  'Pre-generated daily macro briefs. Public SELECT only. Writes only via service_role (generate-morning-brief edge function).';
