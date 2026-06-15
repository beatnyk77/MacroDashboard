-- ============================================================
-- Migration: RLS + grant hardening for 11 audit-flagged tables
-- Task 1.5 — Close the Anon-Write Path
-- Date: 2026-06-13
-- Prerequisite: docs/live-state-2026-06.md §3 (RLS/Grants Reality)
-- ============================================================
--
-- Classification (verified by grepping src/ and querying pg_policies):
--
-- FRONTEND-READ (anon SELECT required):
--   ingestion_logs        – DataHealthTicker, IntelligenceSidebar, EventsMap,
--                           DataHealthDashboard, TradeIntelligencePage
--   upcoming_events       – useMacroEvents (via vw_upcoming_events)
--   tic_foreign_holders   – useReserveSellerData (direct), useTreasuryHolders (via view)
--   gold_historical_shocks– no direct hook found; existing SELECT policy retained
--                           (treated FRONTEND-READ conservatively)
--   india_asi             – useIndiaASI, DataHealthDashboard (direct)
--   latest_metrics        – no direct frontend query; read by views:
--                           vw_sovereign_solvency, vw_data_staleness_monitor_v2,
--                           vw_authenticity_percentage_v2
--   ingestion_runs        – useIngestionHealth, useUSTreasuryAuctions, AdminDashboard
--   cie_bulk_block_deals  – BulkBlockReport.tsx  [ALREADY COMPLETE — included idempotent]
--   cie_upcoming_ipos     – UpcomingIPOs.tsx      [ALREADY COMPLETE — included idempotent]
--
-- INTERNAL-ONLY (no anon access — only edge functions via service_role):
--   comtrade_cache        – no src/ reference found; internal cache for ingest-un-comtrade
--   cusip_ticker_cache    – no src/ reference found; internal ticker-CUSIP resolver
--
-- Live RLS state going in (from §3.1):
--   RLS OFF: latest_metrics, ingestion_runs, comtrade_cache, cusip_ticker_cache
--   RLS ON (SELECT only): ingestion_logs, upcoming_events, tic_foreign_holders,
--                          gold_historical_shocks, india_asi
--   RLS ON (fully done):  cie_bulk_block_deals, cie_upcoming_ipos
-- ============================================================

-- ============================================================
-- SECTION 1: Enable RLS on the 4 tables that had it OFF
-- ============================================================

ALTER TABLE public.latest_metrics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comtrade_cache     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cusip_ticker_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 2: INTERNAL-ONLY — revoke anon grants + service_role-only policy
-- ============================================================

-- comtrade_cache: internal cache for UN Comtrade responses.
-- No frontend hook queries this table. Anon access is a data-integrity risk.
REVOKE ALL ON public.comtrade_cache FROM anon;

DROP POLICY IF EXISTS "Service role only access to comtrade_cache" ON public.comtrade_cache;
CREATE POLICY "Service role only access to comtrade_cache"
  ON public.comtrade_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- cusip_ticker_cache: internal CUSIP-to-ticker resolver cache.
-- No frontend hook queries this table.
REVOKE ALL ON public.cusip_ticker_cache FROM anon;

DROP POLICY IF EXISTS "Service role only access to cusip_ticker_cache" ON public.cusip_ticker_cache;
CREATE POLICY "Service role only access to cusip_ticker_cache"
  ON public.cusip_ticker_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SECTION 3: FRONTEND-READ tables that had RLS OFF
--            → enable RLS already done above; add both policies
-- ============================================================

-- latest_metrics: RLS was OFF — critical anon-write risk.
-- Anon SELECT needed by: vw_sovereign_solvency, vw_data_staleness_monitor_v2,
-- vw_authenticity_percentage_v2 (all SECURITY INVOKER views).
DROP POLICY IF EXISTS "Allow public read access to latest_metrics" ON public.latest_metrics;
CREATE POLICY "Allow public read access to latest_metrics"
  ON public.latest_metrics
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role write access to latest_metrics" ON public.latest_metrics;
CREATE POLICY "Service role write access to latest_metrics"
  ON public.latest_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ingestion_runs: RLS was OFF.
-- Anon SELECT needed by: useIngestionHealth, useUSTreasuryAuctions, AdminDashboard.
DROP POLICY IF EXISTS "Allow public read access to ingestion_runs" ON public.ingestion_runs;
CREATE POLICY "Allow public read access to ingestion_runs"
  ON public.ingestion_runs
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role write access to ingestion_runs" ON public.ingestion_runs;
CREATE POLICY "Service role write access to ingestion_runs"
  ON public.ingestion_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SECTION 4: FRONTEND-READ tables that had RLS ON but only SELECT policy
--            → add service_role write policy
-- ============================================================

-- ingestion_logs
-- Existing policy: "Public Read Access" (SELECT, TO public)
DROP POLICY IF EXISTS "Service role write access to ingestion_logs" ON public.ingestion_logs;
CREATE POLICY "Service role write access to ingestion_logs"
  ON public.ingestion_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- upcoming_events
-- Existing policy: "Public Read Access" (SELECT, TO public)
DROP POLICY IF EXISTS "Service role write access to upcoming_events" ON public.upcoming_events;
CREATE POLICY "Service role write access to upcoming_events"
  ON public.upcoming_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- tic_foreign_holders
-- Existing policy: "Public Read Access" (SELECT, TO public)
DROP POLICY IF EXISTS "Service role write access to tic_foreign_holders" ON public.tic_foreign_holders;
CREATE POLICY "Service role write access to tic_foreign_holders"
  ON public.tic_foreign_holders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- gold_historical_shocks
-- Existing policy: "Public Read Access" (SELECT, TO public)
-- No direct frontend hook found; retaining SELECT access conservatively.
DROP POLICY IF EXISTS "Service role write access to gold_historical_shocks" ON public.gold_historical_shocks;
CREATE POLICY "Service role write access to gold_historical_shocks"
  ON public.gold_historical_shocks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- india_asi
-- Existing policy: "Public Read Access" (SELECT, TO public)
DROP POLICY IF EXISTS "Service role write access to india_asi" ON public.india_asi;
CREATE POLICY "Service role write access to india_asi"
  ON public.india_asi
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SECTION 5: Already-complete tables — documentation only
-- ============================================================

-- cie_bulk_block_deals: RLS ON; policies present:
--   "Allow public read access to cie_bulk_block_deals" (SELECT, public)
--   "Service role write access to cie_bulk_block_deals" (ALL, service_role)
-- No action needed.

-- cie_upcoming_ipos: RLS ON; policies present:
--   "Allow public read access to cie_upcoming_ipos" (SELECT, public)
--   "Service role write access to cie_upcoming_ipos" (ALL, service_role)
-- No action needed.
