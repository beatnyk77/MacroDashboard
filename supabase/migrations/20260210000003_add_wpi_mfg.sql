-- Add WPI Manufactured Goods metric to public.metrics
-- FRED Series ID: WPIITMN01INM657N (Wholesale Price Index: Manufactured Products for India, GP: 2011-12=100, Monthly, Not Seasonally Adjusted) 
-- Note: This matches the "Manufactured Products" weight in WPI.

INSERT INTO public.metrics (
    id, 
    source_id, 
    name, 
    description, 
    frequency, 
    display_frequency,
    category,
    native_frequency,
    expected_interval_days,
    metadata, 
    is_active
) VALUES (
    'IN_WPI_MFG_YOY',
    (SELECT id FROM public.data_sources WHERE name = 'FRED'),
    'WPI Manufactured Products Inflation',
    'Wholesale Price Index for Manufactured Products in India. Used as a proxy for input cost inflation for manufacturers.',
    'monthly',
    'monthly',
    'inflation_regime',
    'monthly',
    30,
    '{"fred_id": "WPIITMN01INM657N", "fred_units": "pc1", "category": "inflation_regime"}'::jsonb,
    true
) ON CONFLICT (id) DO UPDATE SET
    metadata = EXCLUDED.metadata,
    is_active = true;
