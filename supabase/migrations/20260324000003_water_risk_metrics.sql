-- Create table for Water Risk & Infrastructure Lab
CREATE TABLE IF NOT EXISTS public.water_risk_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country TEXT NOT NULL,
    region TEXT,
    water_stress_index NUMERIC,
    capex_usd_bn NUMERIC,
    fiscal_stress_correlation NUMERIC,
    corporate_water_risk NUMERIC,
    energy_water_nexus_score NUMERIC,
    as_of_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(country, as_of_date)
);

-- Enable RLS
ALTER TABLE public.water_risk_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Enable read access for all users on water_risk_metrics"
    ON public.water_risk_metrics
    FOR SELECT
    USING (true);

-- Create Policy for service role write access
CREATE POLICY "Enable insert for service role only" ON public.water_risk_metrics
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role only" ON public.water_risk_metrics
    FOR UPDATE USING (auth.role() = 'service_role');

-- Create cron job to invoke edge function every quarter (e.g., first day of every 3rd month)
-- Using pg_net extension to call edge function
SELECT cron.schedule(
  'invoke_ingest_water_risk',
  '0 0 1 */3 *', -- Run at 00:00 on day 1 of every 3rd month
  $$
    SELECT net.http_post(
        url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-water-risk',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
