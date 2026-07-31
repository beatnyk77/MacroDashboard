-- Purge fabricated as_of_date stamps left by ingest-major-economies / ingest-imf-*
-- that shadow real FRED observations. Real FRED annual/quarterly/monthly series use
-- period-start dates (day-of-month = 1). Fabricated writers used `new Date()` so
-- as_of_date was often mid-month and more recent than the real series period,
-- winning DISTINCT ON (metric_id) ORDER BY as_of_date DESC in vw_latest_metrics.

-- Annual OECD growth / World Bank GDP (period = Jan 1)
DELETE FROM public.metric_observations
WHERE metric_id IN (
    'IN_GDP_GROWTH_YOY', 'CN_GDP_GROWTH_YOY', 'DE_GDP_GROWTH_YOY', 'UK_GDP_GROWTH_YOY',
    'AU_GDP_GROWTH_YOY', 'BR_GDP_GROWTH_YOY', 'CA_GDP_GROWTH_YOY', 'FR_GDP_GROWTH_YOY',
    'ID_GDP_GROWTH_YOY', 'IT_GDP_GROWTH_YOY', 'KR_GDP_GROWTH_YOY', 'MX_GDP_GROWTH_YOY',
    'TR_GDP_GROWTH_YOY', 'ZA_GDP_GROWTH_YOY',
    'AU_GDP_NOMINAL_USD', 'BR_GDP_NOMINAL_USD', 'CA_GDP_NOMINAL_USD', 'DE_GDP_NOMINAL_USD',
    'FR_GDP_NOMINAL_USD', 'ID_GDP_NOMINAL_USD', 'IT_GDP_NOMINAL_USD', 'KR_GDP_NOMINAL_USD',
    'MX_GDP_NOMINAL_USD', 'SA_GDP_NOMINAL_USD', 'TR_GDP_NOMINAL_USD', 'UK_GDP_NOMINAL_USD',
    'ZA_GDP_NOMINAL_USD', 'AR_GDP_NOMINAL_USD'
)
AND EXTRACT(DAY FROM as_of_date::date) <> 1;

-- US quarterly real GDP growth (A191RL1Q225SBEA): period starts Jan/Apr/Jul/Oct 1
DELETE FROM public.metric_observations
WHERE metric_id = 'US_GDP_GROWTH_YOY'
AND (
    EXTRACT(DAY FROM as_of_date::date) <> 1
    OR EXTRACT(MONTH FROM as_of_date::date) NOT IN (1, 4, 7, 10)
);

-- Monthly FRED (day must be 1): policy rate, CPI YoY
DELETE FROM public.metric_observations
WHERE metric_id IN ('US_POLICY_RATE', 'US_CPI_YOY')
AND EXTRACT(DAY FROM as_of_date::date) <> 1;

-- Fully fabricated metric families (now deactivated): remove residual observations
DELETE FROM public.metric_observations
WHERE metric_id LIKE 'BRICS\_%' ESCAPE '\'
   OR metric_id IN ('CA_GDP_PCT_IN', 'CA_GDP_PCT_CN', 'CA_GDP_PCT_BR', 'CA_GDP_PCT_TR')
   OR metric_id IN (
        'US_GDP_NOMINAL_TN', 'CN_GDP_NOMINAL_TN', 'IN_GDP_NOMINAL_TN', 'JP_GDP_NOMINAL_TN',
        'US_GDP_PPP_TN', 'CN_GDP_PPP_TN', 'IN_GDP_PPP_TN', 'JP_GDP_PPP_TN'
   );
