-- ingest-imf-current-account wrote hardcoded values (variable literally
-- named `mockValues`) restamped as live monthly data. Deactivating the
-- metrics until a real source is integrated, per "no fabricated data."
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'Source function (ingest-imf-current-account) was writing hardcoded placeholder values, not real API data. Deactivated 2026-08-01 pending a real IMF/World Bank current-account integration.'
    )
WHERE id IN ('CA_GDP_PCT_IN', 'CA_GDP_PCT_CN', 'CA_GDP_PCT_BR', 'CA_GDP_PCT_TR');

SELECT cron.unschedule('ingest-imf-current-account-monthly');

-- ingest-imf-brics wrote hardcoded BRICS-bloc aggregates and country gold
-- reserves, restamped as live monthly data. Deactivating until a real
-- source or a real from-country-data computation is built.
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'Source function (ingest-imf-brics) was writing hardcoded placeholder values, not real API data. Deactivated 2026-08-01 pending a real source or a computed-from-country-data replacement.'
    )
WHERE id LIKE 'BRICS\_%' ESCAPE '\';

SELECT cron.unschedule('ingest-imf-brics-monthly');
