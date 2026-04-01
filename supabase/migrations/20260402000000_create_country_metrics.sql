-- Migration: Create country_metrics table optimized for programmatic SEO pages
-- Primary key is strictly (iso, metric_key) to cap table size and maximize query speed.

CREATE TABLE IF NOT EXISTS public.country_metrics (
    iso TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    value NUMERIC,
    as_of DATE,
    source TEXT NOT NULL,
    confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
    last_cron TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    PRIMARY KEY (iso, metric_key)
);

COMMENT ON TABLE public.country_metrics IS 'Country-level macro metrics for programmatic SEO pages. Strictly 1 row per iso/metric combination.';
COMMENT ON COLUMN public.country_metrics.iso IS 'ISO 3166-1 alpha-2 country code (e.g., US, IN, CN)';
COMMENT ON COLUMN public.country_metrics.metric_key IS 'Standardized metric identifier (e.g., gdp_yoy_pct, cpi_yoy_pct)';
COMMENT ON COLUMN public.country_metrics.confidence IS 'Data confidence score 0-1 based on source reliability and freshness';

-- Enable Row Level Security (RLS)
ALTER TABLE public.country_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (necessary for Next.js ISR at build time if using Anon key, or service role bypasses this)
CREATE POLICY "Enable read access for all users" ON public.country_metrics
    FOR SELECT
    USING (true);

-- No public write policies; ingestion happens via Edge Function using Service Role key.
