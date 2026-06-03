-- Migration: Create gsc_performance table and schedule daily sync
-- Purpose: Store daily Google Search Console performance data for macro/SEO intelligence

CREATE TABLE IF NOT EXISTS public.gsc_performance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    page text NOT NULL,
    query text NOT NULL,
    impressions int NOT NULL,
    clicks int NOT NULL,
    ctr float NOT NULL,
    position float NOT NULL,
    country text,
    device text,
    inserted_at timestamptz DEFAULT now()
);

-- Unique index to ensure idempotency.
-- COALESCE converts NULLs to empty string so they compare as equal (same behaviour
-- as NULLS NOT DISTINCT, but compatible with PostgreSQL 14 and earlier).
CREATE UNIQUE INDEX IF NOT EXISTS idx_gsc_performance_unique
    ON public.gsc_performance (date, page, query, COALESCE(country, ''), COALESCE(device, ''));

-- Enable RLS
ALTER TABLE public.gsc_performance ENABLE ROW LEVEL SECURITY;

-- Allow public read access (matches other data tables)
CREATE POLICY "Allow public read access to gsc_performance"
    ON public.gsc_performance
    FOR SELECT
    USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to gsc_performance"
    ON public.gsc_performance
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Schedule the edge function to run daily at 6:00 AM UTC
-- We use a 120 second timeout since the GSC API can take some time to respond for large sites
SELECT public.schedule_standard_cron(
    'gsc-sync-daily',
    '0 6 * * *',
    'gsc-sync',
    120
);
