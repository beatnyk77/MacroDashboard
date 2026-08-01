-- ============================================================
-- Migration: security_hardening_pre_launch
-- Date: 2026-08-01
-- Purpose: Pre-launch security advisor cleanup
--   1. Flip remaining public telemetry views to security_invoker
--   2. Revoke anon/authenticated EXECUTE on internal RPCs
--   3. Convert get_latest_gold_ratios to SECURITY INVOKER
--   4. Drop redundant share-cards public list policy
--
-- Eng-review amendment: REVOKE uses dynamic pg_proc matching so a
-- signature mismatch (e.g. text vs uuid) cannot fail the migration.
-- confirm_subscription / manage_subscription intentionally untouched.
-- ============================================================

-- 1. Flip SECURITY DEFINER views to SECURITY INVOKER (additive to 20260719000040)
DO $$
DECLARE
    v_name text;
    v_names text[] := ARRAY[
        'vw_gold_ratios', 'vw_country_terminal', 'vw_institutional_dominance',
        'vw_smart_money_collective', 'vw_g20_sovereign', 'vw_g20_reserves_gold',
        'vw_net_liquidity', 'vw_dedollarization', 'vw_upcoming_events',
        'vw_tic_foreign_holders', 'vw_data_integrity_validation',
        'vw_gold_ratios_historical', 'vw_upi_autopay_latest',
        'vw_us_debt_gold_backing', 'vw_gold_ratios_stats',
        'vw_gold_ratios_percentiles', 'vw_gold_returns_events',
        'vw_gold_ratios_tall', 'vw_credit_creation_pulse',
        'vw_geopolitical_risk_index', 'fuel_geopolitical_daily_score',
        'vw_latest_ingestions', 'vw_data_integrity_ledger',
        'vw_sovereign_solvency', 'vw_mutual_fund_universe',
        'vw_latest_uk_traders', 'vw_latest_ingestion', 'vw_india_macro',
        'vw_brics_tracker', 'vw_frusg_net_cost_yearly',
        'vw_frusg_net_cost_concentration', 'vw_frusg_balance_sheet_summary',
        'vw_frusg_bs_line_items', 'vw_frusg_net_position_summary',
        'vw_frusg_reconciliation_summary', 'vw_frusg_cash_balance_summary',
        'vw_mts_agency_outlays_monthly', 'vw_mts_agency_outlays_rank',
        'vw_receipts_by_agency_yearly', 'vw_gfp_narrative_inputs'
    ];
BEGIN
    FOREACH v_name IN ARRAY v_names LOOP
        IF EXISTS (
            SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = v_name
        ) THEN
            BEGIN
                EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true);', v_name);
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'could not set security_invoker on %: %', v_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 2. Revoke public EXECUTE on internal maintenance / metering RPCs by name
--    (signature-agnostic; service_role is unaffected).
DO $$
DECLARE
    r record;
    target_names text[] := ARRAY[
        'increment_api_usage',
        'refresh_us_sector_summary',
        'sync_latest_metrics',
        'calculate_metric_deltas'
    ];
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS regproc
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY (target_names)
    LOOP
        BEGIN
            EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated;', r.regproc);
            RAISE NOTICE 'revoked execute on % from anon, authenticated', r.regproc;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'could not revoke %: %', r.regproc, SQLERRM;
        END;
    END LOOP;
END $$;

-- NOTE: public.confirm_subscription / public.manage_subscription left executable
-- for anon/authenticated (token-gated email confirm/unsubscribe).

-- 3. Convert the read-only gold-ratios RPC wrapper to invoker mode (defense in depth)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'get_latest_gold_ratios'
    ) THEN
        ALTER FUNCTION public.get_latest_gold_ratios() SECURITY INVOKER;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'could not alter get_latest_gold_ratios: %', SQLERRM;
END $$;

-- 4. Drop the redundant public-list policy on the share-cards storage bucket.
DROP POLICY IF EXISTS share_cards_public_read ON storage.objects;
