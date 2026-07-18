-- ============================================================
-- Migration: consolidate_duplicate_rls_policies
-- Date: 2026-07-19
-- Purpose: Advisor finding — tables with 2+ redundant policies under
--          different names. Normalize to one SELECT (anon/auth) + one
--          service_role ALL per table when the table exists.
-- ============================================================

CREATE OR REPLACE FUNCTION public._gq_normalize_rls(p_table regclass)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  t text := p_table::text;
  bare text := split_part(t, '.', 2);
  r record;
  pol_read text := bare || '_select_public';
  pol_write text := bare || '_write_service';
BEGIN
  IF to_regclass(t) IS NULL THEN
    RAISE NOTICE 'skip missing table %', t;
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);

  -- Drop ALL existing policies on the table (we re-create the canonical pair)
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = split_part(t, '.', 1)
      AND tablename = bare
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', r.policyname, t);
  END LOOP;

  EXECUTE format(
    'CREATE POLICY %I ON %s FOR SELECT TO anon, authenticated USING (true)',
    pol_read, t
  );
  EXECUTE format(
    'CREATE POLICY %I ON %s FOR ALL TO service_role USING (true) WITH CHECK (true)',
    pol_write, t
  );

  EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON %s FROM anon, authenticated', t);
  EXECUTE format('GRANT SELECT ON %s TO anon, authenticated', t);
  EXECUTE format('GRANT ALL ON %s TO service_role', t);
END;
$$;

SELECT public._gq_normalize_rls('public.cb_gold_net');
SELECT public._gq_normalize_rls('public.climate_risk_metrics');
SELECT public._gq_normalize_rls('public.corporate_debt_maturities');
SELECT public._gq_normalize_rls('public.fomc_minutes_analysis');
SELECT public._gq_normalize_rls('public.global_refining_capacity');
SELECT public._gq_normalize_rls('public.institutional_13f_holdings');
SELECT public._gq_normalize_rls('public.institutional_trades_inferred');
SELECT public._gq_normalize_rls('public.monthly_regime_digests');
SELECT public._gq_normalize_rls('public.trade_gravity');
SELECT public._gq_normalize_rls('public.upi_autopay_metrics');
SELECT public._gq_normalize_rls('public.us_debt_maturities');

DROP FUNCTION public._gq_normalize_rls(regclass);
