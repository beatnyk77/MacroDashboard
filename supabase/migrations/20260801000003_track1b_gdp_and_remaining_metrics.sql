-- Track 1b: recover remaining orphaned GDP / liquidity / flow metrics.
-- Every metadata.fred_id below was verified live on FRED (2026-08-01).
-- Metrics without a clean single-series path are deactivated with a reason
-- (project rule: no fabricated / never-updating numbers).

-- ---------------------------------------------------------------------------
-- Step 1: Nominal GDP (World Bank WDI mirror on FRED)
-- Pattern: MKTGDP{ISO2}A646NWDB  (UK uses ISO2 GB)
-- Verified each series page shows 2025 observations, source NY.GDP.MKTP.CD
-- ---------------------------------------------------------------------------
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPARA646NWDB') WHERE id = 'AR_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPAUA646NWDB') WHERE id = 'AU_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPBRA646NWDB') WHERE id = 'BR_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPCAA646NWDB') WHERE id = 'CA_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPDEA646NWDB') WHERE id = 'DE_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPFRA646NWDB') WHERE id = 'FR_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPIDA646NWDB') WHERE id = 'ID_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPITA646NWDB') WHERE id = 'IT_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPKRA646NWDB') WHERE id = 'KR_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPMXA646NWDB') WHERE id = 'MX_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPSAA646NWDB') WHERE id = 'SA_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPTRA646NWDB') WHERE id = 'TR_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPGBA646NWDB') WHERE id = 'UK_GDP_NOMINAL_USD';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'MKTGDPZAA646NWDB') WHERE id = 'ZA_GDP_NOMINAL_USD';

-- ---------------------------------------------------------------------------
-- Step 2: Real GDP growth YoY (OECD MEI growth-rate previous period)
-- Pattern: NAEXKP01{ISO2}A657S  (UK uses GB)
-- Verified 2025 observations for OECD + key-partner countries below.
-- AR / SA: OECD series 404; no World Bank NY.GDP.MKTP.KD.ZG mirror on FRED
-- (IMF REO series exist but include future-year projections as "latest" —
-- unsuitable for a pure observation terminal). Deactivated below.
-- ---------------------------------------------------------------------------
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01AUA657S') WHERE id = 'AU_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01BRA657S') WHERE id = 'BR_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01CAA657S') WHERE id = 'CA_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01DEA657S') WHERE id = 'DE_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01FRA657S') WHERE id = 'FR_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01IDA657S') WHERE id = 'ID_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01ITA657S') WHERE id = 'IT_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01KRA657S') WHERE id = 'KR_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01MXA657S') WHERE id = 'MX_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01TRA657S') WHERE id = 'TR_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01GBA657S') WHERE id = 'UK_GDP_GROWTH_YOY';
UPDATE public.metrics SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01ZAA657S') WHERE id = 'ZA_GDP_GROWTH_YOY';

UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'No OECD NAEXKP01{ISO2}A657S or World Bank NY.GDP.MKTP.KD.ZG mirror on FRED (verified 2026-08-01). IMF REO growth series include multi-year projections as latest observations — unsuitable for observation-only terminal.'
    )
WHERE id IN ('AR_GDP_GROWTH_YOY', 'SA_GDP_GROWTH_YOY');

-- ---------------------------------------------------------------------------
-- Step 3: US GFCF / private GFCF as % of GDP
-- Numerators (GPDIC1, PNFIC1, USAGFCFQDSNAQ) exist as levels, but no clean
-- single published FRED ratio series. Ratio would require multi-series
-- composite complexity; plan allows deactivation rather than over-engineering.
-- ---------------------------------------------------------------------------
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'GFCF/GDP is a ratio; no single FRED series publishes this percent (GPDIC1/PNFIC1 are levels only). Multi-series composite deferred — deactivate rather than over-engineer.'
    )
WHERE id IN ('US_GFCF_GDP_PCT', 'US_PRIVATE_GFCF_GDP_PCT');

-- ---------------------------------------------------------------------------
-- Step 4: Constructed capital-flow proxies (no single FRED series)
-- ---------------------------------------------------------------------------
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'Proxy requires a constructed fund-flow model, not a single FRED series; out of scope for this fix — needs its own design.'
    )
WHERE id IN ('CAPITAL_FROM_EM_DEBT_BN', 'CAPITAL_FROM_GOLD_ETF_BN');

-- ---------------------------------------------------------------------------
-- Step 5: Composite indices mislabeled as FRED (source_id = 1)
-- POLICY_DIVERGENCE_INDEX is written by ingest-currency-wars → COMPUTED (16).
-- FLOW_TENSION_INDEX / RUPEE_PRESSURE_SCORE: no compute or ingest pipeline
-- writes these IDs (currency-wars writes COMPOSITE_PRESSURE_INDEX instead).
-- ---------------------------------------------------------------------------
UPDATE public.metrics
SET source_id = 16,
    metadata = metadata || jsonb_build_object(
        'compute_source',
        'ingest-currency-wars',
        'note',
        'Fed Funds − RBI Repo spread (bps); derived, not a FRED series.'
    )
WHERE id = 'POLICY_DIVERGENCE_INDEX';

UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'No compute or ingest pipeline exists for this index; mislabeled as FRED-sourced.'
    )
WHERE id IN ('FLOW_TENSION_INDEX', 'RUPEE_PRESSURE_SCORE');
