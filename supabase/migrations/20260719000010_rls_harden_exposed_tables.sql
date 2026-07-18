-- ============================================================
-- Migration: rls_harden_exposed_tables
-- Date: 2026-07-19
-- Purpose: Advisor finding — tables exposed via PostgREST with RLS off
--          (or incomplete). Enable RLS + public SELECT (where product-
--          facing) + service_role write. Internal tables get no public
--          SELECT.
--
-- Tables (protocol list):
--   Public read + service write:
--     shadow_trade_anomalies, ai_compute_energy, cie_promoter_history,
--     us_companies, cie_price_history, us_fundamentals, china_15th_fyp,
--     us_insider_trades, us_13f_holdings, us_filings, treasury_hedging_metrics
--   Service-only (no public read — ingestion internals):
--     ingestion_payload_hashes
-- ============================================================

CREATE OR REPLACE FUNCTION public._gq_ensure_table_rls(
  p_table regclass,
  p_public_read boolean DEFAULT true
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  t text := p_table::text; -- schema-qualified, e.g. public.foo
  bare text := split_part(t, '.', 2);
  pol_read text := bare || '_public_select';
  pol_write text := bare || '_service_write';
BEGIN
  IF to_regclass(t) IS NULL THEN
    RAISE NOTICE 'skip missing table %', t;
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', t);

  -- Drop legacy write-open policies if any were mis-created for public roles
  -- (keep unknown SELECT policies; we re-assert the canonical pair below)

  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', pol_read, t);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', pol_write, t);

  IF p_public_read THEN
    EXECUTE format(
      'CREATE POLICY %I ON %s FOR SELECT TO anon, authenticated USING (true)',
      pol_read, t
    );
    EXECUTE format('GRANT SELECT ON %s TO anon, authenticated', t);
  ELSE
    EXECUTE format('REVOKE ALL ON %s FROM anon, authenticated', t);
  END IF;

  EXECUTE format(
    'CREATE POLICY %I ON %s FOR ALL TO service_role USING (true) WITH CHECK (true)',
    pol_write, t
  );

  EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON %s FROM anon, authenticated', t);
  EXECUTE format('GRANT ALL ON %s TO service_role', t);
END;
$$;

SELECT public._gq_ensure_table_rls('public.shadow_trade_anomalies', true);
SELECT public._gq_ensure_table_rls('public.ai_compute_energy', true);
SELECT public._gq_ensure_table_rls('public.cie_promoter_history', true);
SELECT public._gq_ensure_table_rls('public.us_companies', true);
SELECT public._gq_ensure_table_rls('public.cie_price_history', true);
SELECT public._gq_ensure_table_rls('public.us_fundamentals', true);
SELECT public._gq_ensure_table_rls('public.china_15th_fyp', true);
SELECT public._gq_ensure_table_rls('public.us_insider_trades', true);
SELECT public._gq_ensure_table_rls('public.us_13f_holdings', true);
SELECT public._gq_ensure_table_rls('public.us_filings', true);
SELECT public._gq_ensure_table_rls('public.treasury_hedging_metrics', true);
-- Internal hash store — never public-readable
SELECT public._gq_ensure_table_rls('public.ingestion_payload_hashes', false);

DROP FUNCTION public._gq_ensure_table_rls(regclass, boolean);

COMMENT ON TABLE public.ingestion_payload_hashes IS
  'Ingestion dedupe hashes. RLS on; service_role only — no public SELECT (intentional).';
