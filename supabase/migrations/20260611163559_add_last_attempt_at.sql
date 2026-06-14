-- Migration: Separate ingest attempt timestamp from success timestamp
-- on the metrics table so that staleness monitors and retry rotation
-- read semantically distinct values.
--
-- Problem: several ingest functions bumped metrics.updated_at inside their
-- catch blocks to rotate retry priority (oldest updated_at = next to run).
-- This made a permanently failing metric look freshly updated to every
-- staleness monitor that reads metrics.updated_at.
--
-- Fix contract:
--   updated_at      = last successful ingest (unchanged semantics)
--   last_attempt_at = last ingest ATTEMPT, success OR failure
--
-- Retry rotation now orders by COALESCE(last_attempt_at, updated_at) so
-- metrics with no attempt record yet fall back to their last success time,
-- preserving existing priority ordering during rollout.

ALTER TABLE metrics
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

COMMENT ON COLUMN metrics.last_attempt_at IS
  'Last ingest ATTEMPT (success or failure). updated_at = last SUCCESS only. '
  'Retry rotation orders by last_attempt_at; staleness monitors read updated_at.';
