# Priority 1 — Data Staleness Root Cause Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two root causes behind the "22 feeds lagged" header/STALE badge — 62 metrics silently orphaned from FRED ingestion, and 3 edge functions writing fabricated data stamped as live — without inventing any new data.

**Architecture:** Two Postgres migrations recover/correct `metrics.metadata`/`is_active` so the existing, already-tested `ingest-fred` pipeline picks up orphaned metrics automatically on its next scheduled run. Two small edge-function code fixes stop the pipeline from lying to itself and to users. Three fabrication-removal tasks delete hardcoded values from edge functions, keeping only what's redirectable to a real source. One frontend hook rewrite makes the header/chip read the database's already-correct per-metric staleness computation instead of a cruder reimplementation.

**Tech Stack:** Supabase Postgres (migrations, SQL), Deno edge functions (TypeScript), React + TanStack Query (frontend hook), Vitest.

## Global Constraints

- Run `npm run lint && npm run build` after every task's changes — not once at the end.
- No new external dependencies without flagging first.
- Smallest diff that fully fixes each issue — no unrelated refactors.
- No fabricated data, ever: a metric with no verifiable real source gets `is_active = false`, never a placeholder number.
- Every FRED series ID written to `metadata.fred_id` must be verified against FRED's real listings (via WebSearch/WebFetch) before it's written — no guessing from training data.
- Small, focused commits — one concern per commit, mirroring how `caddbe2` (prior data-integrity fix) was structured.
- Supabase project: `debdriyzfcwvgrhzzzre` (`MacroIntelligence_GraphiQuestor`). Use the Supabase MCP tools (`execute_sql`, `apply_migration`) against this project ID for all DB changes — the migration files in `supabase/migrations/` are the source of truth, apply them there too.

---

### Task 1: Recover documented + verified FRED series IDs

**Files:**
- Create: `supabase/migrations/20260801000001_recover_orphaned_fred_metadata.sql`

**Interfaces:**
- Consumes: nothing (new migration)
- Produces: `metrics.metadata->>'fred_id'` populated for 19 metric IDs, immediately picked up by the existing `ingest-fred` function's `WHERE metadata->>'fred_id' IS NOT NULL` filter (`supabase/functions/ingest-fred/index.ts:79`) on its next scheduled run — no code change needed for this task.

- [ ] **Step 1: Write the migration**

All 19 IDs below were confirmed real and currently active by checking FRED's own listings during design (16 were already documented in the metric's own `description` column; 3 — `USD_BRL_RATE`, `USD_MXN_RATE`, `USD_TWD_RATE`, `US_GDP_GROWTH_YOY` — were verified fresh via FRED search).

```sql
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
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__supabase__apply_migration` with `project_id: debdriyzfcwvgrhzzzre`, name `recover_orphaned_fred_metadata`, and the SQL above. Also save the file at the path listed so it's tracked in version control and passes any migration-drift CI check.

- [ ] **Step 3: Verify the write**

Run via `mcp__supabase__execute_sql` against `debdriyzfcwvgrhzzzre`:

```sql
select id, metadata from public.metrics
where id in ('HOUSING_MORTGAGE_RATE_30Y','USD_BRL_RATE','COPPER_GOLD_RATIO','US_GDP_GROWTH_YOY')
order by id;
```

Expected: each row's `metadata` contains the `fred_id` (or `fred_id_numerator`/`fred_id_proxy`) just set.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260801000001_recover_orphaned_fred_metadata.sql
git commit -m "fix(data): recover 19 orphaned FRED metric ID mappings from description"
```

---

### Task 2: Deactivate metrics with no real source

**Files:**
- Create: `supabase/migrations/20260801000002_deactivate_unsourced_metrics.sql`

**Interfaces:**
- Consumes: nothing
- Produces: `is_active = false` on 7 metric IDs, which removes them from `ingest-fred`'s query (`eq('is_active', true)` at `ingest-fred/index.ts:73`) and from any UI surface that filters on `is_active`.

- [ ] **Step 1: Write the migration**

Confirmed during research: China 10Y/2Y government bond yields are not published on FRED (China's own bond market data isn't in FRED's coverage); BIS Global Liquidity Indicators are published only on bis.org, not mirrored to FRED; `BOJ_CURRENT_ACCOUNT_DEPOSITS_TRJPY`/`BOJ_EXCESS_RESERVES_TRJPY`/`BOJ_JGB_HOLDINGS_TRJPY` are not on FRED either, and are distinct from the metric IDs the existing `ingest-boj-balance-sheet` function actually writes (`BOJ_TOTAL_ASSETS_TRJPY`, `BOJ_MONETARY_BASE_TRJPY` — see `supabase/functions/ingest-boj-balance-sheet/index.ts:48-49`), so there is no existing pipeline that could serve them either.

```sql
-- These metrics were registered under source=FRED but no such series exists
-- on FRED. Building a bespoke BIS/BOJ/China-bond-market API client is out of
-- scope for this fix (see design doc non-goals). Deactivating rather than
-- leaving them silently stale forever, per the project's "no fabricated
-- data, show unavailable" rule — a badge showing genuinely nothing is more
-- honest than a badge showing a number that will never update.

UPDATE public.metrics
SET is_active = false,
    metadata = metadata || jsonb_build_object(
        'deactivation_reason',
        'No FRED-published series exists for this indicator; verified via FRED search 2026-08-01. Requires a dedicated BIS/BOJ/China-bond-market integration, tracked as a follow-up, not fabricated.'
    )
WHERE id IN (
    'CN_CGB_YIELD_10Y',
    'CN_CGB_YIELD_2Y',
    'BIS_GLOBAL_LIQUIDITY_USD_BN',
    'BIS_GLOBAL_LIQUIDITY_USD_YOY_PCT',
    'BOJ_CURRENT_ACCOUNT_DEPOSITS_TRJPY',
    'BOJ_EXCESS_RESERVES_TRJPY',
    'BOJ_JGB_HOLDINGS_TRJPY'
);
```

- [ ] **Step 2: Apply via Supabase MCP**

`mcp__supabase__apply_migration`, project `debdriyzfcwvgrhzzzre`, name `deactivate_unsourced_metrics`.

- [ ] **Step 3: Check for frontend references that assume these are always active**

```bash
grep -rn "CN_CGB_YIELD\|BIS_GLOBAL_LIQUIDITY\|BOJ_CURRENT_ACCOUNT_DEPOSITS\|BOJ_EXCESS_RESERVES\|BOJ_JGB_HOLDINGS" src --include="*.tsx" --include="*.ts"
```

If any component renders one of these metric IDs directly (not just via a generic metric list), confirm it already handles a `null`/`no_data` result from `useLatestMetric` gracefully (all of them return `null` on a missing row per `useLatestMetric.ts:34-37`) rather than crashing. Fix inline if not — this is a small, same-scope guard, not a new feature.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260801000002_deactivate_unsourced_metrics.sql
git commit -m "fix(data): deactivate 7 metrics with no verifiable FRED/BOJ source instead of leaving them silently orphaned"
```

---

### Task 3: Stop `ingest-fred` masking zero-observation failures

**Files:**
- Modify: `supabase/functions/ingest-fred/index.ts:168-180`
- Test: `supabase/functions/ingest-fred/index.test.ts` (create if it doesn't exist — check first)

**Interfaces:**
- Consumes: nothing new
- Produces: same `doIngestFred` return shape as before; only the side-effect of *when* `metrics.updated_at` is written changes.

- [ ] **Step 1: Check for an existing test file**

```bash
find supabase/functions/ingest-fred -iname "*.test.ts"
```

If one exists, read it and add a test there following its existing mocking pattern instead of creating a new file. If none exists, this function currently has no test coverage — add the minimal test file below rather than skipping verification.

- [ ] **Step 2: Confirm current (bugged) behavior**

Current code at `ingest-fred/index.ts:168-175`:

```typescript
          if (observations.length > 0) {
            const { error: upsertError } = await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id, as_of_date' });
            if (upsertError) throw upsertError;
            await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
            return { metricId: metric.id, count: observations.length, success: true };
          }
          await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
          return { metricId: metric.id, count: 0, success: true };
```

The second `metrics.update` call (the one outside the `if`) bumps `updated_at` even when zero observations were written — e.g. because the upstream FRED series ID is dead/discontinued and returns no data. This makes the metric look "checked recently" while `metric_observations` never gets a new row, and corrupts the function's own "prioritize stalest first" ordering (`ingest-fred/index.ts:74`, `order('updated_at', { ascending: true })`).

- [ ] **Step 3: Fix it**

Replace lines 168-175 with:

```typescript
          if (observations.length > 0) {
            const { error: upsertError } = await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id, as_of_date' });
            if (upsertError) throw upsertError;
            await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
            return { metricId: metric.id, count: observations.length, success: true };
          }
          // Do NOT bump updated_at here — a 0-observation response usually means
          // the upstream series ID is dead/discontinued or temporarily empty.
          // Bumping updated_at would make it look freshly-checked and would push
          // it to the back of the "prioritize stalest first" queue, hiding the
          // problem indefinitely. Surface it as a soft failure instead.
          return { metricId: metric.id, count: 0, success: false, error: 'FRED returned zero observations' };
```

- [ ] **Step 4: Create/extend the test**

If creating fresh (`supabase/functions/ingest-fred/index.test.ts`), Deno edge functions in this repo are plain TS modules invoked via `serveIngest` — check `supabase/functions/_shared/handler.ts` for how `doIngestFred`-style inner functions are typically unit tested elsewhere in the repo first:

```bash
find supabase/functions -iname "*.test.ts" | head -3
```

Read one of those as the pattern template, then add a case asserting: given a mocked Supabase client where `metrics` select returns one metric with `metadata.fred_id` set, and the mocked `fetch` returns `{ observations: [] }`, the resulting `metrics.update` call for `updated_at` is **not** invoked, and the returned `errors` array contains an entry for that metric.

- [ ] **Step 5: Run the test**

```bash
npx vitest run supabase/functions/ingest-fred/index.test.ts
```
(If this repo's edge functions aren't wired into the Vitest config — check `vitest.config.ts`'s `include`/`exclude` — note that and instead verify by direct code review + the manual invoke in Task 10, rather than blocking on new test infra as an unrelated addition.)

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/ingest-fred/index.ts
git commit -m "fix(ingest-fred): stop marking metrics as updated when FRED returns zero observations"
```

---

### Task 4: Add `COPPER_GOLD_RATIO` and derived `CNY_INR_RATE` as special cases in `ingest-fred`

**Files:**
- Modify: `supabase/functions/ingest-fred/index.ts`

**Interfaces:**
- Consumes: `metric.metadata.fred_id_numerator` / `fred_id_denominator` (set in Task 1) for `COPPER_GOLD_RATIO`; existing fresh `USD_INR_RATE` / `USD_CNY_RATE` rows in `metric_observations` for `CNY_INR_RATE`.
- Produces: new rows in `metric_observations` for `COPPER_GOLD_RATIO` and `CNY_INR_RATE`, following the same shape as the existing `SOFR_OIS_SPREAD` special case (`ingest-fred/index.ts:102-144`).

- [ ] **Step 1: Add the `COPPER_GOLD_RATIO` special case**

Add this branch alongside the existing `SOFR_OIS_SPREAD` special case (after line 144, before the generic path), following the same structure:

```typescript
        // --- Special Case: Copper/Gold Ratio ---
        if (metric.id === 'COPPER_GOLD_RATIO') {
          try {
            const numId = (metric.metadata as any).fred_id_numerator; // PCOPPUSDM
            const denId = (metric.metadata as any).fred_id_denominator; // GOLDAMGBD228NLBM
            const [numRes, denRes] = await Promise.all([
              withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=${numId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'Copper Fetch'),
              withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=${denId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'Gold Fetch')
            ]);

            const numData = await numRes.json() as any;
            const denData = await denRes.json() as any;

            rawPayloads.push({ metricId: 'COPPER_GOLD_RATIO_NUM', data: numData });
            rawPayloads.push({ metricId: 'COPPER_GOLD_RATIO_DEN', data: denData });

            const numObs = numData.observations || [];
            const denMap = new Map(denData.observations?.map((o: any) => [o.date, parseFloat(o.value)]) || []);

            const ratioObservations = numObs
              .map((n: any) => {
                const numVal = parseFloat(n.value);
                const denVal = denMap.get(n.date);
                if (isNaN(numVal) || denVal === undefined || isNaN(denVal as number) || (denVal as number) === 0) return null;
                return {
                  metric_id: 'COPPER_GOLD_RATIO',
                  as_of_date: n.date,
                  value: numVal / (denVal as number),
                  last_updated_at: new Date().toISOString(),
                  provenance: 'api_live'
                };
              })
              .filter((o: any) => o !== null);

            if (ratioObservations.length > 0) {
              const { error: upsertError } = await supabase.from('metric_observations').upsert(ratioObservations, { onConflict: 'metric_id, as_of_date' });
              if (upsertError) throw upsertError;
              await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', 'COPPER_GOLD_RATIO');
              return { metricId: 'COPPER_GOLD_RATIO', count: ratioObservations.length, success: true };
            }
            return { metricId: 'COPPER_GOLD_RATIO', count: 0, success: false, error: 'No overlapping copper/gold observations' };
          } catch (err: any) {
            return { metricId: 'COPPER_GOLD_RATIO', count: 0, success: false, error: err.message };
          }
        }

        // --- Special Case: CNY/INR derived cross-rate (no direct FRED series) ---
        if (metric.id === 'CNY_INR_RATE') {
          try {
            const { data: usdInr } = await supabase
              .from('metric_observations')
              .select('as_of_date, value')
              .eq('metric_id', 'USD_INR_RATE')
              .order('as_of_date', { ascending: false })
              .limit(100);
            const { data: usdCny } = await supabase
              .from('metric_observations')
              .select('as_of_date, value')
              .eq('metric_id', 'USD_CNY_RATE')
              .order('as_of_date', { ascending: false })
              .limit(100);

            const cnyMap = new Map((usdCny || []).map((o: any) => [o.as_of_date, Number(o.value)]));
            const crossObservations = (usdInr || [])
              .map((inr: any) => {
                const inrVal = Number(inr.value);
                const cnyVal = cnyMap.get(inr.as_of_date);
                if (isNaN(inrVal) || cnyVal === undefined || isNaN(cnyVal) || cnyVal === 0) return null;
                return {
                  metric_id: 'CNY_INR_RATE',
                  as_of_date: inr.as_of_date,
                  value: inrVal / cnyVal,
                  last_updated_at: new Date().toISOString(),
                  provenance: 'api_live'
                };
              })
              .filter((o: any) => o !== null);

            if (crossObservations.length > 0) {
              const { error: upsertError } = await supabase.from('metric_observations').upsert(crossObservations, { onConflict: 'metric_id, as_of_date' });
              if (upsertError) throw upsertError;
              await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', 'CNY_INR_RATE');
              return { metricId: 'CNY_INR_RATE', count: crossObservations.length, success: true };
            }
            return { metricId: 'CNY_INR_RATE', count: 0, success: false, error: 'No overlapping USD/INR and USD/CNY dates' };
          } catch (err: any) {
            return { metricId: 'CNY_INR_RATE', count: 0, success: false, error: err.message };
          }
        }
```

- [ ] **Step 2: Guard the generic path from matching these two**

The generic path below (line ~146 in the original) does `const fredId = (metric.metadata as any).fred_id;` — since `COPPER_GOLD_RATIO` and `CNY_INR_RATE` don't have a plain `fred_id` key (only `fred_id_numerator`/`fred_id_denominator`, or nothing), confirm the generic path's `targetMetrics` filter at line 79 (`m.metadata?.fred_id`) naturally excludes `COPPER_GOLD_RATIO` (it has no `fred_id` key) — but `CNY_INR_RATE` also has no `fred_id` key so it's excluded too by the same filter, meaning **neither reaches the generic path and both need their `source_id` to resolve into `targetMetrics` some other way.**

Fix: change the `targetMetrics` filter (line 79) to also include these two special-cased IDs explicitly:

```typescript
    let targetMetrics = metrics?.filter((m: any) =>
      (m.metadata as any)?.fred_id || m.id === 'COPPER_GOLD_RATIO' || m.id === 'CNY_INR_RATE'
    ) || [];
```

- [ ] **Step 3: Run lint and build**

```bash
npm run lint && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ingest-fred/index.ts
git commit -m "feat(ingest-fred): compute COPPER_GOLD_RATIO and derived CNY_INR_RATE from already-fetched FRED series"
```

---

### Task 5: Research and migrate remaining Track 1b metrics

**Files:**
- Create: `supabase/migrations/20260801000003_track1b_gdp_and_remaining_metrics.sql`

**Interfaces:**
- Consumes: nothing
- Produces: `metadata.fred_id` for whichever of the ~27 remaining metrics have a verified real source, `is_active = false` (with `metadata.deactivation_reason`) for the rest.

This task covers: 14× `{CC}_GDP_GROWTH_YOY` (AR, AU, BR, CA, DE, FR, ID, IT, KR, MX, SA, TR, UK, ZA), 13× `{CC}_GDP_NOMINAL_USD` (same countries minus one already confirmed if found — see procedure), `US_GFCF_GDP_PCT`, `US_PRIVATE_GFCF_GDP_PCT`, `CAPITAL_FROM_EM_DEBT_BN`, `CAPITAL_FROM_GOLD_ETF_BN`, `FLOW_TENSION_INDEX`, `RUPEE_PRESSURE_SCORE`, `POLICY_DIVERGENCE_INDEX`.

- [ ] **Step 1: Verify the nominal-GDP World Bank mirror pattern**

Confirmed during design research: FRED mirrors World Bank nominal GDP (current US$) per-country under the pattern `MKTGDP{ISO2}A646NWDB` — verified live for Indonesia (`MKTGDPIDA646NWDB`). For each of AR, AU, BR, CA, DE, FR, IT, KR, MX, SA, TR, ZA (UK → use ISO2 `GB`, i.e. `MKTGDPGBA646NWDB`), do:

```
WebFetch https://fred.stlouisfed.org/series/MKTGDP{ISO2}A646NWDB
```

If the page resolves and shows a real series with data updated within the last ~3 years (annual World Bank data can lag), record `MKTGDP{ISO2}A646NWDB` as that country's `GDP_NOMINAL_USD` `fred_id`. If it 404s or shows no data, that country's `GDP_NOMINAL_USD` gets deactivated instead — do not guess an alternate ID.

- [ ] **Step 2: Verify the GDP-growth-% pattern per country**

The OECD-sourced pattern `NAEXKP01{ISO2}A657S` was confirmed live for Germany and the UK (`GB`), both OECD members. Non-OECD members in this list (Argentina, Indonesia, Saudi Arabia) likely lack this series. For each of AR, AU, BR, CA, FR, ID, IT, KR, MX, SA, TR, ZA (DE and UK already confirmed):

```
WebFetch https://fred.stlouisfed.org/series/NAEXKP01{ISO2}A657S
```

If it resolves with recent data, record it. If not, try the World Bank real-GDP-growth mirror instead — search `WebSearch "NY.GDP.MKTP.KD.ZG" fred.stlouisfed.org {country name}` for that specific country and confirm via WebFetch before recording. If neither resolves, deactivate that country's `GDP_GROWTH_YOY`.

- [ ] **Step 3: Resolve `US_GFCF_GDP_PCT` / `US_PRIVATE_GFCF_GDP_PCT`**

These are ratios (Gross Fixed Capital Formation ÷ GDP), not single FRED series. Search `WebSearch "GPDIC1" OR "PNFIC1" FRED gross private domestic investment` to confirm the numerator series, and use `GDPC1` (already used elsewhere in this codebase per `US_GDP_GROWTH_YOY`'s neighbor entries) as the denominator. If a clean numerator series is confirmed, follow the same special-case pattern added in Task 4 (add a branch to `ingest-fred/index.ts`, add `fred_id_numerator`/`fred_id_denominator` metadata). If no clean single-series numerator exists, deactivate both rather than build a multi-series composite for a "Non-goals"-adjacent metric.

- [ ] **Step 4: Resolve `CAPITAL_FROM_EM_DEBT_BN` / `CAPITAL_FROM_GOLD_ETF_BN`**

Both are documented as constructed proxies ("bond fund flows", "GLD + IAU AUM change") without a single FRED series backing them — confirmed via their `description` field (Task-1 research). Building fund-flow proxy computations from scratch is a modeling task, not a data-recovery task, and is out of this plan's scope per the design doc's non-goals. Deactivate both with `deactivation_reason: 'Proxy requires a constructed fund-flow model, not a single FRED series; out of scope for this fix — needs its own design.'`

- [ ] **Step 5: Resolve `FLOW_TENSION_INDEX` / `RUPEE_PRESSURE_SCORE` / `POLICY_DIVERGENCE_INDEX`**

```bash
grep -rn "FLOW_TENSION_INDEX\|RUPEE_PRESSURE_SCORE\|POLICY_DIVERGENCE_INDEX" supabase/functions --include="*.ts"
```

These look like internally-computed composite indices mislabeled with `source_id = FRED`. If the grep finds a `compute-*` function that already writes these IDs, fix `metrics.source_id` to point at that source (e.g. a `COMPUTED` source row) instead of FRED, and leave `metadata.fred_id` unset — the metric will then correctly fall outside `ingest-fred`'s query entirely and rely on its real compute job. If no compute function exists for them at all, deactivate with `deactivation_reason: 'No compute or ingest pipeline exists for this index; mislabeled as FRED-sourced.'`

- [ ] **Step 6: Write and apply the migration**

Compose the migration from the results of steps 1-5 (a mix of `UPDATE ... SET metadata = metadata || jsonb_build_object('fred_id', '<verified id>')` for confirmed ones, and `UPDATE ... SET is_active = false, metadata = metadata || jsonb_build_object('deactivation_reason', '<reason>')` for the rest, matching Task 2's pattern exactly). Apply via `mcp__supabase__apply_migration`, project `debdriyzfcwvgrhzzzre`.

- [ ] **Step 7: Verify**

```sql
select id, is_active, metadata->>'fred_id' as fred_id, metadata->>'deactivation_reason' as reason
from public.metrics
where id like '%_GDP_GROWTH_YOY' or id like '%_GDP_NOMINAL_USD'
order by is_active desc, id;
```

Confirm every row has either a `fred_id` or a `reason` — none left silently blank.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260801000003_track1b_gdp_and_remaining_metrics.sql
git commit -m "fix(data): resolve or deactivate remaining 27 orphaned GDP/liquidity/flow metrics"
```

---

### Task 6: Rewrite `useDataIntegrity` to use the database's own staleness computation

**Files:**
- Modify: `src/hooks/useDataIntegrity.ts`
- Modify: `src/hooks/__tests__/useDataIntegrity.test.tsx`

**Interfaces:**
- Consumes: `vw_latest_metrics` columns `metric_id`, `staleness_flag`, `as_of_date`, `last_updated_at` (already exist and are already correctly computed from each metric's `expected_interval_days` — confirmed in `supabase/migrations/20260616100000_restore_cascade_views.sql`).
- Produces: same `IntegrityReport` interface (`status`, `message`, `staleCount`, `totalHighFrequency`, `lastChecked`, `lastIngestionAt`) — **unchanged**, so `DataHealthBanner.tsx` and its tests need zero changes.

- [ ] **Step 1: Write the new hook**

Replace the entire body of `src/hooks/useDataIntegrity.ts` with:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IntegrityReport {
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
    staleCount: number;
    totalHighFrequency: number;
    lastChecked: string;
    lastIngestionAt: string | null;
}

export function useDataIntegrity() {
    return useQuery({
        queryKey: ['data-integrity'],
        queryFn: async (): Promise<IntegrityReport> => {
            const { data: metrics } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, staleness_flag, as_of_date');

            if (!metrics || metrics.length === 0) {
                return {
                    status: 'critical',
                    message: 'No metric data available in the synchronization layer.',
                    staleCount: 0,
                    totalHighFrequency: 0,
                    lastChecked: new Date().toISOString(),
                    lastIngestionAt: null
                };
            }

            // staleness_flag is computed in the database per-metric against
            // that metric's own registered expected_interval_days — a
            // quarterly series that's 60 days old is correctly 'fresh',
            // unlike the old client-side flat-7-day-threshold check.
            const staleMetrics = metrics.filter(m => m.staleness_flag === 'lagged' || m.staleness_flag === 'very_lagged');
            const veryStaleMetrics = metrics.filter(m => m.staleness_flag === 'very_lagged');

            const freshestMs = metrics.reduce((acc, m) => {
                const t = new Date(m.as_of_date ?? '').getTime();
                return t > acc ? t : acc;
            }, 0);
            const lastIngestionAt = freshestMs > 0 ? new Date(freshestMs).toISOString() : null;

            const staleCount = staleMetrics.length;
            const totalHighFrequency = metrics.length;
            const staleRatio = totalHighFrequency > 0 ? staleCount / totalHighFrequency : 0;

            if (staleRatio > 0.25 && veryStaleMetrics.length > 10) {
                return {
                    status: 'critical',
                    message: 'Data sync delayed',
                    staleCount,
                    totalHighFrequency,
                    lastChecked: new Date().toISOString(),
                    lastIngestionAt
                };
            }

            if (staleCount > 0) {
                return {
                    status: 'degraded',
                    message: 'Data latency detected',
                    staleCount,
                    totalHighFrequency,
                    lastChecked: new Date().toISOString(),
                    lastIngestionAt
                };
            }

            return {
                status: 'healthy',
                message: 'All core systems operational.',
                staleCount: 0,
                totalHighFrequency,
                lastChecked: new Date().toISOString(),
                lastIngestionAt
            };
        },
        refetchInterval: 1000 * 60 * 30 // 30 min
    });
}
```

Note: this drops the old `HIGH_FREQUENCY_PREFIXES` filter entirely — `staleness_flag` is now correct for every metric regardless of cadence, so there's no need to hand-pick a subset. `totalHighFrequency` now means "total tracked metrics" rather than "total high-frequency metrics"; this is a naming carryover kept only so `DataHealthBanner.tsx`'s existing `{staleCount} of {totalHighFrequency} tracked feeds` copy (line 65) keeps working unchanged and still reads correctly.

- [ ] **Step 2: Rewrite the test file**

Replace `src/hooks/__tests__/useDataIntegrity.test.tsx` with:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDataIntegrity } from '../useDataIntegrity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useDataIntegrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('returns critical status when no metrics data available', async () => {
        const mockSelect = vi.fn().mockResolvedValue({ data: null });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useDataIntegrity(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe('critical');
    });

    it('returns healthy status when every metric has staleness_flag fresh, regardless of cadence', async () => {
        const mockSelect = vi.fn().mockResolvedValue({
            data: [
                { metric_id: 'CAPITAL_FROM_XYZ', staleness_flag: 'fresh', as_of_date: '2026-07-30' },
                // A quarterly metric that's 60 days old is 'fresh' per its own expected_interval_days —
                // this is exactly the case the old flat-7-day threshold got wrong.
                { metric_id: 'BOP_CURRENT_ACCOUNT_GDP', staleness_flag: 'fresh', as_of_date: '2026-06-01' },
            ]
        });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useDataIntegrity(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe('healthy');
        expect(result.current.data?.staleCount).toBe(0);
        expect(result.current.data?.totalHighFrequency).toBe(2);
    });

    it('returns degraded status when some metrics are lagged (below critical threshold)', async () => {
        const mockSelect = vi.fn().mockResolvedValue({
            data: [
                { metric_id: 'CAPITAL_FROM_XYZ', staleness_flag: 'lagged', as_of_date: '2026-06-01' },
                { metric_id: 'PMI_MANUFACTURING', staleness_flag: 'fresh', as_of_date: '2026-07-30' },
                { metric_id: 'USD_GBP', staleness_flag: 'fresh', as_of_date: '2026-07-30' },
                { metric_id: 'GOLD_PRICE', staleness_flag: 'fresh', as_of_date: '2026-07-30' },
            ]
        });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useDataIntegrity(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe('degraded');
        expect(result.current.data?.staleCount).toBe(1);
    });

    it('returns critical status when >25% are stale and >10 are very_lagged', async () => {
        const metrics = [
            ...Array.from({ length: 11 }, (_, i) => ({ metric_id: `USD_${i}`, staleness_flag: 'very_lagged', as_of_date: '2024-01-01' })),
            ...Array.from({ length: 9 }, (_, i) => ({ metric_id: `PMI_${i}`, staleness_flag: 'fresh', as_of_date: '2026-07-30' })),
        ];
        const mockSelect = vi.fn().mockResolvedValue({ data: metrics });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useDataIntegrity(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe('critical');
        expect(result.current.data?.staleCount).toBe(11);
    });
});
```

- [ ] **Step 3: Run the tests**

```bash
npx vitest run src/hooks/__tests__/useDataIntegrity.test.tsx src/components/__tests__/DataHealthBanner.test.tsx
```

Expected: all pass. `DataHealthBanner.test.tsx` mocks `useDataIntegrity` directly (confirmed at `DataHealthBanner.test.tsx:11-13`), so it needs no changes — this run just confirms the interface contract still holds.

- [ ] **Step 4: Lint and build**

```bash
npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDataIntegrity.ts src/hooks/__tests__/useDataIntegrity.test.tsx
git commit -m "fix(data-health): read vw_latest_metrics.staleness_flag instead of reimplementing a flat threshold"
```

---

### Task 7: Remove fabricated data from `ingest-imf-current-account`

**Files:**
- Modify: `supabase/functions/ingest-imf-current-account/index.ts`
- Create: `supabase/migrations/20260801000004_deactivate_fabricated_imf_metrics.sql` (shared with Task 8)

**Interfaces:**
- Consumes: nothing
- Produces: `CA_GDP_PCT_IN`, `CA_GDP_PCT_CN`, `CA_GDP_PCT_BR`, `CA_GDP_PCT_TR` set `is_active = false`; the function stops writing fabricated values; its cron job is unscheduled.

This function's own variable is literally named `mockValues` (`ingest-imf-current-account/index.ts:29`) — it has never fetched real data. Per the user's decision to pull fabricated data entirely rather than keep dated snapshots, and since this function has only 4 outputs (not worth a bespoke IMF/World Bank current-account-by-country integration for this pass — flag as a follow-up instead):

- [ ] **Step 1: Confirm no other function already covers this data**

```bash
grep -rln "CA_GDP_PCT" supabase/functions --include="*.ts"
```

Expected: only `ingest-imf-current-account`. If another function also targets these IDs, stop and re-scope this task around that instead.

- [ ] **Step 2: Gut the function to a documented no-op**

Replace the body of `supabase/functions/ingest-imf-current-account/index.ts` with:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { serveIngest, IngestResult } from '../_shared/handler.ts';

// This function previously wrote hardcoded "mock" current-account-%-GDP
// values for India/China/Brazil/Turkey, restamped as live data. Removed
// 2026-08-01 per the project's "no fabricated data" rule — CA_GDP_PCT_IN/
// CN/BR/TR are deactivated in migration 20260801000004 until a real IMF/
// World Bank data source is integrated (tracked as a follow-up).
serveIngest('ingest-imf-current-account', async (_req: Request): Promise<IngestResult> => {
    return { ok: true, counts: { upserted: 0, skipped: 4 }, meta: { note: 'Disabled: source was fabricated. See migration 20260801000004.' } };
});
```

- [ ] **Step 3: Add the deactivation to the shared migration**

Start `supabase/migrations/20260801000004_deactivate_fabricated_imf_metrics.sql` with:

```sql
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
```

(Task 8 appends to this same file — apply it once both tasks' SQL is written.)

- [ ] **Step 4: Unschedule the cron job**

```sql
SELECT cron.unschedule('ingest-imf-current-account-monthly');
```
Add this to the same migration file, after the `UPDATE` above.

- [ ] **Step 5: Lint and build**

```bash
npm run lint && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/ingest-imf-current-account/index.ts
git commit -m "fix(data): remove fabricated current-account data from ingest-imf-current-account"
```
(Migration commit happens at the end of Task 8, once the shared file is complete.)

---

### Task 8: Remove fabricated data from `ingest-imf-brics`

**Files:**
- Modify: `supabase/functions/ingest-imf-brics/index.ts`
- Modify: `supabase/migrations/20260801000004_deactivate_fabricated_imf_metrics.sql` (append)

**Interfaces:**
- Consumes: nothing
- Produces: all `BRICS_*` metrics and the `country_reserves` gold-holdings write from this function deactivated/removed.

`ingest-imf-brics` writes hardcoded BRICS-bloc aggregate values (`BRICS_USD_RESERVE_SHARE_PCT`, `BRICS_GOLD_HOLDINGS_TONNES`, `BRICS_GOLD_SHARE_PCT`, `BRICS_GDP_PPP_TN`, `BRICS_DEBT_GDP_PCT`, `BRICS_INFLATION_YOY`) and hardcoded per-country gold reserves (CN/RU/IN/BR/ZA) into `country_reserves`. BRICS is not a formal reporting bloc to IMF/World Bank/FRED, so there's no single real series for these aggregates without building composition logic from country-level data — out of scope for this pass.

- [ ] **Step 1: Check whether another function also writes to `country_reserves`**

```bash
grep -rln "country_reserves" supabase/functions --include="*.ts"
```

If `ingest-major-economies` (Task 9) or another function also writes to `country_reserves` for the same country codes, do not let this task's removal accidentally look like it broke that other pipeline — just confirm the two write different, non-overlapping fields or accept the last-write-wins semantics already implicit in the current code (both already write to the same table via `upsert` on `country_code, as_of_date` — this is pre-existing behavior, not something this task needs to fix).

- [ ] **Step 2: Get the current list of `BRICS_*` metric IDs**

```sql
select id from public.metrics where id like 'BRICS\_%' escape '\' and is_active = true order by id;
```
Run via `mcp__supabase__execute_sql`, project `debdriyzfcwvgrhzzzre`.

- [ ] **Step 3: Gut the function**

Replace the body of `supabase/functions/ingest-imf-brics/index.ts` with:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { serveIngest, IngestResult } from '../_shared/handler.ts';

// This function previously wrote hardcoded BRICS-bloc aggregate values and
// per-country gold reserves, restamped as live monthly data. Removed
// 2026-08-01 per the project's "no fabricated data" rule. BRICS_* metrics
// are deactivated in migration 20260801000004. A real fix requires either
// a genuine BRICS-aggregate data source or computing these from real
// country-level series — tracked as a follow-up, not attempted here.
serveIngest('ingest-imf-brics', async (_req: Request): Promise<IngestResult> => {
    return { ok: true, counts: { upserted: 0, skipped: 0 }, meta: { note: 'Disabled: source was fabricated. See migration 20260801000004.' } };
});
```

- [ ] **Step 4: Append to the shared migration**

Add to `supabase/migrations/20260801000004_deactivate_fabricated_imf_metrics.sql` (use the exact metric IDs returned by Step 2's query in place of the illustrative list below if they differ):

```sql
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
```

- [ ] **Step 5: Apply the complete shared migration (Tasks 7 + 8)**

Use `mcp__supabase__apply_migration`, project `debdriyzfcwvgrhzzzre`, name `deactivate_fabricated_imf_metrics`, with the full file contents from Tasks 7 and 8 combined.

- [ ] **Step 6: Verify**

```sql
select jobname from cron.job where jobname in ('ingest-imf-current-account-monthly', 'ingest-imf-brics-monthly');
```
Expected: zero rows (both unscheduled).

```sql
select count(*) from public.metrics where (id like 'BRICS\_%' escape '\' or id like 'CA_GDP_PCT_%') and is_active = true;
```
Expected: 0.

- [ ] **Step 7: Lint and build**

```bash
npm run lint && npm run build
```

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/ingest-imf-brics/index.ts supabase/migrations/20260801000004_deactivate_fabricated_imf_metrics.sql
git commit -m "fix(data): remove fabricated BRICS aggregate and gold-reserves data from ingest-imf-brics"
```

---

### Task 9: Redirect or remove fabricated data in `ingest-major-economies`

**Files:**
- Modify: `supabase/functions/ingest-major-economies/index.ts`
- Create: `supabase/migrations/20260801000005_major_economies_redirect_or_deactivate.sql`

**Interfaces:**
- Consumes: nothing
- Produces: `metadata.fred_id` set for any of the function's hardcoded metrics that have a real, verified FRED/World Bank equivalent (redirected into `ingest-fred`'s pipeline instead), `is_active = false` for the rest; the hardcoded write path removed for every metric that's either redirected or deactivated.

This function writes 32 hardcoded `macroData` entries (GDP nominal/PPP/growth, policy rates, CPI for ~14 countries) plus 15 hardcoded `reservesData` entries (FX reserves, gold tonnes) every month, restamped with `new Date()`.

- [ ] **Step 1: List every metric ID this function writes**

Read `supabase/functions/ingest-major-economies/index.ts` in full (already reviewed during design — 32 `macroData` entries covering US/CN/IN/JP/DE/SA/KR/BR/CH/TW/SG/TH/QA, plus `reservesData` for 15 country codes writing to `country_reserves`).

- [ ] **Step 2: Verify real sources for the clearest candidates first**

Some of these plausibly have real FRED series already used elsewhere in this codebase for the same underlying concept — check before assuming:

```bash
grep -n "'US_POLICY_RATE'\|'FEDFUNDS'\|'US_GDP_NOMINAL" supabase/functions/ingest-fred/index.ts supabase/migrations/*.sql
```

For `US_GDP_NOMINAL_TN`, `US_GDP_GROWTH_YOY` (already fixed in Task 1 under a different ID — check for ID collision here), `US_POLICY_RATE` (→ FRED `FEDFUNDS`), `US_CPI_YOY` (→ FRED `CPIAUCSL`, same as `INFLATION_HEADLINE_YOY` — check for a duplicate-metric situation before redirecting), verify each via `WebFetch` against the real FRED series page before writing `fred_id`. For non-US countries' GDP nominal, apply the same `MKTGDP{ISO2}A646NWDB` pattern verification used in Task 5, reusing the ISO2 codes already resolved there where the same country appears in both lists.

For policy rates of non-US central banks (China, India, Japan, Germany/ECB, Saudi Arabia, Korea, Brazil, Switzerland, Taiwan, Thailand) — search `WebSearch "{country} central bank policy rate" fred.stlouisfed.org` per country. Central bank policy rates for major economies are frequently on FRED (e.g. ECB main refinancing rate, RBI repo rate) — verify each individually, do not assume.

For `reservesData` (FX reserves, gold tonnes by country) — this is WGC/IMF IFS-sourced reference data with no live free API readily available; per the design doc's non-goals (no new heavy API clients) and the user's "pull until real" decision, plan to deactivate this entire write path rather than source it.

- [ ] **Step 3: Rewrite the function**

Restructure `ingest-major-economies/index.ts` to:
1. Remove the hardcoded `macroData` array entirely for any metric ID that got a real `fred_id` in Step 2 (those are now handled automatically by `ingest-fred` once the migration lands — this function should stop writing them to avoid a conflicting overwrite).
2. Remove the hardcoded `reservesData` write to `country_reserves` entirely (no real source available this pass).
3. For any metric ID with genuinely no real source found in Step 2, remove it from `macroData` too — don't leave a hardcoded fallback.
4. If every entry in `macroData` and `reservesData` ends up removed, replace the function body with the same documented no-op pattern used in Task 7/8. If some entries survive because they have no real source but the team wants to keep partial hardcoded coverage — they don't, per the user's explicit "pull until real" decision — so this should fully empty out.

- [ ] **Step 4: Write the migration**

Mirror the pattern from Tasks 2/5/7/8: `UPDATE ... SET metadata = metadata || jsonb_build_object('fred_id', ...)` for every verified redirect, `UPDATE ... SET is_active = false, metadata = metadata || jsonb_build_object('deactivation_reason', ...)` for the rest, using the exact metric IDs found in Step 1.

- [ ] **Step 5: Apply, unschedule if fully emptied**

Apply via `mcp__supabase__apply_migration`, project `debdriyzfcwvgrhzzzre`. If Step 3 concluded in a full no-op, also add `SELECT cron.unschedule('ingest-major-economies-monthly');` to this migration.

- [ ] **Step 6: Lint and build**

```bash
npm run lint && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/ingest-major-economies/index.ts supabase/migrations/20260801000005_major_economies_redirect_or_deactivate.sql
git commit -m "fix(data): redirect ingest-major-economies metrics to real FRED sources or deactivate; remove hardcoded values"
```

---

### Task 10: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Manually invoke `ingest-fred` for a sample of newly-mapped metrics**

Use the Supabase MCP or `curl` against the deployed function with a service-role key, passing a subset of the newly-mapped metric IDs from Task 1 (e.g. `{"metric_ids": ["HOUSING_MORTGAGE_RATE_30Y", "LABOR_VACANCIES_JOLTS", "USD_BRL_RATE", "CNY_INR_RATE", "COPPER_GOLD_RATIO"]}`) to confirm they now populate without waiting for the next scheduled cron run.

- [ ] **Step 2: Re-run the staleness count query from the design investigation**

```sql
select staleness_flag, count(*) from vw_latest_metrics group by staleness_flag order by 2 desc;
```
Compare against the baseline captured in the design doc (`fresh: 149, very_lagged: 139, lagged: 33`) — expect `very_lagged`/`lagged` to have dropped substantially, and `fresh` (or the metric no longer appearing at all, if deactivated) to have risen correspondingly.

- [ ] **Step 3: Browser check**

Use the browser preview tools:
1. `preview_start` the dev server (check `.claude/launch.json`; create it targeting `npm run dev` if it doesn't already exist).
2. Navigate to `/` — confirm the header banner/chip count is lower and, per Task 6, no longer includes metrics that are within their own expected cadence.
3. Navigate to `/data-health` — confirm previously-orphaned metrics now show recent `as_of` dates, and deactivated metrics either don't appear or show an honest unavailable state (not a stale red badge implying "should be live").
4. Navigate to `/labs/us-macro-fiscal` — confirm the STALE badge from the original bug report has cleared or changed to an accurate state.

- [ ] **Step 4: Full test suite**

```bash
npm run lint && npm run build && npm run test
```
Note: `src/components/brief/__tests__/FocusAreaSelector.test.tsx` has 5 pre-existing failures unrelated to this work (tracked separately) — confirm no *new* failures beyond that known set.

- [ ] **Step 5: Report**

Summarize: before/after staleness counts, which metrics were redirected to real sources vs deactivated, which cron jobs were unscheduled, and confirmation that no fabricated value remains anywhere in the touched functions.
