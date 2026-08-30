# GraphiQuestor Authority Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public, versioned research system that makes GraphiQuestor’s eight flagship metrics reliable citation objects for search, researchers, media, policy teams, and AI systems.

**Architecture:** Keep the existing Vite, React, Supabase, TanStack Query, Netlify, sitemap, and Puppeteer prerender architecture. Add a clearly bounded authority layer: a typed metric contract, append-only publication snapshots, public exports and citation metadata, report-to-metric links, and event instrumentation. The latest canonical page remains dynamic; immutable snapshots preserve the exact public state used in a report or citation.

**Tech Stack:** React 18, TypeScript, Vite, React Router v7, MUI, TanStack Query v5, Supabase Postgres and Edge Functions, Netlify, Puppeteer, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-31-graphiquestor-authority-engine-design.md`

## Global Constraints

- The first cohort is `net-liquidity`, `fiscal-dominance-meter`, `sovereign-stress-index`, `m2-gold-ratio`, `global-usd-reserve-share`, `CB_GOLD_NET`, `india-credit-cycle`, and `china-iceberg-ratio`.
- `sc-domain:graphiquestor.com` is the canonical Search Console property.
- `fresh`, `lagged`, and `very_lagged` remain the staleness values used by existing helpers and views.
- Public research stays fully accessible and indexable.
- Every public metric page shows source, freshness, methodology version, correction history, and citation text.
- No fabricated values, inferred freshness, or silent source substitutions.
- Existing unrelated working-tree changes must remain untouched.
- Every task ends with its targeted test command and a focused commit.

---

## Workstream A: Metric authority contract

### Task 1: Resolve the eight-metric source map

**Files:**
- Create: `docs/ops/authority-metric-mapping.md`
- Create: `scripts/__tests__/authorityMetricMapping.test.ts`
- Inspect: `src/features/metrics/metricsCatalog.ts`
- Inspect: `src/lib/pipelineCatalog.ts`
- Inspect: `src/hooks/useLatestMetric.ts`
- Inspect: `supabase/migrations/*`

**Interfaces:**
- Produces one authoritative table with `public_slug`, canonical database `metric_id`, producer function, source table or view, observation grain, unit, source ledger, and calculation path for each of the eight metrics.
- The test exports `EXPECTED_AUTHORITY_METRICS` and fails when a flagship metric has no mapping or when a mapping references an unknown catalog entry.

- [ ] **Step 1: Write the failing mapping test**

```ts
import { describe, expect, it } from 'vitest';
import { EXPECTED_AUTHORITY_METRICS } from '../../authorityMetricMapping';

const flagshipSlugs = [
  'net-liquidity', 'fiscal-dominance-meter', 'sovereign-stress-index',
  'm2-gold-ratio', 'global-usd-reserve-share', 'CB_GOLD_NET',
  'india-credit-cycle', 'china-iceberg-ratio',
];

describe('authority metric mapping', () => {
  it('maps every flagship metric to a database id, producer, storage path, and unit', () => {
    expect(EXPECTED_AUTHORITY_METRICS).toHaveLength(8);
    for (const metric of EXPECTED_AUTHORITY_METRICS) {
      expect(metric.publicSlug).toBeTruthy();
      expect(metric.metricId).toBeTruthy();
      expect(metric.producer).toBeTruthy();
      expect(metric.storagePath).toBeTruthy();
      expect(metric.unit).toBeTruthy();
    }
    expect(new Set(EXPECTED_AUTHORITY_METRICS.map((metric) => metric.publicSlug)).size).toBe(8);
    expect(flagshipSlugs).toEqual(expect.arrayContaining(EXPECTED_AUTHORITY_METRICS.map((metric) => metric.publicSlug)));
  });
});
```

- [ ] **Step 2: Run the test and verify the missing mapping is exposed**

Run: `npx vitest run scripts/__tests__/authorityMetricMapping.test.ts`

Expected: FAIL until the mapping artifact is implemented.

- [ ] **Step 3: Trace each metric to the current catalog, producer, and Supabase storage**

Record the current facts, including the known special cases: Net Liquidity uses the existing net-liquidity view; Central Bank Gold uses `CB_GOLD_NET` and `cb_gold_net`; every unresolved metric ID must be identified by exact migration or view evidence.

- [ ] **Step 4: Add the mapping artifact and test fixture**

Use this shape:

```ts
export interface AuthorityMetricMapping {
  publicSlug: string;
  metricId: string;
  producer: string;
  storagePath: string;
  observationGrain: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'mixed';
  unit: string;
  sourceLedger: string[];
  calculationPath: string;
}
```

- [ ] **Step 5: Run the test and commit**

Run: `npx vitest run scripts/__tests__/authorityMetricMapping.test.ts`

Expected: PASS with eight unique mappings.

Commit: `git add docs/ops/authority-metric-mapping.md scripts/__tests__/authorityMetricMapping.test.ts && git commit -m "test: map flagship authority metrics"`

### Task 2: Add the typed public metric contract

**Files:**
- Create: `src/lib/authority/metricContract.ts`
- Create: `src/lib/authority/metricContract.test.ts`
- Modify: `src/lib/dataStatus.ts`
- Modify: `src/components/FreshnessChip.tsx` only if the contract requires a shared status type

**Interfaces:**
- Produces `AuthorityMetricRecord`, `AuthorityMetricStatus`, `AuthorityMetricSource`, and `AuthorityMetricSnapshot` types.
- `serializeAuthorityMetric(record): string` emits stable JSON with explicit nulls.
- `toAuthorityMetricCsv(records): string` emits a header plus one row per observation.

- [ ] **Step 1: Write tests for statuses, null serialization, and CSV headers**

```ts
import { describe, expect, it } from 'vitest';
import { serializeAuthorityMetric, toAuthorityMetricCsv } from './metricContract';

describe('authority metric contract', () => {
  it('serializes missing values as explicit nulls', () => {
    const json = JSON.parse(serializeAuthorityMetric({
      metric_id: 'example', slug: 'example', label: 'Example', value: null,
      unit: 'index', observed_at: null, published_at: null, source_name: 'Example',
      source_ref: null, native_frequency: 'monthly', staleness_flag: 'very_lagged',
      data_status: 'unavailable', methodology_version: '1.0.0', revision_of: null,
    }));
    expect(json.value).toBeNull();
    expect(json.revision_of).toBeNull();
  });

  it('emits the documented CSV contract header', () => {
    expect(toAuthorityMetricCsv([]).split('\n')[0]).toBe(
      'metric_id,slug,label,value,unit,observed_at,published_at,source_name,source_ref,native_frequency,staleness_flag,data_status,methodology_version,revision_of',
    );
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/lib/authority/metricContract.test.ts`

Expected: FAIL because the authority module does not exist.

- [ ] **Step 3: Implement the contract and serializers**

Use `verified`, `provisional`, `revised`, `corrected`, `unavailable`, and `superseded` as data statuses. Keep staleness values separate. Sort object keys and records by timestamp before serialization so downloads are reproducible.

- [ ] **Step 4: Run the focused test and commit**

Run: `npx vitest run src/lib/authority/metricContract.test.ts`

Expected: PASS.

Commit: `git add src/lib/authority src/lib/dataStatus.ts src/components/FreshnessChip.tsx && git commit -m "feat: define authority metric contract"`

---

## Workstream B: Immutable snapshots and publication state

### Task 3: Add append-only metric publication snapshots

**Files:**
- Create: `supabase/migrations/20260831000001_metric_publication_snapshots.sql`
- Create: `supabase/tests/metric_publication_snapshots.sql`
- Modify: `src/types/database.types.ts` after migration generation

**Interfaces:**
- Table: `public.metric_publication_snapshots`.
- Required columns: `snapshot_id uuid primary key`, `metric_id text not null`, `slug text not null`, `payload jsonb not null`, `observed_at timestamptz`, `published_at timestamptz not null`, `methodology_version text not null`, `source_snapshot_hash text`, `data_status text not null`, `revision_of uuid references public.metric_publication_snapshots(snapshot_id)`, and `created_at timestamptz not null default now()`.
- Public read policy permits `select` on published snapshots. Insert, update, and delete remain service-role-only.

- [ ] **Step 1: Write SQL assertions for uniqueness, states, and public read access**

Assert that `snapshot_id` is unique, `revision_of` cannot equal `snapshot_id`, `data_status` is constrained to the six declared values, updates and deletes are rejected for anon/authenticated roles, and a published snapshot is readable.

- [ ] **Step 2: Run the SQL test against the local Supabase database**

Run: `supabase start && psql "$SUPABASE_DB_URL" -f supabase/tests/metric_publication_snapshots.sql`

Expected: FAIL until the migration is applied.

- [ ] **Step 3: Implement the migration**

Add append-only triggers that reject updates and deletes. Enforce `revision_of` pointing to an older snapshot for the same metric and add indexes on `(slug, published_at desc)` and `(metric_id, observed_at desc)`.

- [ ] **Step 4: Define the revision state transition in a database comment and test**

The newest snapshot points to the previous snapshot through `revision_of`. A source-value change uses `revised`; an interpretation or provenance correction uses `corrected`; the old row remains retrievable and is labeled `superseded` by a separate `superseded_at` or current-state view, without mutating its original payload.

- [ ] **Step 5: Apply the migration, regenerate types, run tests, and commit**

Run: `supabase db reset`, the SQL test, and the repository’s type-generation command used by the project.

Expected: PASS with public read and service-only write behavior.

Commit: `git add supabase/migrations/20260831000001_metric_publication_snapshots.sql supabase/tests/metric_publication_snapshots.sql src/types/database.types.ts && git commit -m "feat: add immutable metric publication snapshots"`

### Task 4: Add the snapshot writer and verification gate

**Files:**
- Create: `supabase/functions/publish-metric-snapshot/index.ts`
- Create: `supabase/functions/publish-metric-snapshot/index.test.ts`
- Modify: `supabase/functions/_shared/*` only for shared validation helpers

**Interfaces:**
- `publishMetricSnapshot(input): Promise<{ snapshotId: string; status: AuthorityMetricStatus }>`.
- The function reads the latest verified observation, validates required source inputs, computes a canonical payload hash, and inserts one snapshot.

- [ ] **Step 1: Test valid, provisional, stale, unavailable, revised, and corrected inputs**
- [ ] **Step 2: Run the function test and verify invalid publication is rejected**
- [ ] **Step 3: Implement the function with idempotency on `(metric_id, observed_at, methodology_version, source_snapshot_hash)`**
- [ ] **Step 4: Verify a failed input leaves the previous verified snapshot current and creates an operational error**
- [ ] **Step 5: Run tests and commit**

Run: `deno test --allow-env --allow-net supabase/functions/publish-metric-snapshot/index.test.ts`

Commit: `git add supabase/functions/publish-metric-snapshot supabase/functions/_shared && git commit -m "feat: publish verified metric snapshots"`

---

## Workstream C: Public metric pages, exports, and rendering

### Task 5: Add public authority data and citation components

**Files:**
- Create: `src/components/authority/AuthorityMetricProvenance.tsx`
- Create: `src/components/authority/AuthorityMetricDownloads.tsx`
- Create: `src/components/authority/AuthorityCitationBlock.tsx`
- Create: `src/components/authority/AuthorityCorrectionLog.tsx`
- Create: `src/components/authority/authorityComponents.test.tsx`

**Interfaces:**
- `AuthorityMetricProvenance({ record })` renders source, observed date, freshness, data status, and methodology version.
- `AuthorityMetricDownloads({ slug })` links to `/api/public/metrics/<slug>.json` and `.csv`.
- `AuthorityCitationBlock({ record })` renders a copyable plain-text citation with the canonical URL and snapshot date.
- `AuthorityCorrectionLog({ corrections })` renders correction severity, reason, replacement snapshot, and timestamp.

- [ ] **Step 1: Write component tests for verified, lagged, unavailable, and corrected states**
- [ ] **Step 2: Run tests and verify the new components fail to compile**
- [ ] **Step 3: Implement the components using existing `FreshnessChip`, provenance styles, and terminal layout patterns**
- [ ] **Step 4: Run focused tests and commit**

Run: `npx vitest run src/components/authority/authorityComponents.test.tsx`

Commit: `git add src/components/authority && git commit -m "feat: add public metric authority components"`

### Task 6: Add the canonical metric authority surface

**Files:**
- Modify: `src/pages/MetricPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/lib/seoTemplates.ts`
- Modify: `scripts/prerender.mjs`
- Create: `src/pages/__tests__/MetricPageAuthority.test.tsx`

**Interfaces:**
- `/metrics/<slug>/` remains the canonical route and reads a typed authority record.
- `/metrics/<slug>/history/<snapshot-id>/` renders an immutable snapshot payload and sets a self-referencing canonical URL.
- `getAuthorityMetricBySlug(slug): Promise<AuthorityMetricRecord>` and `getAuthoritySnapshot(slug, snapshotId): Promise<AuthorityMetricSnapshot>` are the page data boundaries.

- [ ] **Step 1: Add route and rendering tests for canonical URLs, provenance, JSON-LD, and snapshot URLs**
- [ ] **Step 2: Run focused tests and confirm the snapshot route is absent**
- [ ] **Step 3: Implement both routes without changing unrelated route behavior**
- [ ] **Step 4: Add route-specific `Dataset` or `TechArticle` JSON-LD only where the page visibly describes the dataset or methodology**
- [ ] **Step 5: Update the prerender seed list and ensure snapshot routes bypass the generic SPA fallback**
- [ ] **Step 6: Run tests, `npm run validate-seo`, and commit**

Run: `npx vitest run src/pages/__tests__/MetricPageAuthority.test.tsx && npm run validate-seo`

Commit: `git add src/pages/MetricPage.tsx src/App.tsx src/lib/seoTemplates.ts scripts/prerender.mjs src/pages/__tests__/MetricPageAuthority.test.tsx && git commit -m "feat: expose versioned metric authority pages"`

### Task 7: Add stable CSV and JSON exports

**Files:**
- Create: `netlify/functions/public-metric-export.ts`
- Create: `netlify/functions/public-metric-export.test.ts`
- Modify: `netlify.toml`
- Modify: `src/components/authority/AuthorityMetricDownloads.tsx`

**Interfaces:**
- `GET /.netlify/functions/public-metric-export?slug=<slug>&format=json|csv` returns the documented export contract.
- Public route rewrites `/api/public/metrics/<slug>.json` and `.csv` to the function.

- [ ] **Step 1: Write tests for valid slug, unknown slug, JSON, CSV, cache headers, and unavailable values**
- [ ] **Step 2: Run tests and verify the function fails before implementation**
- [ ] **Step 3: Implement read-only export using the public snapshot/view, explicit nulls, and `Cache-Control: public, max-age=300, stale-while-revalidate=86400`**
- [ ] **Step 4: Add rewrites and reject unsupported methods with `405`**
- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run netlify/functions/public-metric-export.test.ts`

Commit: `git add netlify/functions/public-metric-export.ts netlify/functions/public-metric-export.test.ts netlify.toml src/components/authority/AuthorityMetricDownloads.tsx && git commit -m "feat: publish metric data exports"`

---

## Workstream D: Reports, discovery, distribution, and operations

### Task 8: Connect reports to metric timelines

**Files:**
- Modify: `src/pages/MacroBriefPage.tsx`
- Modify: `src/pages/MacroBriefArchivePage.tsx`
- Modify: `src/pages/WeeklyNarrativePage.tsx`
- Modify: `src/pages/RegimeDigestPage.tsx`
- Modify: `src/pages/RegimeDigestArchivePage.tsx`
- Modify: `supabase/functions/generate-morning-brief/index.ts`
- Modify: `supabase/functions/generate-monthly-regime-digest/index.ts`
- Modify: `supabase/functions/send-weekly-digest/index.ts`
- Create: `src/lib/authority/reportMetricLinks.ts`
- Create: `src/lib/authority/reportMetricLinks.test.ts`

**Interfaces:**
- `extractFlagshipMetricIds(report): string[]` returns only validated metric IDs.
- `buildReportMetricLinks(report): Array<{ reportId: string; metricId: string; snapshotId: string }>` creates durable links to the snapshot used by the report.

- [ ] **Step 1: Test that each report type emits links for every metric it cites**
- [ ] **Step 2: Implement link extraction from existing report data structures**
- [ ] **Step 3: Add links and citation blocks to one daily, one weekly, and one monthly report fixture**
- [ ] **Step 4: Run targeted report tests and commit**

Run: `npx vitest run src/lib/authority/reportMetricLinks.test.ts`

Commit: `git add src/lib/authority src/features && git commit -m "feat: link research reports to metric snapshots"`

### Task 9: Complete sitemap, machine-readable, and embed discovery

**Files:**
- Modify: `scripts/generate-sitemap.ts`
- Modify: `scripts/generate-llms-txt.ts`
- Modify: `public/robots.txt`
- Modify: `src/config/mcpConfig.ts` only if public authority resources need listing
- Create: `scripts/__tests__/authorityDiscovery.test.ts`

**Interfaces:**
- Every flagship canonical route appears once in the sitemap.
- `llms.txt` lists canonical metric, method, and snapshot entry points.
- Embeds expose attribution and canonical metric URL.

- [ ] **Step 1: Test route uniqueness, trailing-slash policy, sitemap inclusion, and noindex exclusions**
- [ ] **Step 2: Add canonical metric and public snapshot discovery entries**
- [ ] **Step 3: Add attribution to embeddable charts without changing data values**
- [ ] **Step 4: Run sitemap, AI-surface, and SEO validators and commit**

Run: `npx vitest run scripts/__tests__/authorityDiscovery.test.ts && npx tsx scripts/validate-ai-surfaces.ts && npm run validate-seo`

Commit: `git add scripts public src/config/mcpConfig.ts && git commit -m "feat: expose authority discovery surfaces"`

### Task 10: Instrument usage and citation signals

**Files:**
- Create: `src/lib/authority/authorityEvents.ts`
- Create: `src/lib/authority/authorityEvents.test.ts`
- Modify: `src/lib/analytics.ts`
- Modify: export, embed, and citation components from Tasks 5–7
- Create: `docs/ops/authority-scorecard.md`

**Interfaces:**
- `trackAuthorityEvent(event: AuthorityEvent): void` accepts `event_type`, `metric_id` or `report_id`, timestamp, referrer, and anonymized session key when permitted.
- Events include `metric_view`, `snapshot_view`, `download`, `embed_load`, `api_request`, `citation_copy`, and `report_referral`.

- [ ] **Step 1: Test event validation and personal-data minimization**
- [ ] **Step 2: Implement event emission at the public surfaces**
- [ ] **Step 3: Document Search Console, analytics, download, embed, API, referral, and citation inputs in the scorecard**
- [ ] **Step 4: Run tests and commit**

Run: `npx vitest run src/lib/authority/authorityEvents.test.ts`

Commit: `git add src/lib/authority src/lib/analytics.ts docs/ops/authority-scorecard.md && git commit -m "feat: measure authority surface usage"`

### Task 11: Add performance and service-limit gates

**Files:**
- Modify: `netlify.toml`
- Modify: `netlify/functions/public-metric-export.ts`
- Modify: API and embed entry points identified in Task 7
- Create: `scripts/authority-performance-check.mjs`
- Create: `scripts/__tests__/authority-performance-check.test.ts`
- Create: `docs/ops/authority-operations.md`

**Interfaces:**
- Performance check accepts a URL, device profile, network profile, cache mode, sample count, and percentile target.
- The public metric summary passes when mobile LCP is ≤2.5 seconds at p75 over five cold-cache runs using a documented throttled profile.

- [ ] **Step 1: Write tests for cache headers, `405`, rate-limit `429`, embed isolation, and alert thresholds**
- [ ] **Step 2: Implement exact cache headers and rate limits: 60 export requests per IP per 5 minutes, `429` with `Retry-After`; API limits must use the same documented window or an explicitly lower one**
- [ ] **Step 3: Add the reproducible performance command and document the URL, device, network, cache, sample, and percentile settings**
- [ ] **Step 4: Run tests and a local performance check, then commit**

Run: `npx vitest run scripts/__tests__/authority-performance-check.test.ts && node scripts/authority-performance-check.mjs --url http://localhost:4173/metrics/net-liquidity/ --runs 5 --cache cold --percentile p75`

Commit: `git add netlify.toml netlify/functions scripts docs/ops/authority-operations.md && git commit -m "perf: add authority surface operating gates"`

---

## Final verification

- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build` and preserve generated files only when they are expected build outputs.
- [ ] Run `npm run validate-seo`.
- [ ] Run `npx tsx scripts/validate-ai-surfaces.ts`.
- [ ] Verify eight canonical metric routes, eight JSON exports, eight CSV exports, one immutable snapshot fixture, and the three report link fixtures.
- [ ] Verify a failed ingestion, stale input, provisional value, revised value, corrected interpretation, and unavailable source in a staging database.
- [ ] Verify no existing unrelated working-tree changes were included in the final commits.
