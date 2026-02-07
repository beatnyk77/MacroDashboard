-- Fix: Ensure required columns exist before inserting data
ALTER TABLE public.metrics ADD COLUMN IF NOT EXISTS frequency TEXT;
ALTER TABLE public.metrics ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.metrics ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.metrics ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'core';

-- Note: 'category', 'tier', and frequencies are case-sensitive CHECK constraints.
-- allowed: 'monthly', 'quarterly'
-- allowed: 'core', 'secondary'
-- allowed: 'macro_regime'

INSERT INTO public.metrics (id, name, description, frequency, native_frequency, display_frequency, source, unit, tier, category, expected_interval_days)
VALUES 
    -- Standardized Keys for MajorEconomiesTable
    -- Monthly metrics = ~30 days
    ('IN_CPI_YOY', 'India CPI (Combined) Inflation', 'Year-over-year change in All India Consumer Price Index (Combined)', 'monthly', 'monthly', 'monthly', 'MoSPI', 'Percent', 'core', 'macro_regime', 30),
    
    -- Quarterly metrics = ~90 days
    ('IN_GDP_GROWTH_YOY', 'India GDP Growth (Constant Prices)', 'Year-over-year growth in Gross Domestic Product at constant prices', 'quarterly', 'quarterly', 'quarterly', 'MoSPI', 'Percent', 'core', 'macro_regime', 90),
    
    -- Additional MoSPI Metrics
    ('IN_IIP_YOY', 'India Index of Industrial Production', 'Year-over-year change in the Index of Industrial Production (General)', 'monthly', 'monthly', 'monthly', 'MoSPI', 'Percent', 'secondary', 'macro_regime', 30),
    ('IN_UNEMPLOYMENT_RATE', 'India Urban Unemployment Rate', 'PLFS Urban Unemployment Rate (Current Weekly Status)', 'quarterly', 'quarterly', 'quarterly', 'MoSPI', 'Percent', 'core', 'macro_regime', 90)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    frequency = EXCLUDED.frequency,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    source = EXCLUDED.source,
    unit = EXCLUDED.unit,
    tier = EXCLUDED.tier,
    category = EXCLUDED.category,
    expected_interval_days = EXCLUDED.expected_interval_days;
