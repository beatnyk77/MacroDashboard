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

-- Schedule the edge function via pg_cron
-- Every Sunday at 23:00 UTC
-- Note: '0 23 * * 0' is 11 PM on Sunday
SELECT
  cron.schedule(
    'generate-weekly-regime-digest-job',
    '0 23 * * 0',
    $$
    SELECT
      net.http_post(
        url:='https://graphiquestor.com/functions/v1/generate-weekly-regime-digest',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('vault.service_role_key') || '"}'::jsonb
      ) as request_id;
    $$
  );
