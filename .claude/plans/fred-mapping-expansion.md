# FRED Mapping Expansion Plan for Country Metrics

## Context

GraphiQuestor's `ingest-country-metrics` Edge Function currently uses FRED data for:
- **FX Reserves (ex-gold)**: `fx_reserves_bn` - covered for 12 countries (US, CN, JP, GB, DE, FR, IT, CA, AU, BR, RU, KR)
- **2Y Sovereign Yields**: `yield_2y_pct` - covered for US, CN only
- **10Y Sovereign Yields**: `yield_10y_pct` - covered for US, CN only

**Goal**: Expand FRED coverage to as many of the 39 target countries as possible for:
1. `fx_reserves_bn` - highest priority (FRED has broad coverage)
2. `yield_2y_pct`, `yield_10y_pct` - medium priority (developeds + some EMs)
3. Potentially `central_bank_rate_pct` (if available via FRED)

**Constraints**:
- Maintain strict live API policy: no mock/static fallbacks
- Handle FRED rate limits (~50 req/min for free API key)
- Graceful degradation when series doesn't exist for a country
- Confidence = 0.9 for all FRED-sourced values

---

## Research Phase: FRED Series Discovery

### FRED Series Naming Conventions

**1. Total Foreign Exchange Reserves (excluding gold)**
- Pattern: `TRESEG{CountryCode}M052N`
- Coverage: Extensive - most G20 + many EMs
- Source: IMF + national central banks via FRED
- Units: Millions USD (need conversion to Billions: ÷1000)
- Frequency: Monthly
- Example: US → `TRESEGUSM052N`, Germany → `TRESEGDEM052N`

**Potential Coverage**: ~30-35 of our 39 countries likely have this series.

**2. Sovereign Yields (Government Bond Yields)**

**2Y Maturities**:
- US: `DGS2` (Daily Treasury Yields)
- China: `INTDSRCNM024N` (IFS 2-year)
- Euro Area: `IRLTLT02DEM156N` (2Y German Bund) or ECB series
- Japan: `IRLTLT02JPM156N` (2Y JGB)
- UK: `IRLTLT02GBM156N` (2Y Gilts)
- Others may use: `INTDSR{CountryCode}M{Months}N` pattern from IFS

**10Y Maturities**:
- US: `DGS10`
- China: `INTDSRCNM193N` (10Y)
- Euro Area: `IRLTLT03DEM156N` (10Y Bund - note: 10Y is often 3Y in some naming? Need verify)
- Japan: `IRLTLT03JPM156N` (10Y JGB - similarly)
- Pattern may vary: Some use `IRLTLT03` for 10Y, others `GOVY10`

**Strategy**: Research each country individually via FRED website/API search.

**3. Policy Rates (Central Bank Rates)**
- FRED has many policy rates but naming inconsistent
- US: `FEDFUNDS` (Fed Funds)
- EU: `ECBINSTMR` (ECB deposit facility rate)
- UK: `BOERUKR` (Bank of England)
- JP: `Japanese Policy Rate` (may need to search)
- Many countries: `IR{CountryCode}B...` patterns exist but not guaranteed

**Recommendation**: Skip policy rates for now; focus on yields which have more standardized IFS coverage.

---

### Target Country Coverage Matrix

| Country | FX Reserves (TRESEG?) | 2Y Yield | 10Y Yield | Notes |
|---------|----------------------|----------|-----------|-------|
| US | ✅ TRESEGUSM052N | ✅ DGS2 | ✅ DGS10 | Complete |
| GB | ✅ TRESEGGBM052N | ? IFS/UK | ? IFS/UK | UK uses IFS series |
| DE | ✅ TRESEGDEM052N | ? Bund 2Y | ? Bund 10Y | Euro area member |
| FR | ✅ TRESEGFRM052N | ? | ? | Use ECB/EU series |
| IT | ✅ TRESEGITM052N | ? | ? | ECB/EU |
| JP | ✅ TRESEGJPM052N | ? IRLTLT02JPM | ? IRLTLT03JPM | Verify JGB series |
| CA | ✅ TRESEGCAM052N | ? | ? | Canada may have DGS-like |
| AU | ✅ TRESEGAUM052N | ? | ? | Australia |
| BR | ✅ TRESEGBRM052N | ? | ? | Brazil |
| AR | ? TRESE?AR? | ? | ? | Argentina uncertain |
| MX | ? TRESE?MX? | ? | ? | Mexico likely |
| CN | ✅ TRESEGCNM052N | ✅ INTDSRCNM024N | ✅ INTDSRCNM193N | Complete |
| IN | ? Need research | ? | ? | India via RBI DBIE currently |
| KR | ✅ TRESEGKRM052N | ? | ? | South Korea |
| ID | ? TRESE?ID? | ? | ? | Indonesia uncertain |
| SA | ? TRESE?SA? | ? | ? | Saudi Arabia likely |
| TR | ? TRESE?TR? | ? | ? | Turkey |
| RU | ✅ TRESEGRUM052N | ? | ? | Russia (sanctions may affect) |
| ZA | ? TRESE?ZA? | ? | ? | South Africa |
| SG | ? TRESE?SG? | ? | ? | Singapore |
| CH | ? TRESE?CH? | ? | ? | Switzerland |
| TH | ? TRESE?TH? | ? | ? | Thailand |
| MY | ? TRESE?MY? | ? | ? | Malaysia |
| AE | ? TRESE?AE? | ? | ? | UAE |
| QA | ? TRESE?QA? | ? | ? | Qatar |
| IL | ? TRESE?IL? | ? | ? | Israel |
| CL | ? TRESE?CL? | ? | ? | Chile |
| NL | ✅ Netherlands likely | ? | ? | Check naming |
| ES | ✅ Spain likely | ? | ? | ECB member |
| VN | ? Vietnam | ? | ? | Uncertain |
| PH | ? Philippines | ? | ? | Uncertain |
| EG | ? Egypt | ? | ? | Uncertain |
| NG | ? Nigeria | ? | ? | Uncertain |
| KW | ? Kuwait | ? | ? | Uncertain |
| NO | ✅ Norway likely | ? | ? | Check |
| SE | ✅ Sweden likely | ? | ? | Check |
| PL | ✅ Poland likely | ? | ? | Check |
| GR | ✅ Greece likely | ? | ? | ECB |
| IE | ✅ Ireland likely | ? | ? | ECB |

**Research Required**: For uncertain countries, we need to:
1. Query FRED API with probable series IDs
2. Search FRED catalog programmatically or manually
3. Document which series exist and which don't

---

## Phase 1: FRED Series Discovery (Manual Research)

### Method 1: FRED API Search (Programmatic)

Create a one-off investigation script:

```typescript
// scripts/discover_fred_series.ts
const countries = ['IN', 'MX', 'AR', 'ID', 'SA', 'TR', 'ZA', 'SG', 'CH', ...];

async function searchReservesSeries(iso: string) {
  const seriesId = `TRESEG${iso}M052N`;
  const url = `https://api.stlouisfed.org/fred/series/series?series_id=${seriesId}&api_key=${FRED_API}&file_type=json`;
  const res = await fetch(url);
  const data = await res.json();
  return data.series || null;
}

async function searchYieldSeries(iso: string, tenor: string) {
  // Try patterns: DGS*, INTDSR{ISO}M{Months}N, IRLTLT{?}{ISO}M156N
}
```

### Method 2: Manual Verification

Use FRED website search:
- Search "Total Reserves Excluding Gold for {Country}"
- Search "Government Bond Yield {Country} {Tenor}"
- Record series IDs, frequency, units, start date

---

## Phase 2: Implementation Plan

### Step 1: Expand `FRED_SERIES_MAP` with Verified Series

**File**: `supabase/functions/ingest-country-metrics/index.ts`

**Target**: Add entries for all 39 countries where FRED series exist:

```typescript
const FRED_SERIES_MAP: Record<string, Record<string, string>> = {
  fx_reserves_bn: {
    // Existing 12 keep
    // Add new verified countries:
    // 'IN': 'TRESEGINM052N', // if exists
    // 'MX': 'TRESEGMXM052N',
    // ... etc
  },
  yield_2y_pct: {
    // Expand from 2 to many:
    // 'US': 'DGS2',
    // 'GB': 'IRLTLT02GBM156N', // UK 2Y
    // 'DE': 'IRLTLT02DEM156N', // Germany 2Y
    // 'FR': 'IRLTLT02FRM156N',
    // 'JP': 'IRLTLT02JPM156N',
    // ...
  },
  yield_10y_pct: {
    // Similarly expanded
  }
};
```

**Unit Conversions**: Already handled (FX reserves ÷1000, yields as % directly).

---

### Step 2: Add Batch Rate Limiting

FRED free API: ~50 req/min. We'll have up to 39 countries × 3 metrics = ~117 requests per ingestion.

**Strategy**: Keep existing batching pattern (already processes countries sequentially per metric). That's:
- For each metric key (3 keys), loop all countries → 3 × batchSize patterns.

This stays within rate limits if we add small delays between countries if needed.

**Optional**: Add 100ms delay after every 10 requests:

```typescript
const FRED_BATCH_DELAY_MS = 100;
let requestsInCurrentBatch = 0;
...
if (requestsInCurrentBatch++ >= 10) {
  await new Promise(r => setTimeout(r, FRED_BATCH_DELAY_MS));
  requestsInCurrentBatch = 0;
}
```

---

### Step 3: Add Missing Series to `DERIVED_METRICS` (if needed)

Currently only `yield_slope_2s10s` derived. If we want other derived metrics (e.g., `import_coverage_months` from fx_reserves and import data), add here.

---

### Step 4: Logging and Monitoring

Enhance logging to report:
- Total FRED requests made
- Success rate per metric
- Countries not covered (missing series)

Example:

```typescript
console.log(`[FRED] Fetched fx_reserves_bn: ${successCount}/${COUNTRIES.length} countries`);
console.log(`[FRED] Missing series: ${missingCountries.join(', ')}`);
```

---

### Step 5: Deploy and Test Incrementally

1. **Staging test**: Deploy with expanded mapping
2. **Manual invoke**: Check logs for errors
3. **Data validation**: Query `country_metrics` to verify new rows
4. **Frontend test**: Visit `/countries/DE`, `/countries/IN`, etc. to see new data

---

## Step 6: Document Coverage

Create `docs/FRED_COVERAGE.md` with a matrix showing:

```
## FRED Series Coverage for Country Metrics

| ISO | fx_reserves_bn | yield_2y_pct | yield_10y_pct | Notes |
|-----|---------------|--------------|---------------|-------|
| US  | ✅ TRESEGUSM052N | ✅ DGS2 | ✅ DGS10 | Full |
| CN  | ✅ TRESEGCNM052N | ✅ INTDSRCNM024N | ✅ INTDSRCNM193N | Full |
| DE  | ✅ TRESEGDEM052N | ✅ IRLTLT02DEM156N | ✅ IRLTLT03DEM156N | Bund yields |
| ... | ... | ... | ... | ... |
```

Helps future maintainers understand what's covered.

---

## Alternative: If FRED Series Missing

For countries without FRED series:
- Keep as "No Data" on frontend (graceful degradation)
- Consider alternative sources (BIS, OECD, national central banks) in future
- Accept that not all 39 countries will have full FRED coverage

---

## Implementation Checklist

- [ ] Research FRED series IDs for all 39 countries (fx_reserves_bn first)
- [ ] Update `FRED_SERIES_MAP` with verified series
- [ ] Add rate limiting (batch delays) if needed
- [ ] Enhance logging to report coverage gaps
- [ ] Deploy to Supabase
- [ ] Manually trigger ingestion and verify logs
- [ ] Query database to confirm data for expanded countries
- [ ] Test frontend: `/countries/{new_iso}`
- [ ] Update `docs/FRED_COVERAGE.md`
- [ ] Commit with detailed message

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| FRED API rate limit exceeded | Add delays between requests; batch size 10 with 100ms pause |
| Series ID doesn't exist for country | Skip gracefully (already coded); log warning |
| Series has insufficient history | Still fetch latest observation; confidence remains 0.9 |
| Units differ from expectation | Verify units in FRED metadata; adjust conversion if needed |
| Network timeouts | `fetchWithRetry` already handles retries (3 attempts) |

---

## Success Criteria

- fx_reserves_bn: coverage expands from 12 → 25+ countries
- yield_2y_pct: coverage expands from 2 → 10+ countries (developed markets priority)
- yield_10y_pct: coverage expands from 2 → 10+ countries
- Ingestion completes in <5 minutes (currently likely <2min)
- No errors requiring manual intervention (all per-country failures caught and logged)
- Frontend displays new data for expanded countries without code changes

---

## Research Resources

- FRED API: https://fred.stlouisfed.org/docs/api/fred/
- Series search: https://fred.stlouisfed.org/search?search_text=TRESEG
- Known patterns:
  - TRESEG* for reserves (IMF IFS)
  - DGS* for US Treasury yields
  - INTDSR* for IFS sovereign yields (China, others?)
  - IRLTLT* for BIS/ECB data (Euro area, UK?)

---

## Technical Notes

- **FRED API Key**: Already stored in Supabase Secrets (`FRED_API_KEY`)
- **Existing Pattern**: Reuse `fetchWithRetry` from `@shared/ingest_utils`
- **Logging**: Already using `runIngestion` with structured logs
- **Database**: Upsert to `country_metrics` with PK `(iso, metric_key)` - no conflicts
- **Frontend**: No changes needed - `CountryProfilePage` already expects these metrics

---

## Optional Future Work

- Add `central_bank_rate_pct` from FRED if reliable series found for many countries
- Add `m1_bn`, `m2_bn` (FRED has M1/M2 for US, maybe others via International Financial Statistics)
- Add `deposit_growth_yoy`, `credit_growth_yoy` if FRED coverage exists
- Pull `cpi_yoy_pct` from FRED instead of IMF to consolidate source (but IMF already works well)

---

**Co-Authored-By**: Claude (expansion plan for FRED mappings)
**Date**: 2025-04-08
