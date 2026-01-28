-- Migration to create upcoming_events table and view
-- This table is designed for institutional-grade macro events (Forex Factory style)

-- 1. Create the table
CREATE TABLE IF NOT EXISTS upcoming_events (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_name TEXT NOT NULL,
    country TEXT NOT NULL,
    impact_level TEXT CHECK (impact_level IN ('High', 'Medium', 'Low')),
    forecast TEXT,
    previous TEXT,
    actual TEXT,
    surprise TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_event UNIQUE (event_date, event_name, country)
);

-- 2. Create a view for the frontend
CREATE OR REPLACE VIEW vw_upcoming_events AS
SELECT 
    id,
    event_date,
    event_name,
    country,
    impact_level,
    forecast,
    previous,
    actual,
    surprise,
    source_url,
    CASE 
        WHEN surprise LIKE '-%' THEN 'negative'
        WHEN surprise IS NOT NULL AND surprise != '' THEN 'positive'
        ELSE 'neutral'
    END as surprise_direction
FROM upcoming_events
WHERE event_date >= (CURRENT_DATE - INTERVAL '7 days')
ORDER BY event_date ASC;

-- 3. (Optional) Migrate existing data from macro_events if applicable
-- But since we are upgrading to "institutional grade", better to start fresh with the ingestion.
