-- BoJ balance sheet unit fix (2026-10-27). Both BOJ_*_TRJPY metrics are trillion JPY, but:
--  * ingest-fred copied FRED JPNASSETS raw (100 million JPY, e.g. 6250253 = 625 tn) into both,
--    because both were registered with metadata.fred_id = 'JPNASSETS';
--  * ingest-central-banks divided by 1e6 (6.25), and read monetary base from JPNBASE, which
--    does not exist on FRED.
-- ingest-central-banks is now the only writer: total assets = JPNASSETS / 10,000 and monetary
-- base = BoJ API MABS1AN11 / 10,000. Its next run overwrites every monetary-base month (the old
-- rows are total-assets values under the wrong id) with the BoJ series.

-- Stop ingest-fred writing these ids (it selects metrics by metadata.fred_id).
UPDATE public.metrics
SET metadata = (metadata - 'fred_id') || '{"source_series": "FRED JPNASSETS", "source_unit": "100 million JPY"}'::jsonb,
    native_frequency = 'monthly', display_frequency = 'monthly'
WHERE id = 'BOJ_TOTAL_ASSETS_TRJPY';

UPDATE public.metrics
SET metadata = (metadata - 'fred_id') || '{"source_series": "BoJ MABS1AN11 (Monetary Base, average amounts outstanding)", "source_unit": "100 million JPY"}'::jsonb,
    native_frequency = 'monthly', display_frequency = 'monthly'
WHERE id = 'BOJ_MONETARY_BASE_TRJPY';

-- Rescale stored total assets to trillion JPY. BoJ assets have exceeded 60 tn JPY throughout
-- the series, so < 10 can only be the /1e6 rows and >= 10,000 only the raw 100-million rows.
UPDATE public.metric_observations
SET value = ROUND(value * 100, 4), last_updated_at = NOW()
WHERE metric_id = 'BOJ_TOTAL_ASSETS_TRJPY' AND value < 10;

UPDATE public.metric_observations
SET value = ROUND(value / 10000, 4), last_updated_at = NOW()
WHERE metric_id = 'BOJ_TOTAL_ASSETS_TRJPY' AND value >= 10000;
