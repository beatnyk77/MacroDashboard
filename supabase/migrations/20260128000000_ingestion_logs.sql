-- Create ingestion_logs table
CREATE TABLE IF NOT EXISTS public.ingestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    rows_upserted INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying logs by source and time
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_source_created_at ON public.ingestion_logs (source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_run_id ON public.ingestion_logs (run_id);

-- Ensure observations unique constraint exists (idempotency)
-- We assume metric_values table exists from previous context, but just in case we need to be sure about the constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'metric_values_metric_id_date_key'
    ) THEN
        ALTER TABLE public.metric_values ADD CONSTRAINT metric_values_metric_id_date_key UNIQUE (metric_id, date);
    END IF;
END $$;
