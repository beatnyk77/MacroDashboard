CREATE TABLE IF NOT EXISTS public.india_institutional_positioning_snapshots (
  as_of_date date PRIMARY KEY,
  score numeric,
  regime text NOT NULL,
  confidence integer NOT NULL,
  coverage_mask jsonb NOT NULL DEFAULT '[]'::jsonb,
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_dates jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculation_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.india_institutional_positioning_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on india institutional snapshots" ON public.india_institutional_positioning_snapshots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role write access on india institutional snapshots" ON public.india_institutional_positioning_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.india_institutional_positioning_snapshots TO anon, authenticated;
GRANT ALL ON public.india_institutional_positioning_snapshots TO service_role;
