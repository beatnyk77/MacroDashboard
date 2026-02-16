CREATE TABLE IF NOT EXISTS public.financial_hubs_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub TEXT NOT NULL, -- 'Switzerland', 'Singapore', 'London', 'Dubai'
    metric_date DATE NOT NULL,
    primary_metric_value NUMERIC NOT NULL,
    primary_metric_label TEXT NOT NULL,
    secondary_metrics JSONB DEFAULT '{}'::jsonb,
    sparkline_data JSONB DEFAULT '[]'::jsonb,
    percentile NUMERIC,
    z_score NUMERIC,
    source TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hub, metric_date)
);

-- Enable RLS
ALTER TABLE public.financial_hubs_metrics ENABLE ROW LEVEL SECURITY;

-- Anonymous read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'financial_hubs_metrics' 
        AND policyname = 'Allow anonymous read access'
    ) THEN
        CREATE POLICY "Allow anonymous read access" ON public.financial_hubs_metrics
            FOR SELECT USING (true);
    END IF;
END
$$;
