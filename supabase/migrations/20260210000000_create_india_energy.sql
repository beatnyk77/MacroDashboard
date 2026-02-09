-- Migration: Create India Energy Table
-- Fixes 404 error in EnergySection by ensuring the resource exists

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.india_energy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('coal', 'renewable', 'electricity', 'oil', 'gas')),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('production', 'consumption', 'capacity')),
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    as_of_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicates for same state/year/metric
    UNIQUE(state_code, year, source_type, metric_type)
);

-- 2. Enable RLS
ALTER TABLE public.india_energy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.india_energy
    FOR SELECT USING (true);

-- 3. Insert Seed Data (Latest Year 2024-25 estimates)
-- This ensures the frontend has something to render immediately
INSERT INTO public.india_energy (state_code, state_name, year, source_type, metric_type, value, unit)
VALUES
    -- Maharashtra
    ('MH', 'Maharashtra', 2024, 'electricity', 'consumption', 18500, 'MW'),
    ('MH', 'Maharashtra', 2024, 'renewable', 'production', 32.5, 'Percent'),
    ('MH', 'Maharashtra', 2024, 'coal', 'production', 65.2, 'MT'),
    
    -- Gujarat
    ('GJ', 'Gujarat', 2024, 'electricity', 'consumption', 14200, 'MW'),
    ('GJ', 'Gujarat', 2024, 'renewable', 'production', 45.8, 'Percent'),
    ('GJ', 'Gujarat', 2024, 'coal', 'production', 12.5, 'MT'), -- Low coal, high renewable
    
    -- Tamil Nadu
    ('TN', 'Tamil Nadu', 2024, 'electricity', 'consumption', 13800, 'MW'),
    ('TN', 'Tamil Nadu', 2024, 'renewable', 'production', 52.1, 'Percent'), -- Leader in wind
    ('TN', 'Tamil Nadu', 2024, 'coal', 'production', 8.4, 'MT'),

    -- Karnataka
    ('KA', 'Karnataka', 2024, 'electricity', 'consumption', 12100, 'MW'),
    ('KA', 'Karnataka', 2024, 'renewable', 'production', 58.4, 'Percent'), -- High solar/hydro
    ('KA', 'Karnataka', 2024, 'coal', 'production', 0.0, 'MT'),

    -- Uttar Pradesh
    ('UP', 'Uttar Pradesh', 2024, 'electricity', 'consumption', 15600, 'MW'),
    ('UP', 'Uttar Pradesh', 2024, 'renewable', 'production', 12.4, 'Percent'),
    ('UP', 'Uttar Pradesh', 2024, 'coal', 'production', 22.8, 'MT'),

    -- Odisha (Coal heavy)
    ('OR', 'Odisha', 2024, 'electricity', 'consumption', 6500, 'MW'),
    ('OR', 'Odisha', 2024, 'renewable', 'production', 18.2, 'Percent'),
    ('OR', 'Odisha', 2024, 'coal', 'production', 185.4, 'MT'), -- Major coal producer
    
    -- Jharkhand
    ('JH', 'Jharkhand', 2024, 'electricity', 'consumption', 4200, 'MW'),
    ('JH', 'Jharkhand', 2024, 'renewable', 'production', 8.5, 'Percent'),
    ('JH', 'Jharkhand', 2024, 'coal', 'production', 155.2, 'MT'); 
