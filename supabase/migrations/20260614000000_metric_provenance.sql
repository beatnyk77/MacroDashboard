-- Migration: Persisted Provenance (source_ref + is_provisional)
-- Task 2.4: Make fabricated/fallback data queryable and visible.
--
-- Adds two columns to metric_observations (canonical time-series table) and
-- trade_gravity (domain-specific table that holds trade bloc data):
--
--   source_ref    TEXT     — structured provenance tag:
--                            live_api:<source>  | fallback:<source> | seed:<migration> | manual
--   is_provisional BOOLEAN — true when the row was not fetched from a live API
--                            (hardcoded fallback, seeded value, or manual entry)
--
-- After this migration, all newly ingested rows carry provenance automatically.
-- Backfills cover only identifiable fallback/seed rows (noted below).

-- ─── 1. metric_observations ───────────────────────────────────────────────────

ALTER TABLE public.metric_observations
  ADD COLUMN IF NOT EXISTS source_ref     TEXT,
  ADD COLUMN IF NOT EXISTS is_provisional BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.metric_observations.source_ref IS
  'Provenance tag: live_api:<source> | fallback:<source> | seed:<migration> | manual';

COMMENT ON COLUMN public.metric_observations.is_provisional IS
  'True when this row was NOT fetched from a live API (hardcoded fallback, seed migration, or manual entry)';

-- Backfill: ingest-china-macro always hard-pushes CN_POLICY_RATE 2025-10-01
-- at value=3.10 regardless of whether FRED returned data.  This row is
-- identifiable by (metric_id, as_of_date, value) because the literal values
-- are constants in the source code (ingest-china-macro/index.ts line ~145-151).
UPDATE public.metric_observations
SET
  is_provisional = true,
  source_ref     = 'fallback:china-macro-lpr-hardcoded'
WHERE metric_id   = 'CN_POLICY_RATE'
  AND as_of_date  = '2025-10-01'
  AND value       = 3.10;

-- Remaining metric_observations rows seeded by migrations are not individually
-- identifiable without manual cross-referencing; they retain is_provisional=false
-- (the safe default) until a future audit pass marks them via seed:<migration>.

-- ─── 2. trade_gravity ─────────────────────────────────────────────────────────
-- trade_gravity is a domain table (not metric_observations); fallback data is
-- written there directly by ingest-trade-gravity when the Comtrade API is
-- unavailable (ingest-trade-gravity/index.ts lines 83-105).

ALTER TABLE public.trade_gravity
  ADD COLUMN IF NOT EXISTS source_ref     TEXT,
  ADD COLUMN IF NOT EXISTS is_provisional BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.trade_gravity.source_ref IS
  'Provenance tag: live_api:comtrade | fallback:trade-gravity-2023 | seed:<migration>';

COMMENT ON COLUMN public.trade_gravity.is_provisional IS
  'True when this row came from the hardcoded 2023 fallback dataset, not live Comtrade API';

-- Backfill: all period='2023' rows are identifiable as fallback because:
--   (a) the fallback block only fires for period 2023 (the API fetches 2024+2023
--       and falls back to hardcoded data only when the 2023 period is missing),
--   (b) the hardcoded values have exact USD amounts (445e9, 360e9, …) that are
--       constants in the source (ingest-trade-gravity/index.ts lines 88-104).
-- We cannot distinguish "API-fetched 2023" from "fallback 2023" after the fact,
-- so we mark all period='2023' rows as provisional — a conservative, safe choice.
-- If the Comtrade API later returns 2023 data, the upsert overwomes these rows
-- with is_provisional=false.
UPDATE public.trade_gravity
SET
  is_provisional = true,
  source_ref     = 'fallback:trade-gravity-2023'
WHERE period = '2023';

-- ─── 3. china_macro_pulse (legacy chart table) ────────────────────────────────
-- china_macro_pulse mirrors metric_observations for chart queries.  It has no
-- formal migration (table exists in the DB but was created outside tracked SQL).
-- We add the columns defensively so the ingest function can stamp provenance
-- when it writes the mirrored rows.
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'china_macro_pulse'
  ) THEN
    ALTER TABLE public.china_macro_pulse
      ADD COLUMN IF NOT EXISTS source_ref     TEXT,
      ADD COLUMN IF NOT EXISTS is_provisional BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ─── 4. Refresh vw_latest_metrics to expose new columns ───────────────────────
-- The view already exists (20260312000000_harden_data_health.sql); we recreate
-- it here to surface source_ref and is_provisional to API consumers.
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
    provenance,
    source_ref,
    is_provisional
  FROM public.metric_observations
  ORDER BY metric_id, as_of_date DESC
)
SELECT
  m.id                      AS metric_id,
  m.name                    AS metric_name,
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
  lo.source_ref,
  lo.is_provisional,
  COALESCE(
    lo.staleness_flag,
    CASE
      WHEN m.frequency_type = 'structural' THEN
        CASE
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 1.5 THEN 'fresh'
          WHEN EXTRACT(EPOCH FROM (NOW() - lo.last_updated_at)) / 86400 <= m.expected_interval_days * 3.0 THEN 'lagged'
          ELSE 'very_lagged'
        END
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
