-- Migration: Africa Macro Pulse Lab Schema
-- Date: 2026-04-18

-- 1. Add missing African countries to g20_countries (repurposed as general countries table)
INSERT INTO public.g20_countries (code, name, is_major, region) VALUES
  ('KE', 'Kenya', FALSE, 'Africa'),
  ('AO', 'Angola', FALSE, 'Africa'),
  ('GH', 'Ghana', FALSE, 'Africa'),
  ('ET', 'Ethiopia', FALSE, 'Africa'),
  ('MA', 'Morocco', FALSE, 'Africa'),
  ('DZ', 'Algeria', FALSE, 'Africa'),
  ('ZM', 'Zambia', FALSE, 'Africa')
ON CONFLICT (code) DO NOTHING;

-- 2. Create the africa_macro_snapshots table (Monthly Snapshot Card)
CREATE TABLE IF NOT EXISTS public.africa_macro_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    continent_summary TEXT NOT NULL,
    insights_positive JSONB NOT NULL DEFAULT '[]'::jsonb,
    insights_neutral JSONB NOT NULL DEFAULT '[]'::jsonb,
    insights_negative JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.africa_macro_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to africa_macro_snapshots"
ON public.africa_macro_snapshots
FOR SELECT
USING (true);

-- 3. Define Africa-specific metrics in the metrics table
-- These will be used for historical trajectories in metric_observations
INSERT INTO public.metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days) VALUES
  ('AFRICA_DEBT_GDP_AVG', 'Africa Avg Debt/GDP', 'Weighted average Debt-to-GDP across major African economies', 3, 'annual', 'annual', '%', 'percent', 'core', 'sovereign', 'IMF WEO / AfDB Aggregate', 365),
  ('AFRICA_CHINA_TRADE_GRAVITY', 'Africa-China Trade Gravity', 'Total Africa trade with China as % of total external trade', 4, 'annual', 'annual', '%', 'percent', 'core', 'macro_regime', 'UN Comtrade / World Bank', 365)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 4. Schedule the edge function via pg_cron
-- This job runs on the 5th of every month to ingest Africa Macro Data
SELECT
  cron.schedule(
    'ingest-africa-macro-pulse-job',
    '0 0 5 * *',
    $$
    SELECT
      net.http_post(
        url:='https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-africa-macro',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('vault.service_role_key') || '"}'::jsonb
      ) as request_id;
    $$
  );
