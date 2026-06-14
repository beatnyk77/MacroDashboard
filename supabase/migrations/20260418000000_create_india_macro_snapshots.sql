-- Create the india_macro_snapshots table
CREATE TABLE IF NOT EXISTS public.india_macro_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    geopolitical_summary TEXT NOT NULL,
    insights_positive JSONB NOT NULL DEFAULT '[]'::jsonb,
    insights_neutral JSONB NOT NULL DEFAULT '[]'::jsonb,
    insights_negative JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.india_macro_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to india_macro_snapshots"
ON public.india_macro_snapshots
FOR SELECT
USING (true);

-- [cron.schedule omitted] SUPERSEDED BY 20260613000000_canonical_crons.sql
-- Original: Scheduled ingest-india-macro-snapshot-job (0 0 4 * *).
-- Rescheduled with safe COALESCE + x-cron-secret vault pattern on 2026-06-13.
