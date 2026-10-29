-- Energy lab, phase 0 (docs/superpowers/specs/2026-10-29-energy-lab-authority-rebuild-design.md).
-- 1) Register the metric ids ingest-energy-oil writes but the metrics table never had, so the writes
--    stop violating the metric_id foreign key and show up in vw_latest_metrics.
-- 2) Make BRENT_CRUDE_PRICE / WTI_CRUDE_PRICE say what they hold (Yahoo front-month futures) and stop
--    ingest-fred from overwriting them with Dated spot; Dated Brent gets its own id, BRENT_SPOT_USD.
-- 3) Delete fabricated rows. Approved by the site owner on 2026-10-29.

INSERT INTO public.metrics (id, name, description, category, source_id, native_frequency, display_frequency, expected_interval_days, is_active, metadata)
SELECT
    v.id,
    v.name,
    v.description,
    'energy',
    (SELECT id FROM public.data_sources WHERE name = v.source_name LIMIT 1),
    v.native_frequency,
    v.native_frequency,
    v.expected_interval_days,
    true,
    v.metadata::jsonb
FROM (VALUES
    ('BRENT_SPOT_USD', 'Brent Crude — Dated Spot', 'Dated Brent spot price (USD/bbl), EIA series republished by FRED. Not a futures price.', 'FRED', 'daily', 3, '{"series": "DCOILBRENTEU", "unit": "usd/bbl", "instrument": "dated_spot"}'),
    ('RBOB_GASOLINE_PRICE', 'RBOB Gasoline Front-Month', 'NYMEX RBOB gasoline front-month futures (USD/gal)', 'Yahoo Finance', 'daily', 3, '{"ticker": "RB=F", "unit": "usd/gal"}'),
    ('HEATING_OIL_PRICE', 'Heating Oil Front-Month', 'NYMEX ULSD / heating oil front-month futures (USD/gal)', 'Yahoo Finance', 'daily', 3, '{"ticker": "HO=F", "unit": "usd/gal"}'),
    ('US_REFINERY_CRACK_321', 'US 3:2:1 Crack Spread', '[(2 x RBOB x 42) + (1 x HO x 42) - (3 x WTI)] / 3 from front-month futures (USD/bbl)', 'COMPUTED', 'daily', 3, '{"unit": "usd/bbl", "formula": "[(2 * RB * 42) + (1 * HO * 42) - (3 * WTI)] / 3"}')
) AS v(id, name, description, source_name, native_frequency, expected_interval_days, metadata)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_id = EXCLUDED.source_id,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    expected_interval_days = EXCLUDED.expected_interval_days,
    is_active = true,
    metadata = EXCLUDED.metadata,
    updated_at = now();

UPDATE public.metrics
SET name = 'Brent Crude — Front-Month Futures',
    description = 'ICE Brent front-month futures (BZ=F), USD/bbl, written by ingest-energy-oil. Not Dated Brent spot; see BRENT_SPOT_USD.',
    source_id = (SELECT id FROM public.data_sources WHERE name = 'Yahoo Finance' LIMIT 1),
    metadata = (COALESCE(metadata, '{}'::jsonb) - 'fred_id') || '{"ticker": "BZ=F", "instrument": "front_month_future", "unit": "usd/bbl"}'::jsonb,
    updated_at = now()
WHERE id = 'BRENT_CRUDE_PRICE';

UPDATE public.metrics
SET name = 'WTI Crude — Front-Month Futures',
    description = 'NYMEX WTI front-month futures (CL=F), USD/bbl, written by ingest-energy-oil.',
    source_id = (SELECT id FROM public.data_sources WHERE name = 'Yahoo Finance' LIMIT 1),
    metadata = (COALESCE(metadata, '{}'::jsonb) - 'fred_id') || '{"ticker": "CL=F", "instrument": "front_month_future", "unit": "usd/bbl"}'::jsonb,
    updated_at = now()
WHERE id = 'WTI_CRUDE_PRICE';

-- India Fuel Security Clock: every one of the 134 rows (2026-04-05 .. 2026-10-29) came from literals in
-- ingest-energy-oil / ingest-fuel-security-india (9.5 / 74.0 days, 128 tankers, risk 48; earlier versions
-- 8.5 / 7.4 days, 120-135150 tankers, risk 50, some flagged is_fallback) re-dated each day.
DELETE FROM public.fuel_security_clock_india WHERE as_of_date <= DATE '2026-10-29';

-- Refining capacity for 2026: seeded by 20260911000000 and labelled Energy Institute data, which has
-- not published a 2026 figure.
DELETE FROM public.oil_refining_capacity WHERE as_of_year = 2026;
