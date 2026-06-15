-- Client error reporting + health monitoring v2 (source_ref / is_provisional alignment)

SET search_path TO public, cron;

-- ─── 1. Anonymous client error log (written by report-client-error edge function) ─

CREATE TABLE IF NOT EXISTS public.client_error_reports (
  id              BIGSERIAL PRIMARY KEY,
  error_hash      TEXT NOT NULL,
  message         TEXT NOT NULL,
  stack           TEXT,
  component_stack TEXT,
  route           TEXT,
  boundary        TEXT,
  user_agent      TEXT,
  reported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_error_reports_reported_at
  ON public.client_error_reports (reported_at DESC);

COMMENT ON TABLE public.client_error_reports IS
  'Anonymous frontend error telemetry. No PII. Opt-in via VITE_ENABLE_ERROR_REPORTING.';

ALTER TABLE public.client_error_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_client_error_reports" ON public.client_error_reports;
CREATE POLICY "service_role_all_client_error_reports"
  ON public.client_error_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 2. Health views v2 — surface is_provisional + source_ref ─────────────────

DROP VIEW IF EXISTS public.vw_data_staleness_monitor_v2 CASCADE;
DROP VIEW IF EXISTS public.vw_authenticity_percentage_v2 CASCADE;

CREATE VIEW public.vw_data_staleness_monitor_v2 AS
SELECT
  metric_id,
  metric_name,
  days_since_update,
  expected_interval_days,
  frequency_type,
  provenance,
  source_ref,
  is_provisional,
  UPPER(staleness_flag) AS status
FROM public.vw_latest_metrics
WHERE metric_id IS NOT NULL;

CREATE VIEW public.vw_authenticity_percentage_v2 AS
SELECT
  ROUND(
    (COUNT(*) FILTER (WHERE COALESCE(is_provisional, false) = false)::NUMERIC
      / NULLIF(COUNT(*), 0)::NUMERIC) * 100,
    1
  ) AS authenticity_score,
  COUNT(*) FILTER (WHERE COALESCE(is_provisional, false) = false) AS live_metrics,
  COUNT(*) FILTER (WHERE COALESCE(is_provisional, false) = true)  AS provisional_metrics,
  COUNT(*) AS total_metrics
FROM public.vw_latest_metrics
WHERE value IS NOT NULL;

COMMENT ON VIEW public.vw_authenticity_percentage_v2 IS
  'Live-metric share based on is_provisional=false (Task 2.4). Complements legacy provenance=api_live view.';