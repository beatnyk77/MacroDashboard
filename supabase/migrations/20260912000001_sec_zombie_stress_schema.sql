-- 20260912000001_sec_zombie_stress_schema.sql
-- Create aggregate summary view for SEC Zombie & Rollover Stress Desk

DROP VIEW IF EXISTS public.vw_corporate_zombie_stress_summary CASCADE;

CREATE OR REPLACE VIEW public.vw_corporate_zombie_stress_summary AS
WITH active_issuers AS (
  SELECT id, cik, ticker, issuer_name, sector
  FROM public.sec_corporate_issuers
  WHERE is_active = true
),
latest_zombie_signals AS (
  SELECT DISTINCT ON (issuer_id, signal_id)
    issuer_id,
    signal_id,
    numeric_value,
    unit,
    calculation_inputs,
    observed_at
  FROM public.sec_corporate_signals
  WHERE signal_id IN ('interest_coverage_ratio', 'pro_forma_refi_icr', 'zombie_tier', 'cash_runway_quarters')
  ORDER BY issuer_id, signal_id, observed_at DESC, created_at DESC
),
issuer_metrics AS (
  SELECT
    ai.id AS issuer_id,
    ai.ticker,
    ai.sector,
    icr.numeric_value AS current_icr,
    refi.numeric_value AS pro_forma_icr,
    tier.unit AS zombie_tier,
    runway.numeric_value AS cash_runway,
    COALESCE((refi.calculation_inputs->>'totalDebt')::numeric, (icr.calculation_inputs->>'totalDebt')::numeric, 0) AS total_debt,
    GREATEST(icr.observed_at, refi.observed_at, tier.observed_at) AS latest_observed_at
  FROM active_issuers ai
  LEFT JOIN latest_zombie_signals icr
    ON icr.issuer_id = ai.id AND icr.signal_id = 'interest_coverage_ratio'
  LEFT JOIN latest_zombie_signals refi
    ON refi.issuer_id = ai.id AND refi.signal_id = 'pro_forma_refi_icr'
  LEFT JOIN latest_zombie_signals tier
    ON tier.issuer_id = ai.id AND tier.signal_id = 'zombie_tier'
  LEFT JOIN latest_zombie_signals runway
    ON runway.issuer_id = ai.id AND runway.signal_id = 'cash_runway_quarters'
)
SELECT
  COUNT(*)::integer AS total_active_issuers,
  COUNT(*) FILTER (WHERE current_icr IS NOT NULL)::integer AS scanned_issuers,
  COUNT(*) FILTER (WHERE current_icr < 1.0)::integer AS confirmed_zombies_count,
  ROUND(
    (COUNT(*) FILTER (WHERE current_icr < 1.0)::numeric / NULLIF(COUNT(*) FILTER (WHERE current_icr IS NOT NULL), 0)) * 100,
    1
  ) AS confirmed_zombies_pct,
  COUNT(*) FILTER (WHERE current_icr >= 1.0 AND pro_forma_icr < 1.0)::integer AS rollover_zombies_count,
  ROUND(
    (COUNT(*) FILTER (WHERE current_icr >= 1.0 AND pro_forma_icr < 1.0)::numeric / NULLIF(COUNT(*) FILTER (WHERE current_icr IS NOT NULL), 0)) * 100,
    1
  ) AS rollover_zombies_pct,
  COALESCE(SUM(total_debt) FILTER (WHERE current_icr < 1.0 OR (current_icr >= 1.0 AND pro_forma_icr < 1.0)), 0)::numeric AS total_debt_at_risk_usd,
  ROUND(
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cash_runway)::numeric,
    1
  ) AS median_distress_cash_runway,
  MAX(latest_observed_at) AS latest_observed_at
FROM issuer_metrics;

ALTER VIEW public.vw_corporate_zombie_stress_summary SET (security_invoker = true);
GRANT SELECT ON public.vw_corporate_zombie_stress_summary TO anon, authenticated;
