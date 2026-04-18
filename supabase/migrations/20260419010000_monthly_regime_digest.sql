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

-- Schedule the edge function via pg_cron
-- 1st of every month at 00:30 UTC
SELECT cron.schedule('generate-monthly-regime-digest-job', '30 0 1 * *', $$
  SELECT net.http_post(
      url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-monthly-regime-digest',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
$$);
