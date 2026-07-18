-- ============================================================
-- Migration: security_invoker_public_views
-- Date: 2026-07-19
-- Purpose: Advisor finding — many views are SECURITY DEFINER (default on
--          older Postgres / recreate paths). For public telemetry views that
--          only read already-public tables, prefer SECURITY INVOKER so the
--          caller's RLS applies.
--
-- Intentional DEFINER left alone (functions, not views, or elevated needs):
--   - refresh / materialize helpers (SECURITY DEFINER functions)
--   - subscriber cadence helpers (documented intentional DEFINER)
--
-- Uses Postgres 15+ view option security_invoker.
-- ============================================================

DO $$
DECLARE
  v text;
  views text[] := ARRAY[
    'public.vw_latest_metrics',
    'public.vw_data_staleness_monitor',
    'public.vw_data_staleness_monitor_v2',
    'public.vw_authenticity_percentage',
    'public.vw_authenticity_percentage_v2',
    'public.vw_latest_daily_signal',
    'public.vw_cron_job_status',
    'public.vw_country_trade_imports',
    'public.vw_offshore_dollar_stress',
    'public.vw_regional_refining_imbalance',
    'public.vw_fx_monthly_cross_rates',
    'public.view_india_china_comparison',
    'public.fuel_geopolitical_aggregated_score'
  ];
BEGIN
  FOREACH v IN ARRAY views LOOP
    IF to_regclass(v) IS NULL THEN
      RAISE NOTICE 'skip missing view %', v;
      CONTINUE;
    END IF;
    BEGIN
      EXECUTE format('ALTER VIEW %s SET (security_invoker = true)', v);
      RAISE NOTICE 'set security_invoker on %', v;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'could not alter %: %', v, SQLERRM;
    END;
  END LOOP;
END $$;
