-- =====================================================
-- Create events_markers table and enhance oil flows
-- =====================================================

-- 1. Create events_markers table
CREATE TABLE IF NOT EXISTS public.events_markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date DATE NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'Conflict', 'Protest', 'Disruption'
    count INTEGER DEFAULT 1,
    location_name TEXT,
    source TEXT NOT NULL,
    raw_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.events_markers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access for events"
ON public.events_markers FOR SELECT
TO public
USING (true);

-- 2. Ensure oil_imports_by_origin has exporter_country_name
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='oil_imports_by_origin' AND column_name='exporter_country_name') THEN
        ALTER TABLE public.oil_imports_by_origin ADD COLUMN exporter_country_name TEXT;
    END IF;
END $$;
