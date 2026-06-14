-- Create the weekly_regime_digests table
CREATE TABLE IF NOT EXISTS public.weekly_regime_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_ending_date DATE NOT NULL UNIQUE,
    executive_summary TEXT NOT NULL,
    regime_shifts JSONB NOT NULL DEFAULT '[]'::jsonb,
    what_changed JSONB NOT NULL DEFAULT '[]'::jsonb,
    what_to_watch JSONB NOT NULL DEFAULT '[]'::jsonb,
    holistic_narrative TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.weekly_regime_digests ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to weekly_regime_digests"
ON public.weekly_regime_digests
FOR SELECT
USING (true);

-- [cron.schedule omitted] SUPERSEDED BY 20260613000000_canonical_crons.sql
-- Original: Scheduled generate-weekly-regime-digest-job (0 23 * * 0).
-- Rescheduled with safe COALESCE + x-cron-secret vault pattern on 2026-06-13.
