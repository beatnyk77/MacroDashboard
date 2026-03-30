-- =====================================================
-- Migration: Geopolitical Risk Events for Fuel Security
-- Created: 2026-03-31
-- =====================================================
-- Table for tracking chokepoint incidents that impact
-- India's fuel security. Used by ingest-fuel-security-india
-- to compute geopolitical_risk_score.
-- =====================================================

-- Table: geopolitical_risk_events
CREATE TABLE IF NOT EXISTS public.geopolitical_risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    as_of_date DATE NOT NULL,                    -- Date event occurred or detected
    chokepoint TEXT NOT NULL,                   -- 'Hormuz', 'Malacca', 'Red Sea', etc.
    event_title TEXT NOT NULL,                  -- Short title
    event_description TEXT,                     -- Detailed description
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),  -- 1=minor, 10=critical
    source_url TEXT,                            -- Link to source (news, OSINT feed)
    source_type TEXT NOT NULL,                  -- 'news', 'satellite', 'maritime', 'government'
    event_type TEXT NOT NULL,                   -- 'conflict', 'exercise', 'closure', 'tension', 'attack'
    resolved_at TIMESTAMPTZ,                    -- NULL = ongoing event
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_event_per_day_chokepoint UNIQUE (as_of_date, chokepoint, event_title)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_geopolitical_risk_events_date ON geopolitical_risk_events(as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_geopolitical_risk_events_chokepoint ON geopolitical_risk_events(chokepoint);
CREATE INDEX IF NOT EXISTS idx_geopolitical_risk_events_active ON geopolitical_risk_events(resolved_at) WHERE resolved_at IS NULL;

-- RLS
ALTER TABLE public.geopolitical_risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.geopolitical_risk_events
    FOR SELECT USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_geopolitical_risk_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_geopolitical_risk_events_updated_at
    BEFORE UPDATE ON public.geopolitical_risk_events
    FOR EACH ROW
    EXECUTE FUNCTION update_geopolitical_risk_events_updated_at();

-- =====================================================
-- View: Daily Geopolitical Risk Score
-- =====================================================
-- Aggregates events into a normalized 0-100 score per day

CREATE OR REPLACE VIEW public.fuel_geopolitical_daily_score AS
SELECT
    DATE(as_of_date) as score_date,
    chokepoint,
    COUNT(*) as event_count,
    MAX(severity) as max_severity,
    SUM(severity) as total_severity,
    -- Weighted score: base + severity sum * chokepoint weight
    LEAST(100, (
        CASE chokepoint
            WHEN 'Hormuz' THEN 40   -- Highest weight: major Middle East chokepoint
            WHEN 'Red Sea' THEN 30  -- High impact to Suez/Europe route
            WHEN 'Malacca' THEN 30  -- Critical for Asia-Pacific
            ELSE 20
        END +
        SUM(severity) * 2.5
    )) as raw_score
FROM geopolitical_risk_events
WHERE as_of_date >= DATE(NOW()) - INTERVAL '90 days'
GROUP BY DATE(as_of_date), chokepoint;

-- View: Aggregated Daily Score (across all chokepoints)
CREATE OR REPLACE VIEW public.fuel_geopolitical_aggregated_score AS
SELECT
    score_date,
    MAX(raw_score) as geopolitical_risk_score,  -- Take max across chokepoints
    jsonb_object_agg(chokepoint, raw_score) as chokepoint_scores,
    COUNT(*) as total_events_today,
    MAX(max_severity) as peak_severity
FROM fuel_geopolitical_daily_score
GROUP BY score_date
ORDER BY score_date DESC;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE geopolitical_risk_events IS 'Geopolitical incidents affecting major maritime chokepoints for oil shipments to India. Used to compute daily risk scores for Fuel Security Clock.';
COMMENT ON COLUMN geopolitical_risk_events.chokepoint IS 'Maritime chokepoint affected: Hormuz (Strait of Hormuz), Malacca (Strait of Malacca), Red Sea (Bab el-Mandeb/Suez), or other.';
COMMENT ON COLUMN geopolitical_risk_events.severity IS 'Event severity 1-10: 1=minor (routine exercise), 5=elevated tensions, 10=critical (closure, major attack).';
COMMENT ON COLUMN geopolitical_risk_events.event_type IS 'Type of incident: conflict (armed hostility), exercise (military drills, routine), closure (physical blockage), tension (diplomatic/military buildup), attack (actual strike).';
COMMENT ON VIEW fuel_geopolitical_daily_score IS 'Aggregates raw severity scores per chokepoint per day. Used by ingestion function to compute final risk score.';
COMMENT ON VIEW fuel_geopolitical_aggregated_score IS 'Daily aggregated risk score (0-100) across all chokepoints, plus breakdown by chokepoint. Joins to fuel_security_clock_india.';

-- =====================================================
-- Seed Data (Optional - for testing)
-- =====================================================

-- Insert sample events only if table is empty (idempotent)
INSERT INTO geopolitical_risk_events (as_of_date, chokepoint, event_title, event_description, severity, source_type, event_type)
SELECT '2025-03-20', 'Hormuz', 'Naval exercise Iran', 'Iranian navy conducts drill in Strait of Hormuz, temporary traffic delays', 6, 'news', 'exercise'
WHERE NOT EXISTS (SELECT 1 FROM geopolitical_risk_events WHERE as_of_date = '2025-03-20' AND chokepoint = 'Hormuz' AND event_title = 'Naval exercise Iran');

INSERT INTO geopolitical_risk_events (as_of_date, chokepoint, event_title, event_description, severity, source_type, event_type)
SELECT '2025-03-18', 'Red Sea', 'Houthi drone threat', 'Houthi claims attack on commercial vessel, Red Sea routing disrupted', 7, 'news', 'attack'
WHERE NOT EXISTS (SELECT 1 FROM geopolitical_risk_events WHERE as_of_date = '2025-03-18' AND chokepoint = 'Red Sea' AND event_title = 'Houthi drone threat');

-- =====================================================
-- Grant Permissions (if needed)
-- =====================================================

-- GRANT SELECT ON fuel_geopolitical_daily_score TO authenticated;
-- GRANT SELECT ON fuel_geopolitical_aggregated_score TO authenticated;