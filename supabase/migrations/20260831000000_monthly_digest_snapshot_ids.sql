ALTER TABLE public.monthly_regime_digests
ADD COLUMN IF NOT EXISTS snapshot_ids JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.weekly_regime_digests
ADD COLUMN IF NOT EXISTS snapshot_ids JSONB DEFAULT '{}'::jsonb;
