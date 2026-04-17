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

-- Schedule the edge function via pg_cron
-- This assumes the extension exists and the function URL is accessible
-- 0 0 4 * * runs on the 4th of every month at midnight
SELECT
  cron.schedule(
    'ingest-india-macro-snapshot-job',
    '0 0 4 * *',
    $$
    SELECT
      net.http_post(
        url:='https://graphiquestor.com/functions/v1/ingest-india-macro-snapshot',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('vault.service_role_key') || '"}'::jsonb
      ) as request_id;
    $$
  );
