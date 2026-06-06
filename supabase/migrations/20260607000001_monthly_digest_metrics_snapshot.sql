-- Add metrics_snapshot column to store the macro telemetry used to generate each digest
-- This powers the at-a-glance metrics strip on the digest detail page

ALTER TABLE public.monthly_regime_digests
ADD COLUMN IF NOT EXISTS metrics_snapshot JSONB;
