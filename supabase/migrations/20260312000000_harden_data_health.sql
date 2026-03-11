-- Migration: Harden Data Health Logic
-- 1. Add provenance to metric_observations to distinguish between real and mock data
-- 2. Enhance ingestion_logs with status codes for better failure analysis
-- 3. Update monitoring views to account for data provenance

SET search_path TO public, cron;

-- Step 1: Add columns to support health logic
ALTER TABLE public.metrics 
ADD COLUMN IF NOT EXISTS frequency_type TEXT DEFAULT 'statistical'
CHECK (frequency_type IN ('statistical', 'structural', 'high_frequency'));

ALTER TABLE public.metric_observations 
ADD COLUMN IF NOT EXISTS provenance TEXT DEFAULT 'api_live' 
CHECK (provenance IN ('api_live', 'fallback_snapshot', 'manual_seed', 'verified_historical'));

COMMENT ON COLUMN public.metrics.frequency_type IS 'statistical (usual), structural (slow moving), high_frequency (frequent updates)';
COMMENT ON COLUMN public.metric_observations.provenance IS 'Source type: api_live (verified API), fallback_snapshot (static snapshot), manual_seed (initial migration), verified_historical (stale but confirmed)';

-- Step 2: Enhance ingestion_logs
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingestion_logs') THEN
        ALTER TABLE public.ingestion_logs ADD COLUMN IF NOT EXISTS status_code INTEGER;
        ALTER TABLE public.ingestion_logs ADD COLUMN IF NOT EXISTS api_latency_ms INTEGER;
    END IF;
END $$;

COMMENT ON COLUMN public.ingestion_logs.status_code IS 'HTTP status code from the primary API request';
COMMENT ON COLUMN public.ingestion_logs.api_latency_ms IS 'Latency of the API request itself (excluding processing time)';

-- Step 3: Update vw_latest_metrics to reflect authenticity
CREATE OR REPLACE VIEW public.vw_latest_metrics AS
WITH latest_obs AS (
  SELECT DISTINCT ON (metric_id)
    metric_id,
    as_of_date,
    value,
    z_score,
    percentile,
    delta_wow,
    delta_mom,
    last_updated_at,
    staleness_flag,
    composite_version,
    provenance
  FROM public.metric_observations
  ORDER BY metric_id, as_of_date DESC
)
SELECT 
  m.id AS metric_id,
  m.name AS metric_name,
  m.category,
  m.tier,
  m.unit,
  m.unit_label,
  m.native_frequency,
  m.display_frequency,
  m.expected_interval_days,
  m.frequency_type,
  lo.as_of_date,
  lo.value,
  lo.z_score,
  lo.percentile,
  lo.delta_wow,
  lo.delta_mom,
  lo.last_updated_at,
  lo.provenance,
  COALESCE(
    lo.staleness_flag,
    CASE 
      -- Structural metrics: 1.5x interval is LAGGED, 3x is VERY_LAGGED
      WHEN m.frequency_type = 'structural' THEN
        CASE
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 1.5 THEN 'fresh'
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 3.0 THEN 'lagged'
          ELSE 'very_lagged'
        END
      -- High-frequency metrics: 1.1x interval is LAGGED, 2x is VERY_LAGGED
      ELSE
        CASE 
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 1.1 THEN 'fresh'
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 2.0 THEN 'lagged'
          ELSE 'very_lagged'
        END
    END
  ) AS staleness_flag,
  EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 AS days_since_update,
  lo.composite_version
FROM public.metrics m
LEFT JOIN latest_obs lo ON m.id = lo.metric_id
WHERE m.is_active = TRUE;

-- Step 4: Update vw_data_staleness_monitor for Health Dashboard
CREATE OR REPLACE VIEW public.vw_data_staleness_monitor AS
SELECT 
  metric_id,
  metric_name,
  days_since_update::INTEGER,
  expected_interval_days,
  frequency_type,
  UPPER(staleness_flag) as status,
  provenance
FROM public.vw_latest_metrics;

-- Step 5: Add authenticity Score View for Dashboard
CREATE OR REPLACE VIEW public.vw_authenticity_percentage AS
SELECT 
  ROUND(
    (COUNT(*) FILTER (WHERE provenance = 'api_live')::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100, 
    1
  ) as authenticity_score,
  COUNT(*) FILTER (WHERE provenance = 'api_live') as live_metrics,
  COUNT(*) as total_metrics
FROM public.vw_latest_metrics;
