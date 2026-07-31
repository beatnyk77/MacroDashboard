-- Recover FRED series IDs that were documented in `description` but never
-- written to `metadata.fred_id`, which is what ingest-fred actually reads.
-- These metrics have been silently skipped by every ingest run since
-- ~2026-02-05 because metadata was empty ({}).

UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MORTGAGE30US') WHERE id = 'HOUSING_MORTGAGE_RATE_30Y';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'CSUSHPISA') WHERE id = 'HOUSING_PRICE_INDEX';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MSPUS') WHERE id = 'HOUSING_MEDIAN_INCOME_RATIO';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'JTSJOL') WHERE id = 'LABOR_VACANCIES_JOLTS';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'UNRATE') WHERE id = 'LABOR_UNEMPLOYMENT_RATE';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'CES0500000003') WHERE id = 'LABOR_WAGE_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'CPIAUCSL') WHERE id = 'INFLATION_HEADLINE_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'CPILFESL') WHERE id = 'INFLATION_CORE_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MICH') WHERE id = 'INFLATION_EXPECTATIONS_UM';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'T5YIFR') WHERE id = 'INFLATION_BREAKEVEN_5Y';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'FDHBFRBN') WHERE id = 'CAPITAL_FROM_TREASURIES_BN';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'BOPGSTB') WHERE id = 'BOP_CURRENT_ACCOUNT_GDP';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'PCOPPUSDM') WHERE id = 'COPPER_PRICE_USD';

-- Ratio/proxy metrics: ingest-fred has no generic "ratio of two series" path yet.
-- Task 4 below adds a special-case branch (matching the existing SOFR_OIS_SPREAD
-- pattern) for these. Metadata is set now so the branch has what it needs.
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id_numerator', 'PCOPPUSDM', 'fred_id_denominator', 'GOLDAMGBD228NLBM') WHERE id = 'COPPER_GOLD_RATIO';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id_proxy', 'WLODLL', 'proxy_note', 'Equity fund flow proxy, scaled per original description') WHERE id = 'CAPITAL_FROM_EQUITY_ETF_BN';

-- Verified during plan research (not in description, confirmed active on FRED):
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'DEXBZUS') WHERE id = 'USD_BRL_RATE';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'DEXMXUS') WHERE id = 'USD_MXN_RATE';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'DEXTAUS') WHERE id = 'USD_TWD_RATE';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'A191RL1Q225SBEA') WHERE id = 'US_GDP_GROWTH_YOY';
