-- Materialize Latest Metrics for Performance (P3)
-- Replaces the slow vw_latest_metrics View with a Trigger-Synchronized Table

-- 1. Create the Table
CREATE TABLE IF NOT EXISTS public.latest_metrics (
    metric_id text PRIMARY KEY,
    as_of_date date NOT NULL,
    value double precision,
    last_updated_at timestamp with time zone DEFAULT now(),
    z_score double precision,
    provenance text,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Create the Sync Function
CREATE OR REPLACE FUNCTION public.sync_latest_metrics()
RETURNS trigger AS $$
BEGIN
    -- Only update if the new observation is for the same or newer date
    INSERT INTO public.latest_metrics (metric_id, as_of_date, value, last_updated_at, z_score, provenance)
    VALUES (NEW.metric_id, NEW.as_of_date, NEW.value, COALESCE(NEW.last_updated_at, now()), NEW.z_score, NEW.provenance)
    ON CONFLICT (metric_id) DO UPDATE
    SET 
        as_of_date = EXCLUDED.as_of_date,
        value = EXCLUDED.value,
        last_updated_at = EXCLUDED.last_updated_at,
        z_score = EXCLUDED.z_score,
        provenance = EXCLUDED.provenance
    WHERE EXCLUDED.as_of_date >= latest_metrics.as_of_date;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS tr_sync_latest_metrics ON public.metric_observations;
CREATE TRIGGER tr_sync_latest_metrics
AFTER INSERT OR UPDATE ON public.metric_observations
FOR EACH ROW EXECUTE FUNCTION public.sync_latest_metrics();

-- 4. Initial Seed from Historical Data
INSERT INTO public.latest_metrics (metric_id, as_of_date, value, last_updated_at, z_score, provenance)
SELECT DISTINCT ON (metric_id) 
    metric_id, as_of_date, value, last_updated_at, z_score, provenance
FROM public.metric_observations
ORDER BY metric_id, as_of_date DESC
ON CONFLICT (metric_id) DO UPDATE
SET 
  as_of_date = EXCLUDED.as_of_date,
  value = EXCLUDED.value,
  last_updated_at = EXCLUDED.last_updated_at,
  z_score = EXCLUDED.z_score,
  provenance = EXCLUDED.provenance;

-- 5. Update the View to use the Table (Backward Compatibility)
CREATE OR REPLACE VIEW public.vw_latest_metrics AS
SELECT * FROM public.latest_metrics;

-- 6. Add Indexes for standard monitoring queries
CREATE INDEX IF NOT EXISTS idx_latest_metrics_as_of_date ON public.latest_metrics(as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_latest_metrics_provenance ON public.latest_metrics(provenance);
