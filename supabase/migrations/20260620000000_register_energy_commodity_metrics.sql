-- Register energy & commodity metrics written by ingest pipelines but missing from metrics table.
-- Fixes vw_latest_metrics staleness flags for the Energy & Commodities lab.

INSERT INTO public.metrics (id, name, description, category, source_id, native_frequency, display_frequency, expected_interval_days, is_active, metadata)
SELECT
    v.id,
    v.name,
    v.description,
    'energy',
    (SELECT id FROM public.data_sources WHERE name = v.source_name LIMIT 1),
    v.native_frequency,
    v.display_frequency,
    v.expected_interval_days,
    true,
    v.metadata::jsonb
FROM (VALUES
    ('WTI_CRUDE_PRICE', 'WTI Crude Oil Price', 'West Texas Intermediate spot price (USD/bbl)', 'FRED', 'daily', 'daily', 2, '{"fred_id": "DCOILWTICO", "unit": "usd/bbl"}'),
    ('BRENT_CRUDE_PRICE', 'Brent Crude Oil Price', 'Brent crude oil spot price (USD/bbl)', 'FRED', 'daily', 'daily', 2, '{"fred_id": "DCOILBRENTEU", "unit": "usd/bbl"}'),
    ('NICKEL_PRICE_USD', 'Nickel Price', 'Global nickel price (USD/metric ton)', 'FRED', 'monthly', 'monthly', 35, '{"fred_id": "PNICKUSDM", "unit": "usd/mt"}'),
    ('EU_GAS_STORAGE_PCT', 'EU Gas Storage Level', 'European natural gas storage fill rate (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "GIE AGSI"}'),
    ('US_POWER_COAL_PCT', 'US Power Mix — Coal', 'Coal share of US electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('US_POWER_RENEWABLE_PCT', 'US Power Mix — Renewables', 'Renewable share of US electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('US_POWER_OTHER_PCT', 'US Power Mix — Other', 'Other sources share of US electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('EU_POWER_COAL_PCT', 'EU Power Mix — Coal', 'Coal share of EU electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('EU_POWER_RENEWABLE_PCT', 'EU Power Mix — Renewables', 'Renewable share of EU electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('EU_POWER_OTHER_PCT', 'EU Power Mix — Other', 'Other sources share of EU electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('IN_POWER_COAL_PCT', 'India Power Mix — Coal', 'Coal share of India electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('IN_POWER_RENEWABLE_PCT', 'India Power Mix — Renewables', 'Renewable share of India electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('IN_POWER_OTHER_PCT', 'India Power Mix — Other', 'Other sources share of India electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('CN_POWER_COAL_PCT', 'China Power Mix — Coal', 'Coal share of China electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('CN_POWER_RENEWABLE_PCT', 'China Power Mix — Renewables', 'Renewable share of China electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}'),
    ('CN_POWER_OTHER_PCT', 'China Power Mix — Other', 'Other sources share of China electricity generation (%)', 'EIA', 'monthly', 'monthly', 35, '{"unit": "percent", "source": "Ember Climate"}')
) AS v(id, name, description, source_name, native_frequency, display_frequency, expected_interval_days, metadata)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_frequency = EXCLUDED.display_frequency,
    expected_interval_days = EXCLUDED.expected_interval_days,
    is_active = true,
    metadata = EXCLUDED.metadata,
    updated_at = now();

-- Wire FRED commodity prices for daily ingest-fred pickup
UPDATE public.metrics
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{fred_id}', '"DCOILWTICO"'), is_active = true
WHERE id = 'WTI_CRUDE_PRICE';

UPDATE public.metrics
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{fred_id}', '"DCOILBRENTEU"'), is_active = true
WHERE id = 'BRENT_CRUDE_PRICE';

UPDATE public.metrics
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{fred_id}', '"PNICKUSDM"'), is_active = true
WHERE id = 'NICKEL_PRICE_USD';