CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
    attempts INTEGER NOT NULL DEFAULT 1,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER,
    metadata JSONB
);

-- Optimize querying for dashboard history (ordered by started_at DESC)
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at ON public.ingestion_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_job_name ON public.ingestion_runs(job_name);
