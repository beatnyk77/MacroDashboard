-- ingest-major-economies wrote ~32 hardcoded macro values + 15 reserves rows
-- restamped as live monthly data. Per "pull until real" (2026-08-01):
-- redirect metrics with a verified single FRED series into ingest-fred;
-- deactivate the rest; unschedule the monthly cron (function is now a no-op).
--
-- Every fred_id below was verified live on FRED (2026-08-01).

-- ---------------------------------------------------------------------------
-- Step 1: Verified FRED redirects (units already match metric unit)
-- ---------------------------------------------------------------------------

-- Federal Funds Effective Rate (live monthly; Jun 2026: 3.63)
-- https://fred.stlouisfed.org/series/FEDFUNDS
UPDATE public.metrics
SET metadata = metadata || jsonb_build_object('fred_id', 'FEDFUNDS')
WHERE id = 'US_POLICY_RATE';

-- Real GDP % change from preceding period, SAAR (Task 1 already set this;
-- re-assert for idempotency — do not change series ID).
-- https://fred.stlouisfed.org/series/A191RL1Q225SBEA
UPDATE public.metrics
SET metadata = metadata || jsonb_build_object('fred_id', 'A191RL1Q225SBEA')
WHERE id = 'US_GDP_GROWTH_YOY';

-- CPI index → YoY via FRED units=pc1 (percent change from year ago).
-- Raw CPIAUCSL is Index 1982-84=100; without pc1, observations land as ~330.
-- https://fred.stlouisfed.org/series/CPIAUCSL
UPDATE public.metrics
SET metadata = metadata || jsonb_build_object(
    'fred_id', 'CPIAUCSL',
    'fred_units', 'pc1'
)
WHERE id = 'US_CPI_YOY';

-- China real GDP growth rate previous period (OECD MEI; 2025: 5.0)
-- https://fred.stlouisfed.org/series/NAEXKP01CNA657S
UPDATE public.metrics
SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01CNA657S')
WHERE id = 'CN_GDP_GROWTH_YOY';

-- India real GDP growth rate previous period (OECD MEI; 2025: 7.53).
-- Replaces dead metadata.fred_id 'INDNGDPRPCH' (404 on FRED 2026-08-01).
-- https://fred.stlouisfed.org/series/NAEXKP01INA657S
UPDATE public.metrics
SET metadata = metadata || jsonb_build_object('fred_id', 'NAEXKP01INA657S')
WHERE id = 'IN_GDP_GROWTH_YOY';

-- ---------------------------------------------------------------------------
-- Step 2: Deactivate metrics with no clean single-series path
-- ---------------------------------------------------------------------------

-- GDP_NOMINAL_TN unit is "USD tn" / "USD Trillion". FRED World Bank mirrors
-- (MKTGDP{ISO2}A646NWDB) publish Current U.S. Dollars (full dollars, e.g.
-- US 2025: 30,769,700,000,000). ingest-fred has no scale_factor; wiring raw
-- MKTGDP would write 1e13-scale values into a trillions metric. BEA GDP is
-- Billions of Dollars — still not trillions. Deactivate rather than mis-scale.
-- (Task 5 already covers *_GDP_NOMINAL_USD siblings where those IDs exist.)
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'Metric unit is USD trillions; FRED MKTGDP{ISO2}A646NWDB is current USD (full dollars) and BEA GDP is billions — ingest-fred has no scale_factor. Fabricated source (ingest-major-economies) removed 2026-08-01. Prefer *_GDP_NOMINAL_USD family or add scaled ingest later.'
    )
WHERE id IN (
    'US_GDP_NOMINAL_TN',
    'CN_GDP_NOMINAL_TN',
    'IN_GDP_NOMINAL_TN',
    'JP_GDP_NOMINAL_TN'
);

-- GDP PPP in trillions: no clean single FRED series in USD tn; PWT/IMF PPP
-- series are levels (millions/international $) requiring scale + concept map.
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'No clean single FRED series for GDP PPP in USD trillions. Fabricated source (ingest-major-economies) removed 2026-08-01 pending real PPP integration.'
    )
WHERE id IN (
    'US_GDP_PPP_TN',
    'CN_GDP_PPP_TN',
    'IN_GDP_PPP_TN',
    'JP_GDP_PPP_TN'
);

-- BoJ policy rate: OECD IRSTCB01JPM156N exists but ends Dec 2023 (discontinued
-- on FRED as of 2026-08-01 verification). No live free replacement this pass.
UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'OECD FRED series IRSTCB01JPM156N ends Dec 2023 (discontinued). Fabricated source (ingest-major-economies) removed 2026-08-01; no live free BoJ policy-rate series on FRED this pass.'
    )
WHERE id = 'JP_POLICY_RATE';

-- ---------------------------------------------------------------------------
-- Step 3: Metrics left active with other writers (no major-economies write)
-- CN_POLICY_RATE  → ingest-china-macro / ingest-pboc-liquidity
-- IN_POLICY_RATE  → ingest-currency-wars alias of IN_REPO_RATE
-- OECD IRSTCB01{CN,IN}M156N series end late-2023 — do NOT assign as fred_id.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Step 4: Unschedule monthly cron (function is a documented no-op)
-- ---------------------------------------------------------------------------
SELECT cron.unschedule('ingest-major-economies-monthly');
