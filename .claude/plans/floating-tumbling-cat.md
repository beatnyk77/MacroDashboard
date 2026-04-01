# Country Pages Dynamic Route Implementation Plan

## Context
GraphiQuestor needs programmatic country pages for SEO and institutional reference. This plan creates the dynamic route template at `/countries/:iso` that displays 33 specific macro metrics for each country, leveraging existing patterns from the codebase.

**Key Discovery**: The codebase is a **Vite-based Single Page Application (SPA)** using **React Router (v7)** for routing. Pages live in `src/pages/`. Next.js patterns (like `getStaticProps`) are not applicable. The UI uses Tailwind CSS with a glassmorphic dark terminal aesthetic, shadcn/ui components, and the existing `MetricCard` component. Data health is managed via `getStaleness` and presence of a `MetricCard` logic.

---

## Architecture Overview

### Data Model (Optimized for Scale)
- **Single table**: `country_metrics` (additive extension to existing schema)
- Columns: `iso` (TEXT), `metric_key` (TEXT), `value` (NUMERIC), `as_of` (DATE), `source` (TEXT), `confidence` (NUMERIC), `last_cron` (TIMESTAMPTZ), `metadata` (JSONB, optional)
- **Primary key**: `(iso, metric_key)` — **Critical optimization**: Since we store only the latest observation per metric per country, this guarantees table size is capped at `#countries × #metrics`. With 40 countries × 33 metrics = **1,320 rows permanent**. Table fits entirely in RAM, lookups are O(1), no secondary index needed.
- **No secondary indexes**: The PK creates the necessary B-tree index. Eliminates `idx_country_metrics_iso_metric` to save write overhead.
- **Upsert strategy**: Use `ON CONFLICT (iso, metric_key) DO UPDATE SET ...` — overwrites previous value with new `as_of`, `value`, `confidence`, `last_cron`. Historical values are not retained (they belong in `metric_observations` for that purpose).
- **Initial scope**: 40 ISOs (G20 + BRICS + 10 key EMs: Singapore, Switzerland, Thailand, Malaysia, Saudi Arabia, UAE, Qatar, Israel, Chile, Indonesia). Keeps daily writes constant at 1,320 rows regardless of time.
- **Expandable**: Future config table `data_sources.country_scope` to add countries without code changes.

### Ingestion Strategy
- New Edge Function: `supabase/functions/ingest-country-metrics/index.ts`
- Sources: IMF (MFS/IFS/WEO), BIS, FRED, Comtrade, World Bank
- Cron schedule: daily via pg_cron (existing pattern: `supabase/migrations/20260324000000_global_refining.sql`)
- Provenance: All records get `provenance = 'api_live'` or fallback to `'fallback_snapshot'`
- Confidence: 0.0-1.0 based on data source reliability and freshness
- Update pattern: Upsert on `(iso, metric_key)` to ensure idempotency

### Page Structure
- Route: `/countries/:iso` (Vite / React Router v7)
- Component: `src/pages/CountryProfilePage.tsx`
- Data Fetching: `@tanstack/react-query` to fetch latest metrics from `country_metrics` via Supabase.
- UI: Uses existing `MetricCard` component in a dense grid layout.
- SEO: `SEOManager` for meta tags and JSON-LD (Country/Dataset schemas).

---

## Implementation Steps

### 1. Database Migration
Create migration: `supabase/migrations/20260402000000_create_country_metrics.sql`

```sql
-- Country-level metrics table (single table for all 33 metrics)
CREATE TABLE IF NOT EXISTS public.country_metrics (
    iso TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    value NUMERIC,
    as_of DATE NOT NULL,
    source TEXT NOT NULL,
    confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
    last_cron TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (iso, metric_key)  -- Optimized: caps table at 1,320 rows; no secondary index needed
);

-- No secondary index: PK creates optimal B-tree on (iso, metric_key)

-- Add GIN index for JSONB metadata if needed later
-- CREATE INDEX idx_country_metrics_metadata ON public.country_metrics USING gin (metadata);

COMMENT ON TABLE public.country_metrics IS 'Latest country-level macro metrics for programmatic SEO pages. Stores only current value per metric per country; historical data lives in metric_observations.';
COMMENT ON COLUMN public.country_metrics.iso IS 'ISO 3166-1 alpha-2 country code (e.g., US, IN, CN)';
COMMENT ON COLUMN public.country_metrics.metric_key IS 'Standardized metric identifier (from fixed list of 33 keys)';
COMMENT ON COLUMN public.country_metrics.confidence IS 'Data confidence score 0-1 based on source reliability and freshness';
COMMENT ON COLUMN public.country_metrics.last_cron IS 'Timestamp of last successful cron update for this record';

-- Enable RLS if needed (likely service role only)
-- ALTER TABLE public.country_metrics ENABLE ROW LEVEL SECURITY;
```

### 2. Ingestion Edge Function
Create: `supabase/functions/ingest-country-metrics/index.ts`

**Approach**: Single function that fetches all 33 metrics for all countries from multiple sources in parallel batches.

**Initial country list (40 ISOs)**:
```ts
const COUNTRIES = [
  // G20 (20)
  'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA','EU',
  // BRICS overlap already covered; remaining key EMs (10)
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES'
];
```
Note: EU treated as aggregate entity; adjust as needed. **Post-V1**: May remove if data quality inconsistent (IMF treats EU as separate entity but coverage may vary).

**Write optimization**: Aggregate all metric rows in memory and perform a **single bulk upsert** at the end:
```ts
const allRows: CountryMetric[] = [];
// ...push to allRows from each source
await supabase
  .from('country_metrics')
  .upsert(allRows, { onConflict: 'iso, metric_key' });  // Single DB call
```
This reduces connection overhead and ensures atomic update of all 1,320 rows.

**Sources mapping**:
- IMF (MFS/IFS/WEO): GDP, CPI, population, reserves, debt
- BIS: Central bank rates, debt ratios, yield curves
- FRED: US-specific metrics (debt/gold, m1/m2, yield curve)
- Comtrade: Import dependency, top partner share
- World Bank: Area, population, energy import, etc.

### Data Feasibility & Metric Selection (Critical)

**Scope decision**: Reduce from 42 to **Top 33 metrics** by dropping lowest-signal / highest-gap items:
- `military_exp_gdp_pct` — niche, low decision value, infrequent reporting
- `credit_rating` — no free bulk source (paid agency feeds only)
- `fx_reserves_crypto` — almost never reported (El Salvador exception)
- `fx_reserves_others_pct` — redundant given USD share and total reserves

**Realistic availability of 33 metrics from public sources**:

| Metric Category | Source | Feasibility | Notes |
|-----------------|--------|-------------|-------|
| **Header** (name, iso, flag) | Local | ✅ 100% | ISO codes from static mapping, flag emojis from Unicode |
| **Basics** (area, population) | World Bank / UN | ✅ High | WB World Development Indicators: area (100%), population (100% but 1-2 year lag) |
| **Macro Heartbeat** | | | |
| - gdp_yoy_pct | IMF WEO | ✅ High | Quarterly updates, ~60-90 day lag for most countries |
| - cpi_yoy_pct | IMF WEO / National | ✅ High | Monthly for G20, quarterly for others |
| - m1_bn, m2_bn | IMF MFS | ⚠️ Partial | Coverage: G20 + major economies only; many EMs missing |
| - central_bank_rate_pct | BIS / ECB / Fed | ✅ High | Daily for major, monthly for others |
| - deposit_growth_yoy | IMF MFS | ⚠️ Partial | Banking sector deposit data spotty outside G20 |
| - credit_growth_yoy | BIS / IMF | ⚠️ Partial | Bank credit data available for ~60 countries |
| - ca_gdp_pct | IMF WEO / IFS | ✅ High | Current account % GDP, annual/quarterly |
| - fx_reserves_bn | IMF COFER / IFS | ✅ High | Monthly for 140+ countries |
| - debt_gold_ratio | Custom calc | ⚠️ Partial | FX reserves (gold component) from IMF + debt stock from WB/IMF; gold valuation requires monthly price |
| - unemployment_pct | IMF WEO / ILOSTAT | ✅ Medium | Annual for most; monthly only for G7 |
| - industrial_prod_yoy | IMF WEO / Nat'l | ✅ Medium | Monthly for G20, quarterly/ annual for others |
| **Financial Stability** | | | |
| - household_debt_gdp_pct | BIS / WB Financial | ⚠️ Partial | BIS covers ~40 countries; WB has some proxies |
| - debt_gdp_pct | IMF WEO / WB | ✅ High | General government debt/GDP, annual |
| - external_debt_gdp_pct | IMF WEO / WB | ✅ Medium | ~120 countries reported, 1-2 year lag |
| - fiscal_balance_gdp_pct | IMF WEO | ✅ High | General government net lending/borrowing |
| - military_exp_gdp_pct | SIPRI | ⚠️ Partial | Annual, ~130 countries, 1-2 year lag |
| - credit_rating | Agencies (Moody's/S&P/Fitch) | ⚠️ Partial | Only ~100 sovereigns rated; others need proxy or "unrated" |
| **Debt Maturity Wall** | | | |
| - debt_outstanding_bn | IMF WEO / Nat'l | ⚠️ Partial | Government debt stock exists; granular maturity buckets **NOT AVAILABLE** via APIs for most countries |
| - short_term_debt_pct | National treasuries | ❌ Very Low | Only US, UK, JP publish detailed maturity profiles; others require scraped central bank reports |
| - medium_term_pct | Same | ❌ Very Low | |
| - long_term_pct | Same | ❌ Very Low | |
| **Yield Curve** | | | |
| - yield_2y, 5y, 10y, 30y | Trading Economics / Nat'l | ⚠️ Partial | G7 + ~20 other developed markets; emerging markets often only have 10Y benchmarks |
| - slope_2s10s | Derived | ⚠️ Partial | Same coverage as above |
| **Import Dependency** | | | |
| - energy_import_pct_gdp | World Bank / IEA | ✅ Medium | WB has energy imports net (% energy use) for ~130 countries |
| - oil_import_dependency_pct | IEA / Comtrade | ⚠️ Partial | IEA data limited; Comtrade requires heavy aggregation |
| - top_partner_share_pct | Comtrade | ✅ High | Custom aggregation but doable via HS6 data |
| - strategic_reserves_days | IEA / National | ❌ Very Low | Only IEA members report SPR; data not in APIs |
| - import_coverage_months | Derived | ⚠️ Partial | FX reserves / monthly imports; both components available |
| **Reserves & West-vs-East** | | | |
| - fx_reserves_gold_tonnes | IMF COFER / IFS | ✅ High | Gold holdings reported monthly for 140+ countries |
| - fx_reserves_usd_share_pct_approx | IMF COFER | ✅ Medium | COFER reports currency composition for major holders only |
| - fx_reserves_crypto | None | ❌ Impossible | No central bank reports on-chain holdings (El Salvador exception) |
| - fx_reserves_others_pct | IMF COFER | ⚠️ Partial | COFER breaks down: USD, EUR, GBP, JPY, CNY, "other" for top holders |
| - brics_alignment_score | Custom | ⚠️ Partial | Derived from SWAP lines, gold addition, USD share reduction; requires custom calculation |

**Overall Feasibility with 40-country scope**:
- **High coverage (23/33)**: Basics, headline macro (GDP, CPI, unemployment, CA, debt-GDP, reserves, CB rates) — 90%+ coverage for G20+key EMs via IMF/WB/BIS
- **Partial coverage (7/33)**: M1/M2, credit growth, household debt, yield curves, import coverage — 60-80% depending on data source availability
- **Sparse (3/33)**: Debt maturity buckets, oil_import_dependency, brics_alignment_score — <50% coverage; will show `null` with low confidence for many

**Implementation priority**:
1. **V1 (launch)**: All 33 metrics with live API ingestion where available; `null` + low confidence where unavailable. Page shows "No Data" gracefully.
2. **V2 (optimization)**: Expand country list to 60-80 ISOs after monitoring row volume and API quotas.
3. **Future**: Add derived metrics (e.g., `30d_liquidity_delta` from existing global net liquidity feed) without new ingestion.

**Fallback strategy**: For any metric where API returns null for a country, insert `null` value with `source = 'fallback_missing'` and `confidence = 0.1`. Page renders "No Data" badge via MetricCard null handling.

**Rate limiting & gaps handling**:
- Batch countries (10-15 per batch) with 1-2 second delays between batches to respect API rate limits
- Exponential backoff with jitter (re-use pattern from existing Edge Functions like `ingest-imf/index.ts`)
- Confidence scoring: 0.9 for direct API, 0.7 for recent estimation, 0.3 for proxied/snapshot, 0.1 for missing
- Retry logic: 3 attempts with increasing delays (2s, 5s, 10s), then mark as fallback

---

### Shared Constants

To avoid duplication and ensure type safety, define the canonical list of 33 metric keys in a shared module:

**File**: `src/lib/macro-metrics.ts` (or `src/constants/countryMetrics.ts`)

```ts
export const COUNTRY_METRIC_KEYS: Readonly<string[]> = [
  // Header (computed, not stored)
  // 'name', 'iso', 'flag_emoji', 'regime_badge', '30d_liquidity_delta' — derived at render time

  // Basics
  'area_sqkm',
  'population_mn',

  // Macro Heartbeat (11)
  'gdp_yoy_pct',
  'cpi_yoy_pct',
  'm1_bn',
  'm2_bn',
  'central_bank_rate_pct',
  'deposit_growth_yoy',
  'credit_growth_yoy',
  'ca_gdp_pct',
  'fx_reserves_bn',
  'debt_gold_ratio',
  'industrial_prod_yoy',

  // Financial Stability (5)
  'household_debt_gdp_pct',
  'debt_gdp_pct',
  'external_debt_gdp_pct',
  'fiscal_balance_gdp_pct',
  'unemployment_pct',

  // Debt Maturity Wall (3)
  'debt_outstanding_bn',
  'short_term_debt_pct',
  'medium_term_pct', // long_term_pct = 1 - short - medium (derived)

  // Yield Curve (5)
  'yield_2y',
  'yield_5y',
  'yield_10y',
  'yield_30y',
  'slope_2s10s',

  // Import Dependency & Energy (4)
  'energy_import_pct_gdp',
  'oil_import_dependency_pct',
  'top_partner_share_pct',
  'import_coverage_months',

  // Reserves & West-vs-East (3)
  'fx_reserves_gold_tonnes',
  'fx_reserves_usd_share_pct_approx',
  'brics_alignment_score',
] as const;

export type CountryMetricKey = typeof COUNTRY_METRIC_KEYS[number];
```

This constant is used by:
- Edge Function: to iterate through all keys when fetching/storing
- Page component: to map `metric_key` → card display config (label, unit, format)
- Validation: TypeScript ensures all 33 keys are accounted for

---

### 2. Ingestion Edge Function
Create: `supabase/functions/ingest-country-metrics/index.ts`

**Approach**: Single function that fetches all 33 metrics for all countries from multiple sources in parallel batches.

**Write optimization**: Aggregate all metric rows in memory and perform a **single bulk upsert** at the end:
```ts
const allRows: CountryMetric[] = [];
// ...push to allRows from each source
await supabase
  .from('country_metrics')
  .upsert(allRows, { onConflict: 'iso, metric_key' });  // Single DB call
```
This reduces connection overhead and ensures atomic update of all 1,320 rows.

**Cron schedule**: Add to `supabase/migrations/20260402000001_country_metrics_cron.sql`

```sql
SELECT cron.schedule(
  'ingest-country-metrics-daily',
  '0 3 * * *', -- 3 AM UTC daily
  $$
    SELECT net.http_post(
      'https://your-project.functions.supabase.co/ingest-country-metrics',
      '{}',
      '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
    )
  $$
);
```

### 3. React Page Component
File: `src/pages/CountryProfilePage.tsx`

**Structure**:
- Get `iso` from `useParams<{ iso: string }>()`.
- Fetch all metrics using `useQuery` from `country_metrics`.
- Map source-specific `metric_key` to display configurations.
- Group metrics into logical terminal sections (Basics, Macro Heartbeat, etc.).
- Use `SEOManager` for titles/meta.

**Integration**:
- Add `<Route path="/countries/:iso" element={<CountryProfilePage />} />` to `src/App.tsx`.
- Update legacy `/countries` redirect in `App.tsx` if needed, or point it to a new index.

Country schema.org + BreadcrumbList + Dataset for the country page
**Pilot data**: Pre-seed USA metrics to validate rendering

**Performance guarantee**: With ISR + `fallback: false`, Next.js serves static HTML from CDN for 99% of requests. Database hit only once per country per `revalidate` interval (1h). Crawlers and traffic spikes do **not** hit the DB.

### 4. Pilot Implementation (USA)
Seed data for USA across all 33 metrics with realistic recent values (from live APIs or realistic fallbacks).
Validate:
- Page renders without errors
- All 33 metrics appear with correct formatting
- Data health badges show appropriate status
- SEO metadata renders correctly
- JSON-LD validates with Google Rich Results Test
- ISR works: edit a metric value, verify page updates within 1 hour (or force with `next build && next export` for full static)

---

## Verification & Testing

1. **Database**: Run migration, verify `country_metrics` table created with correct constraints and indexes
2. **Ingestion**: Manually invoke Edge Function, check rows inserted for USA, verify `confidence` and `last_cron` populated (expect ~30-33 rows for USA)
3. **Page development**: 
   - Create `src/pages/CountryProfilePage.tsx`
   - Test with USA (`/countries/USA`)
   - Check React DevTools for warnings
   - Verify no TypeScript errors on build
4. **SEO validation**:
   - View page source, confirm JSON-LD scripts present
   - Test SEOManager output with Google Rich Results Test
   - Verify canonical URL and Open Graph tags
5. **Data health**: Trigger stale condition (set old `as_of`), verify DEGRADED banner appears
6. **Responsive**: Check mobile layout (1 column), tablet (2-3 columns), desktop (4-6 columns)
7. **Coverage check**: Verify that out of 33 metrics, at least 25 show actual values (not "No Data") for USA; others may be legitimately unavailable (e.g., `m1_bn` for non-USD country? Actually USA should have full coverage)

---

## Critical Files to Create/Modify

1. **NEW**: `supabase/migrations/20260402000000_create_country_metrics.sql`
2. **NEW**: `supabase/functions/ingest-country-metrics/index.ts`
3. **NEW**: `supabase/migrations/20260402000001_country_metrics_cron.sql`
4. **NEW**: `src/pages/CountryProfilePage.tsx`
5. **UPDATE**: `src/App.tsx` (Add route)
6. **NEW**: `src/lib/macro-metrics.ts` (shared constant `COUNTRY_METRIC_KEYS`)
7. **OPTIONAL**: Seed script `scripts/seed-country-metrics.ts` (one-time)
8. **UPDATE**: If needed, extend `src/lib/supabase.ts` with TypeScript types for `country_metrics`

---

## Constraints & Quality Gates

- **Additive only**: No refactoring of existing modules or components
- **Real data only**: Ingestion must fetch from live APIs; fallbacks acceptable with `provenance = 'fallback_snapshot'` and lower confidence
- **Dark terminal aesthetic**: Preserve glassmorphic styles, monospace fonts for numbers, subtle borders
- **Minimal Supabase footprint**: Single table, focused indexes
- **Data health**: Use `getStaleness` hook; flag degraded pages when metrics are stale
- **Performance**: Page must load < 2s (use Suspense boundaries, lazy load non-critical sections if needed)
- **SEO**: JSON-LD structured data mandatory; unique title/description per country

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| DB load from traffic spikes | **ISR with `revalidate`** serves static HTML from CDN; DB hit only once per country per hour, regardless of traffic volume |
| Table size blowup | **PK on (iso, metric_key)** caps table at 1,320 rows permanently. No secondary indexes. |
| API rate limits (IMF ~50 req/min, BIS slower) | Batch countries (10-15 per batch), add 1-2s delay between batches; use existing caching patterns in Edge Functions |
| Missing data for target 40 countries | Accept `null` values with `confidence = 0.1`; 95%+ coverage expected for core metrics (GDP, CPI, reserves, debt) |
| Schema evolution (add new metrics later) | Keep table narrow; we can add new `metric_key` values without schema change. Use `metadata` JSONB for any per-metric extra dimensions. |
| Ingestion takes too long (> 5 min) | Parallelize within batches; set function timeout to 10 min; **single bulk upsert** reduces DB connection overhead; expect ~2-3 min total |
| Supabase write quota exceeded | 1,320 rows/day is tiny (< 0.1% of typical free tier quota). No issue. |

---

## Decision Log

- **Single table vs normalized**: Single table `country_metrics` (EAV-like) for simplicity. Metric keys fixed at app level; no separate definitions table needed.
- **Latest only vs time series**: Store only latest `as_of` per metric per country. Historical data already in `metric_observations`. **PK on (iso, metric_key)** caps table at 1,320 rows permanently.
- **Cron vs on-demand ingestion**: Daily cron at 3 AM UTC to keep data fresh. Manual trigger available via Supabase Functions UI.
- **Page Router vs App Router**: Used existing Pages Router pattern (`src/pages/`) consistent with codebase.
- **Rendering strategy**: **ISR with `getStaticProps` + `revalidate`** (not SSR). Serves static HTML from CDN, protects DB from traffic spikes.
- **MetricCard reuse**: Existing `MetricCard` component already supports staleness, deltas, sparklines — no new UI needed.
- **Metric count reduction**: From 42 to 33 to focus on high-signal, feasible data. Dropped: `military_exp_gdp_pct`, `credit_rating`, `fx_reserves_crypto`, `fx_reserves_others_pct`.
- **Country scope**: 40 ISOs (G20 + BRICS + 10 key EMs) to keep row volume manageable and ensure 95%+ coverage.
- **Expansion path**: Config table `data_sources.country_scope` for future country additions without code changes.
- **Gap handling**: Accept `null` values with low `confidence`; page shows "No Data" gracefully.
- **Rate limiting**: Batch countries (10-15), exponential backoff (reuse existing patterns).
- **Write optimization**: **Single bulk upsert** for all 1,320 rows in Edge Function — reduces DB connection overhead to 1 call per ingestion.

---

## Success Criteria

- [ ] Migration executed; table created with PK on (iso, metric_key); verify row count = 1,320 max
- [ ] Edge Function runs successfully, inserts data for all 40 countries in a single bulk upsert
- [ ] `/countries/USA` renders all 33 metrics in < 2s
- [ ] Coverage check: At least 25/33 metrics show real values for USA; others show "No Data" with low confidence
- [ ] ISR works: page rebuilds in background within 1 hour after data refresh; CDN serves static HTML
- [ ] DB read load: Verify `pg_stat_statements` shows < 1 query/sec for country pages under normal traffic
- [ ] All metrics display staleness badge appropriate to source freshness
- [ ] JSON-LD validates with Google Rich Results Test
- [ ] Page passes Lighthouse accessibility audit (min 90)
- [ ] Build passes (`npm run build`) without warnings
- [ ] No existing tests broken (if any)
- [ ] No existing tests broken (if any)