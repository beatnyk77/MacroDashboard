# Country Pages Ingestion Completion Plan

## Context & Current State

GraphiQuestor needs programmatic country pages with real macro data for ~39 countries. The infrastructure is partially built:

**Already Complete:**
- ✅ Database table `country_metrics` with optimal PK (iso, metric_key)
- ✅ Route `/countries/:iso` and `CountryProfilePage.tsx` component
- ✅ `COUNTRY_METRIC_GROUPS` constant with 23 metric definitions across 6 sections
- ✅ Edge Function stub `ingest-country-metrics` that fetches 8 metrics from IMF+WB
- ✅ Cron schedule (weekly Sunday 2am)
- ✅ MetricCard component with staleness, deltas, sparklines

**Status:** Ingestion is partial (8/23 metrics). Need to expand to cover a curated set of ~15 high-signal metrics with real API data, no mocks.

---

## Scope Decision (Based on User Input)

**Target:** 15–16 total metrics (including derived). Focus on high-signal, feasible via free public APIs.

**Strategy:** Drop low-feasibility or low-priority metrics:
- central_bank_rate_pct (no comprehensive free API)
- deposit_growth_yoy, credit_growth_yoy (spotty coverage)
- debt_maturity wall metrics (unavailable)
- oil_import_dependency_pct, top_partner_share_pct (complex/commercial)
- usd_reserve_share_pct, brics_alignment_score (sparse)
- military_exp_gdp_pct (low decision value)
- yield_5y_pct, yield_5y, yield_30y (coverage limited); keep 2Y & 10Y + slope
- area_sq_km retained as static baseline

**Final Metric Set (14 direct + 1 derived = 15 total):**

| # | Metric Key | Source | Indicator | Unit | Transform |
|---|------------|--------|-----------|------|-----------|
| 1 | population_mn | WB | SP.POP.TOTL | Mn | v / 1e6 |
| 2 | area_sq_km | WB | AG.SRF.TOTL.K2 | sq km | identity |
| 3 | gdp_usd_bn | IMF | NGDPD | $Bn | identity |
| 4 | gdp_yoy_pct | IMF | NGDP_RPCH | % | identity |
| 5 | cpi_yoy_pct | IMF | PCPIPCH | % | identity |
| 6 | unemployment_pct | IMF | LUR | % | identity |
| 7 | ca_gdp_pct | IMF | BCA_NGDPD | % | identity |
| 8 | fx_reserves_bn | FRED | country-specific series (e.g., TRESEGUSM052N) | $Bn | v / 1e3 (from Millions USD) |
| 9 | debt_gdp_pct | IMF | GGXWDG_NGDP | % | identity |
|10 | ext_debt_gdp_pct | WB | DT.TDS.DECT.EX.ZS | % | identity |
|11 | fiscal_balance_gdp_pct | IMF | GGXONL_NGDP | % | identity |
12 | energy_import_pct | WB | EG.IMP.CONS.ZS | % | identity |
13 | yield_2y_pct | FRED | country-specific (e.g., DGS2 for US) | % | identity |
14 | yield_10y_pct | FRED | country-specific (e.g., DGS10 for US, INTDSRCNM193N for CN) | % | identity |
|15 (derived) | yield_slope_2s10s | derived | (10Y – 2Y) * 100 | bps | computed after fetch |

**Confidence:** 0.9 for all live API sources (IMF, WB, FRED).

---

## Data Source Mappings

### IMF DataMapper
Endpoint: `https://www.imf.org/external/datamapper/api/v1/{indicator}/{iso}`

Indicators:
- NGDPD: GDP (current prices, US$ billions)
- NGDP_RPCH: GDP growth (%)
- PCPIPCH: CPI inflation (%)
- LUR: Unemployment rate (%)
- BCA_NGDPD: Current account balance (% GDP)
- GGXWDG_NGDP: General government debt (% GDP)
- GGXONL_NGDP: Fiscal balance (% GDP)

Notes: Returns yearly observations; use latest calendar year.

### World Bank API
Endpoint: `https://api.worldbank.org/v2/country/{iso}/indicator/{indicator}?format=json&per_page=1`

Indicators:
- SP.POP.TOTL: Total population
- AG.SRF.TOTL.K2: Surface area (sq km)
- DT.TDS.DECT.EX.ZS: External debt stocks (% of GNI)
- EG.IMP.CONS.ZS: Energy imports net (% of energy use)

Notes: WB uses GNI for external debt, not GDP; acceptable approximation.

### FRED (Federal Reserve Economic Data)
Endpoint: `https://api.stlouisfed.org/fred/series/observations?series_id={id}&api_key={FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`

Series mapping by country (to be expanded):

**FX Reserves (ex-gold) in Millions USD → convert to $Bn:**
- US: TRESEGUSM052N
- CN: TRESEGCNM052N
- JP: TRESEGJPM052N
- GB: TRESEGGBM052N
- DE: TRESEGDEM052N
- FR: TRESEGFRM052N
- IT: TRESEGITM052N
- CA: TRESEGCAM052N
- AU: TRESEGAUM052N
- BR: TRESEGBRM052N
- RU: TRESEGRUM052N
- KR: TRESEGKRM052N (verify)
- ...others may be added gradually

**Yields (percent):**
- US: DGS2 (2Y), DGS10 (10Y)
- China: INTDSRCNM024N (2Y), INTDSRCNM193N (10Y)
- Euro Area: Use ECB SDW API not FRED; for now skip or later integrate ingest-yield-curves logic
- Others: Limited; accept null

FRED coverage is good for US, China, and many advanced economies; emerging markets may be sparse. Accept null for unsupported.

---

## Implementation Plan

### 1. Refactor `ingest-country-metrics/index.ts`

**Current:** Hard-coded METRIC_CONFIG with 8 entries, separate loops for IMF and WB.

**Update:** Define a unified metric descriptor array:

```ts
interface MetricDescriptor {
  key: string;
  source: 'IMF' | 'WB' | 'FRED';
  indicator: string; // for IMF/WB
  transform?: (val: number) => number;
  // For FRED, we'll need per-country series mapping; handle separately.
}
```

**Implement fetchers:**

- `fetchIMF(indicator: string, iso: string)`: returns latest value and year.
- `fetchWB(indicator: string, iso: string)`: returns latest value and date.
- `fetchFRED(seriesId: string)`: returns latest value and date.

**Add FRED series mapping**:
```ts
const FRED_SERIES_MAP: Record<string, Record<string, string>> = {
  fx_reserves_bn: { US: 'TRESEGUSM052N', CN: 'TRESEGCNM052N', ... },
  yield_2y_pct: { US: 'DGS2', CN: 'INTDSRCNM024N' },
  yield_10y_pct: { US: 'DGS10', CN: 'INTDSRCNM193N' }
};
```

**Loop structure:**
For each country iso in COUNTRIES:
- For each metric descriptor:
  - Choose fetch function based on source.
  - If FRED, look up seriesId for this iso; if not found, skip.
  - On success, transform value to desired units, push to `batchRows` with iso, key, value, as_of (date), source, confidence=0.9.
  - On failure, log warning and continue.

**After direct metrics collected:**
- Group by iso.
- For each iso, if both yield_2y and yield_10y exist, compute `yield_slope_2s10s = (y10 - y2) * 100`, push row (confidence 0.9, as_of date same as 10y).

**Bulk upsert:**
One call to `supabase.from('country_metrics').upsert(batchRows, { onConflict: 'iso, metric_key' })`.

**Notes:**
- Maintain existing `runIngestion` wrapper.
- Re-use `fetchWithRetry` from `@shared/ingest_utils`.
- Use `import.meta.env` for FRED_API_KEY (already exists in other functions). Deno env var: `FRED_API_KEY`.
- Add appropriate comments and logging.

### 2. Optional: Update `src/lib/macro-metrics.ts`

Ensure all 15 metric keys are present in their respective groups. If any are missing (e.g., area_sq_km), add them.

Current macro-metrics.ts only contains 23 keys; our set should be subset, so likely already present. Verify:
- area_sq_km present in BASICS? Yes.
- fx_reserves_bn present in MACRO_HEARTBEAT? Yes.
- ext_debt_gdp_pct present in FINANCIAL_STABILITY? Yes.
- yield_2y_pct, yield_10y_pct, yield_slope_2s10s in YIELD_CURVE? Yes.
All should be there.

If any key mismatches, adjust constants to match ingestion keys exactly.

### 3. Testing & Verification

**Local Dry Run:**
- Deploy the Edge Function locally using `deno task start` or directly to Supabase.
- Manually trigger via Supabase Functions UI or `curl`.
- Check logs: should see processing of 39 countries × ~14 metrics ≈ 546 calls; many will not apply for FRED if series missing → fewer.
- Verify rows inserted: count distinct (iso, metric_key) in `country_metrics`.

**Spot-check USA:**
- Query `country_metrics` for iso='US'. Expect all 15 metrics to have values (assuming FRED series work).
- Check that `yield_slope_2s10s` computed correctly.

**Page validation:**
- Run `npm run dev`, visit `/countries/US`.
- Verify page renders without errors.
- Confirm at least 12-14 of 15 show actual numbers; others (e.g., for countries with gaps) show "No Data".
- Check data health badges (staleness will depend on as_of dates).

**Build & Deploy:**
- `npm run build` should succeed.
- Deploy to Vercel/Netlify.
- Cron remains weekly; data fresh after next run.

**Monitoring:**
- After cron run, query `ingestion_logs` to ensure success.
- Use `check-data-health` function to verify country_metrics freshness.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| FRED API rate limits (100 req/s) | We make ~76 calls for FRED metrics per run (2 metrics × ~39 countries, but many countries lack series). Well below limits. |
| Some countries unavailable in FRED/WB/IMF | Skip gracefully; those metrics remain null with confidence=0.1 (or not inserted). Page shows "No Data" without breaking. |
| IMF DataMapper downtime | `fetchWithRetry` retries 3 times with exponential backoff; failures logged but ingestion continues with other sources. |
| Unit conversion errors | Write explicit transform functions; validate with spot checks (US values). |
| Derived slope inserted with null if either yield missing | Ensure we only insert slope when both values exist. |
| Cron scheduling conflicts | No dependencies on other ingestions; runs independently. |

---

## Implementation Checklist

- [ ] Update `supabase/functions/ingest-country-metrics/index.ts`:
  - [ ] Define expanded metric descriptors with transforms.
  - [ ] Add FRED series mapping object for fx_reserves_bn, yield_2y_pct, yield_10y_pct.
  - [ ] Implement `fetchFRED` helper (uses FRED_API_KEY).
  - [ ] Refactor main loop: per-country, per-metric fetch with switch on source.
  - [ ] Add post-processing to compute `yield_slope_2s10s`.
  - [ ] Single bulk upsert.
- [ ] Verify `src/lib/macro-metrics.ts` includes all 15 keys.
- [ ] Test locally with US and a few other countries.
- [ ] Deploy to Supabase and trigger manually.
- [ ] Validate page `/countries/US`.
- [ ] Confirm cron exists (already in migration).
- [ ] Monitor first automated run.

---

## Out of Scope (Future Work)

- Expand FRED series mapping for more countries.
- Add yield_5y and yield_30y when coverage justifies.
- Integrate more sophisticated sources for central bank policy rates.
- Implement fiscalquarterly updates for higher frequency.
- Add internal brics_alignment_score calculation once base data stable.

---

## Success Criteria

- At least 14 of the 15 direct metrics are ingested for the United States.
- All 39 countries have non-null values for at least 8 metrics (basics + macro).
- `/countries/US` displays concrete data for ≥12 metrics within 2 seconds.
- No build errors; TypeScript passes.
- Cron runs weekly without failure alerts.
