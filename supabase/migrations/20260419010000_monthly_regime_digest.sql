-- Create the monthly_regime_digests table
CREATE TABLE IF NOT EXISTS public.monthly_regime_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_month TEXT NOT NULL UNIQUE,
    subject_line TEXT NOT NULL,
    html_content TEXT NOT NULL,
    plain_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.monthly_regime_digests ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to monthly_regime_digests"
ON public.monthly_regime_digests
FOR SELECT
USING (true);

-- [cron.schedule omitted] SUPERSEDED BY 20260613000000_canonical_crons.sql
-- Original: Scheduled generate-monthly-regime-digest-job (30 0 1 * *).
-- Rescheduled with safe COALESCE + x-cron-secret vault pattern on 2026-06-13.
