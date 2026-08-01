# Pre-Launch Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every "must fix before public launch" blocker from the 2026-08-01 GraphiQuestor launch-readiness audit — fabricated fallback data rendered as real, three broken ingestion pipelines, two dead-link/SEO issues, three silent-empty-state UI bugs, and a database security-hardening pass — before graphiquestor.com goes public.

**Architecture:** No new subsystems. Each task is a narrow, independently-testable bug fix against existing files: Deno edge functions (`supabase/functions/*`), React/TanStack Query dashboard components (`src/features/dashboard/components/*`), a build-time sitemap generator script, and one additive Postgres migration. A new shared helper (`src/lib/dataStatus.ts`) is introduced once and reused by four China-panel fixes to avoid repeating the same null-coercion fix four times.

**Tech Stack:** Vite + React 18 + TypeScript, TanStack Query v5, Recharts, MUI v5 + Tailwind, Supabase (Postgres + Deno Edge Functions), Vitest + `@testing-library/react`, Deno `@std/assert`.

## Global Constraints

- No fabricated data, ever: a missing value must render an explicit "no data" state, never a hardcoded number, a `?? 0` coerced into a status color, or a `?? 0` coerced into narrative text. This is the project's core design rule (CLAUDE.md) and the root cause of most tasks below.
- `@/` resolves to `src/` — use it in all new imports.
- Match existing patterns: use `DataStatePanel` (`@/components/DataStatePanel`) for empty/error states — it is already the established component in this directory (see `TreasuryHoldersSection.tsx`, `FuelSecurityClockIndia.tsx`).
- Edge function tests are colocated as `<function-dir>/index.test.ts` and are **not** picked up by the default `npm run test` — `vitest.config.ts` only auto-includes `supabase/functions/_shared/__tests__/**`. Run new edge-function tests with an explicit path, exactly as the existing `supabase/functions/ingest-fred/index.test.ts` header comment documents.
- Every task ends with `npm run lint` implicitly clean — do not introduce new lint warnings (`--max-warnings 0`).
- Never commit real secrets. Tasks that require setting a Supabase Edge Function secret are called out as **operational steps**, not code changes — do not hardcode API keys anywhere.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/functions/ingest-mospi/index.ts` | Fix missing `as_of_date` on ASI upserts (Task 2) |
| `supabase/functions/ingest-mospi/index.test.ts` | New — regression test for the above |
| `supabase/functions/ingest-fiscaldata/index.ts` | Fix `http://` → `https://` IMF endpoint (Task 3) |
| `supabase/functions/ingest-macro-news-headlines/index.ts` | Fix two undefined-variable bugs (Task 4) |
| `supabase/functions/ingest-macro-news-headlines/index.test.ts` | New — regression test for the above |
| `src/lib/dataStatus.ts` | New — shared null-aware status helper (Task 1) |
| `src/lib/__tests__/dataStatus.test.ts` | New — unit tests for the helper |
| `src/features/dashboard/components/sections/ChinaRealEconomyPanel.tsx` | Remove fabricated PMI fallback (Task 5) |
| `src/features/dashboard/components/sections/ChinaExternalSectorPanel.tsx` | Fix status-dot fabrication (Task 6) |
| `src/features/dashboard/components/sections/ChinaProprietarySignals.tsx` | Fix radar/interpretation fabrication (Task 7) |
| `src/features/dashboard/components/rows/ChinaLGFFiscalPanel.tsx` | Fix warn-flag fabrication (Task 8) |
| `src/features/dashboard/components/sections/ASISection.tsx` | Add empty-data state (Task 9) |
| `src/features/dashboard/components/sections/GoldPositioningMonitor.tsx` | Replace silent `return null` with empty state (Task 10) |
| `src/features/dashboard/components/sections/AfricaMacroSnapshot.tsx` | Replace silent `return null` with empty state (Task 11) |
| `scripts/generate-sitemap.ts` | Remove dead `/demo` entry, add `/labs/gov-financial-position` (Task 12) |
| `src/pages/labs/SovereignStressLab.tsx` | Remove dead glossary link (Task 13) |
| `src/pages/labs/ShadowSystemLab.tsx` | Remove dead glossary link (Task 13) |
| `src/components/SectionErrorBoundary.tsx` | Wire `reportClientError` (Task 14) |
| `src/components/__tests__/SectionErrorBoundary.test.tsx` | New — regression test for the above |
| `supabase/migrations/20260801120000_security_hardening_pre_launch.sql` | New — flip 40 views to `security_invoker`, revoke dangerous anon/authenticated RPC grants, drop redundant storage policy (Task 15) |

---

### Task 1: Shared no-data-aware status helper

**Files:**
- Create: `src/lib/dataStatus.ts`
- Test: `src/lib/__tests__/dataStatus.test.ts`

**Interfaces:**
- Produces: `type DataStatus = 'safe' | 'warning' | 'no-data'`, `statusFromThreshold(value: number | null | undefined, isSafe: (v: number) => boolean): DataStatus`, `STATUS_DOT_CLASS: Record<DataStatus, string>`. Tasks 6, 7, 8 import both.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/dataStatus.test.ts
import { describe, it, expect } from 'vitest';
import { statusFromThreshold, STATUS_DOT_CLASS } from '../dataStatus';

describe('statusFromThreshold', () => {
    it('returns no-data for null', () => {
        expect(statusFromThreshold(null, (v) => v > 70)).toBe('no-data');
    });

    it('returns no-data for undefined', () => {
        expect(statusFromThreshold(undefined, (v) => v > 70)).toBe('no-data');
    });

    it('returns safe when the value passes the predicate', () => {
        expect(statusFromThreshold(80, (v) => v > 70)).toBe('safe');
    });

    it('returns warning when the value fails the predicate', () => {
        expect(statusFromThreshold(50, (v) => v > 70)).toBe('warning');
    });

    it('treats a real zero as data, not as missing', () => {
        expect(statusFromThreshold(0, (v) => v >= 0)).toBe('safe');
        expect(statusFromThreshold(0, (v) => v > 0)).toBe('warning');
    });
});

describe('STATUS_DOT_CLASS', () => {
    it('has a distinct class for every status', () => {
        const classes = Object.values(STATUS_DOT_CLASS);
        expect(new Set(classes).size).toBe(classes.length);
        expect(STATUS_DOT_CLASS['no-data']).not.toMatch(/emerald|amber/);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/dataStatus.test.ts`
Expected: FAIL with "Cannot find module '../dataStatus'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/dataStatus.ts

/**
 * A metric is either genuinely absent (`no-data`) or present and either
 * within tolerance (`safe`) or outside it (`warning`). Never coerce a
 * missing value into `warning`/`safe` via `?? 0` — that renders a fabricated
 * status for data that was never observed.
 */
export type DataStatus = 'safe' | 'warning' | 'no-data';

export function statusFromThreshold(
    value: number | null | undefined,
    isSafe: (v: number) => boolean,
): DataStatus {
    if (value === null || value === undefined) return 'no-data';
    return isSafe(value) ? 'safe' : 'warning';
}

export const STATUS_DOT_CLASS: Record<DataStatus, string> = {
    safe: 'bg-emerald-500',
    warning: 'bg-amber-500',
    'no-data': 'bg-white/15',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/dataStatus.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/dataStatus.ts src/lib/__tests__/dataStatus.test.ts
git commit -m "feat: add null-aware data status helper"
```

---

### Task 2: Fix `ingest-mospi` missing `as_of_date` on ASI upserts

**Context:** `ingestion_logs` shows `ingest-mospi` failing on every run in production with `null value in column "as_of_date" of relation "india_asi" violates not-null constraint`. The bug: `upsertEnergyData`'s payload sets `as_of_date` (line 76 today), but the ASI-ingestion `grouped[key]` payload built in the same file never sets it.

**Files:**
- Modify: `supabase/functions/ingest-mospi/index.ts:110-118`
- Test: `supabase/functions/ingest-mospi/index.test.ts`

**Interfaces:**
- Modify: export `doIngestMospi` (currently unexported) so it is directly testable, matching the pattern the plan's test uses.

- [ ] **Step 1: Export the function under test**

In `supabase/functions/ingest-mospi/index.ts:8`, change:

```ts
async function doIngestMospi(supabase: any): Promise<IngestResult> {
```

to:

```ts
export async function doIngestMospi(supabase: any): Promise<IngestResult> {
```

- [ ] **Step 2: Write the failing test**

```ts
// supabase/functions/ingest-mospi/index.test.ts
/**
 * Run with an explicit path (not auto-included by vitest.config.ts):
 *   npx vitest run supabase/functions/ingest-mospi/index.test.ts
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('./mospi-client.ts', () => ({
    MoSPIClient: vi.fn().mockImplementation(() => ({
        getEnergyData: vi.fn().mockResolvedValue({ data: [] }),
        getASIData: vi.fn().mockResolvedValue({
            data: [
                { state: 'Maharashtra', year: '2024-25', sector: 'Manufacturing', indicator: 'Gross Value Added', value: '120000' },
                { state: 'Maharashtra', year: '2024-25', sector: 'Manufacturing', indicator: 'Total Number of Persons Engaged', value: '500000' },
            ],
        }),
    })),
}));

vi.mock('../_shared/ingest_utils.ts', () => ({
    upsertObservations: vi.fn().mockResolvedValue({ count: 1 }),
}));

import { doIngestMospi } from './index.ts';

function makeSupabaseMock() {
    const upsertCalls: { table: string; payload: unknown }[] = [];
    return {
        client: {
            from: (table: string) => ({
                upsert: (payload: unknown) => {
                    upsertCalls.push({ table, payload });
                    return Promise.resolve({ error: null });
                },
            }),
        },
        upsertCalls,
    };
}

describe('doIngestMospi ASI ingestion', () => {
    it('always sets a non-null as_of_date on india_asi upserts', async () => {
        const { client, upsertCalls } = makeSupabaseMock();

        await doIngestMospi(client as any);

        const asiCalls = upsertCalls.filter((c) => c.table === 'india_asi');
        expect(asiCalls.length).toBeGreaterThan(0);
        for (const call of asiCalls) {
            expect((call.payload as { as_of_date?: string }).as_of_date).toBeTruthy();
        }
    });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run supabase/functions/ingest-mospi/index.test.ts`
Expected: FAIL — `as_of_date` is `undefined` on the `india_asi` upsert payload

- [ ] **Step 4: Fix the payload**

In `supabase/functions/ingest-mospi/index.ts:107-118`, change:

```ts
                const grouped: any = {};
                for (const row of asiResponse.data) {
                    const key = `${row.year}_${row.sector}`;
                    if (!grouped[key]) grouped[key] = {
                        state_code: sc,
                        state_name: row.state,
                        year: parseInt(String(row.year).split('-')[0]) || new Date().getFullYear(),
                        sector: String(row.sector || "").toLowerCase(),
                        gva_crores: 0,
                        employment_thousands: 0,
                        fixed_capital_crores: 0
                    };
```

to:

```ts
                const grouped: any = {};
                for (const row of asiResponse.data) {
                    const key = `${row.year}_${row.sector}`;
                    if (!grouped[key]) {
                        const year = parseInt(String(row.year).split('-')[0]) || new Date().getFullYear();
                        grouped[key] = {
                            state_code: sc,
                            state_name: row.state,
                            year,
                            sector: String(row.sector || "").toLowerCase(),
                            gva_crores: 0,
                            employment_thousands: 0,
                            fixed_capital_crores: 0,
                            as_of_date: `${year}-01-01`,
                            last_updated_at: new Date().toISOString(),
                        };
                    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run supabase/functions/ingest-mospi/index.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/ingest-mospi/index.ts supabase/functions/ingest-mospi/index.test.ts
git commit -m "fix: set as_of_date on india_asi upserts to stop ingest-mospi failing every run"
```

---

### Task 3: Fix `ingest-fiscaldata`'s IMF endpoint DNS failure

**Context:** `ingestion_logs` shows `ingest-fiscaldata` failing on every run with a DNS resolution error against `http://dataservices.imf.org/...`. The URL is built with the plaintext `http://` scheme.

**Files:**
- Modify: `supabase/functions/ingest-fiscaldata/index.ts:42`

**Interfaces:** None — internal to `fetchCbGoldNet`.

- [ ] **Step 1: Write the failing test**

```ts
// supabase/functions/ingest-fiscaldata/index.test.ts
/**
 * Run with an explicit path (not auto-included by vitest.config.ts):
 *   npx vitest run supabase/functions/ingest-fiscaldata/index.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('ingest-fiscaldata IMF endpoint', () => {
    it('uses https, not http, for the IMF SDMX endpoint', () => {
        const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf-8');
        expect(source).not.toContain('http://dataservices.imf.org');
        expect(source).toContain('https://dataservices.imf.org');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run supabase/functions/ingest-fiscaldata/index.test.ts`
Expected: FAIL — source still contains `http://dataservices.imf.org`

- [ ] **Step 3: Fix the URL**

In `supabase/functions/ingest-fiscaldata/index.ts:42`, change:

```ts
  const url = `http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/A..RAXG_FO.`
```

to:

```ts
  const url = `https://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/A..RAXG_FO.`
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run supabase/functions/ingest-fiscaldata/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/ingest-fiscaldata/index.ts supabase/functions/ingest-fiscaldata/index.test.ts
git commit -m "fix: use https for the IMF SDMX endpoint in ingest-fiscaldata"
```

---

### Task 4: Fix `ingest-macro-news-headlines`'s undefined-variable bugs

**Context:** `ingestion_logs` shows this function logging `status: failed` on every run — `"rows_inserted is not defined"` (success path) or `"e is not defined"` (error path) — even though headlines are verifiably landing in `macro_news_headlines` (confirmed via `SELECT max(ingested_at)`). The function does real work correctly but then throws on its own return/catch statements, poisoning the failure signal so a genuine future outage would look identical to this permanent false alarm.

**Files:**
- Modify: `supabase/functions/ingest-macro-news-headlines/index.ts:209`, `:222`

**Interfaces:**
- Modify: export the handler body as `doIngestMacroNewsHeadlines(supabase)` so it is directly testable (currently inlined in the `serveIngest(...)` call).

- [ ] **Step 1: Extract and export the handler**

In `supabase/functions/ingest-macro-news-headlines/index.ts`, change the structure from an inline arrow function passed to `serveIngest` into a named, exported async function that `serveIngest` calls. Replace lines 55-224 (the full `serveIngest('ingest-macro-news-headlines', async (req: Request) => { ... })` block) with:

```ts
export async function doIngestMacroNewsHeadlines(supabase: any) {
    // Start logging
    const logId = await logIngestionStart(supabase, 'ingest-macro-news-headlines');

    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        })

        console.log('Starting Macro News ingestion...')
        const articles: any[] = []

        for (const feed of FEEDS) {
            try {
                await withTimeout((async () => {
                    let attempt = 0;
                    const maxRetries = 2;
                    let success = false;

                    while (attempt < maxRetries && !success) {
                        try {
                            console.log(`Fetching ${feed.source} feed (attempt ${attempt + 1})...`)
                            const response = await fetch(feed.url, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                                }
                            })
                            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

                            const xml = await response.text()
                            const jsonObj = parser.parse(xml)

                            const items = jsonObj.rss?.channel?.item || jsonObj.feed?.entry || []
                            const itemList = Array.isArray(items) ? items : [items]

                            const feedArticles = itemList.map((item: any) => {
                                let link = item.link;
                                if (typeof link === 'object' && link['@_href']) {
                                    link = link['@_href'];
                                } else if (Array.isArray(link)) {
                                    const preferred = link.find((l: any) => l['@_rel'] === 'alternate' || !l['@_rel']);
                                    link = preferred ? (preferred['@_href'] || preferred) : link[0];
                                }

                                if ((!link || typeof link !== 'string') && item.guid) {
                                    link = typeof item.guid === 'object' ? item.guid['#text'] || item.guid['@_isPermaLink'] : item.guid;
                                }

                                return {
                                    title: item.title?.['#text'] || item.title || 'Untitled Article',
                                    link: link,
                                    source: feed.source,
                                    region: feed.region,
                                    published_at: item.pubDate || item.updated || item.published || new Date().toISOString()
                                };
                            }).filter((a: any) => isValidUrl(a.link));

                            articles.push(...feedArticles)
                            success = true
                        } catch (e: any) {
                            attempt++
                            console.error(`Error fetching ${feed.source}:`, e.message)
                            if (attempt < maxRetries) {
                                await new Promise(r => setTimeout(r, 1000 * attempt))
                            }
                        }
                    }
                })(), 45000, `News Ingestion for ${feed.source}`);
            } catch (err: any) {
                console.error(`Feed ${feed.source} timed out or failed:`, err.message);
            }
        }

        console.log(`Total articles fetched: ${articles.length}`)

        const filteredArticles = articles.filter(article => {
            const textToSearch = `${article.title}`.toLowerCase()
            const matchingKeywords = KEYWORDS.filter(keyword =>
                textToSearch.includes(keyword.toLowerCase())
            )

            if (matchingKeywords.length > 0) {
                article.keywords = matchingKeywords
                return true
            }
            return false
        })

        console.log(`Articles matching macro keywords: ${filteredArticles.length}`)

        if (filteredArticles.length > 0) {
            const { error: upsertError } = await supabase
                .from('macro_news_headlines')
                .upsert(
                    filteredArticles.map(a => {
                        const textLower = a.title.toLowerCase();
                        const isIndiaSource = a.region === 'india';
                        const hasIndiaKeyword = INDIA_KEYWORDS.some(k => textLower.includes(k.toLowerCase()));
                        const category = (isIndiaSource || hasIndiaKeyword) ? 'India' : 'Global';

                        return {
                            title: a.title,
                            link: a.link,
                            source: a.source,
                            published_at: new Date(a.published_at).toISOString(),
                            keywords: a.keywords,
                            category: category,
                        };
                    }),
                    { onConflict: 'link', ignoreDuplicates: true }
                )

            if (upsertError) throw upsertError
        }

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { error: deleteError } = await supabase
            .from('macro_news_headlines')
            .delete()
            .lt('published_at', thirtyDaysAgo.toISOString())

        if (deleteError) console.error('Error deleting old articles:', deleteError)
        else console.log(`Cleaned up old articles.`)

        const summary = {
            message: 'Ingestion complete',
            total_fetched: articles.length,
            total_filtered: filteredArticles.length
        };

        await logIngestionEnd(supabase, logId, 'success', {
            rows_inserted: filteredArticles.length,
            metadata: { summary }
        });

        return { ok: true, counts: { upserted: filteredArticles.length } };
    } catch (error: any) {
        console.error('Master Error:', error.message)

        try {
            if (logId) {
                await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
            }
        } catch (logErr) {
            console.error('Failed to log News Ingestion end:', logErr);
        }

        throw error;
    }
}

serveIngest('ingest-macro-news-headlines', async (_req: Request) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    return doIngestMacroNewsHeadlines(supabase)
})
```

Note the two bug fixes embedded above versus the current file: the success return is `{ ok: true, counts: { upserted: filteredArticles.length } }` (was the undefined `rows_inserted`), and the catch block re-throws `error` (was the undefined `e`).

- [ ] **Step 2: Write the failing test (against the pre-fix behavior, to confirm the extraction alone doesn't silently fix it)**

```ts
// supabase/functions/ingest-macro-news-headlines/index.test.ts
/**
 * Run with an explicit path (not auto-included by vitest.config.ts):
 *   npx vitest run supabase/functions/ingest-macro-news-headlines/index.test.ts
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../_shared/logging.ts', () => ({
    logIngestionStart: vi.fn().mockResolvedValue('log-1'),
    logIngestionEnd: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../_shared/timeout-guard.ts', () => ({
    withTimeout: (p: Promise<unknown>) => p,
}));

// No network in tests: force every feed fetch to fail fast so the function
// exercises the "zero articles, upsert skipped" path deterministically.
const originalFetch = globalThis.fetch;
beforeAllFetchMock();
function beforeAllFetchMock() {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network disabled in test'));
}

import { doIngestMacroNewsHeadlines } from './index.ts';

function makeSupabaseMock() {
    return {
        from: () => ({
            upsert: () => Promise.resolve({ error: null }),
            delete: () => ({ lt: () => Promise.resolve({ error: null }) }),
        }),
    };
}

describe('doIngestMacroNewsHeadlines', () => {
    afterAllRestoreFetch();
    function afterAllRestoreFetch() {
        // restored after the describe block via afterAll below
    }

    it('resolves with a real upserted count instead of throwing on an undefined variable', async () => {
        const result = await doIngestMacroNewsHeadlines(makeSupabaseMock() as any);
        expect(result).toEqual({ ok: true, counts: { upserted: 0 } });
    });

    it('does not throw a ReferenceError if the upsert step itself fails', async () => {
        const failingSupabase = {
            from: () => ({
                upsert: () => Promise.resolve({ error: { message: 'boom' } }),
                delete: () => ({ lt: () => Promise.resolve({ error: null }) }),
            }),
        };
        // Zero articles means upsert is never called, so force a delete failure
        // path instead is not representative; assert instead that a thrown
        // error is the *real* underlying error, not "e is not defined".
        await expect(doIngestMacroNewsHeadlines(failingSupabase as any)).resolves.toEqual({
            ok: true,
            counts: { upserted: 0 },
        });
    });
});

afterAll(() => {
    globalThis.fetch = originalFetch;
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run supabase/functions/ingest-macro-news-headlines/index.test.ts`
Expected: FAIL — `doIngestMacroNewsHeadlines` is not exported yet (module only exports the `serveIngest(...)` side effect)

- [ ] **Step 4: Apply Step 1's refactor** (already written above with both bugs fixed)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run supabase/functions/ingest-macro-news-headlines/index.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/ingest-macro-news-headlines/index.ts supabase/functions/ingest-macro-news-headlines/index.test.ts
git commit -m "fix: resolve undefined-variable bugs masking ingest-macro-news-headlines' real status"
```

---

### Task 5: Remove fabricated PMI fallback in `ChinaRealEconomyPanel`

**Context:** `latestNBS = pmiData[...]?.NBS ?? 50.1` and `latestCaixin = ... ?? 50.5` render a hardcoded "Expanding" PMI gauge when `china_macro_pulse` has no PMI rows for the window — a direct fabricated-data violation, live on the public China Macro Pulse page.

**Files:**
- Modify: `src/features/dashboard/components/sections/ChinaRealEconomyPanel.tsx:56-118`
- Test: `src/features/dashboard/components/sections/__tests__/ChinaRealEconomyPanel.test.tsx`

**Interfaces:**
- Consumes: `DataStatePanel` from `@/components/DataStatePanel` (props: `variant`, `title`, `description`, `accentColor`, `height` — see Task 1's sibling usage in `FuelSecurityClockIndia.tsx`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/dashboard/components/sections/__tests__/ChinaRealEconomyPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChinaRealEconomyPanel } from '../ChinaRealEconomyPanel';

vi.mock('@/hooks/useChinaMacro', () => ({
    useChinaMacroPulse: () => ({ data: [], isLoading: false }),
    useLatestChinaMetric: () => ({ data: undefined }),
}));

describe('ChinaRealEconomyPanel', () => {
    it('shows a no-data state instead of a fabricated PMI reading when history is empty', () => {
        render(<ChinaRealEconomyPanel />);

        expect(screen.queryByText('50.1')).not.toBeInTheDocument();
        expect(screen.queryByText('50.5')).not.toBeInTheDocument();
        expect(screen.queryByText(/Expanding/i)).not.toBeInTheDocument();
        expect(screen.getByText(/PMI data unavailable/i)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/ChinaRealEconomyPanel.test.tsx`
Expected: FAIL — the gauge renders `50.1` / `Expanding` instead of a no-data message

- [ ] **Step 3: Fix the component**

In `src/features/dashboard/components/sections/ChinaRealEconomyPanel.tsx`, add the import (near the top, alongside the other imports):

```ts
import { DataStatePanel } from '@/components/DataStatePanel';
```

Change line 75-76 from:

```ts
    const latestNBS = pmiData[pmiData.length - 1]?.NBS ?? 50.1;
    const latestCaixin = pmiData[pmiData.length - 1]?.Caixin ?? 50.5;
```

to:

```ts
    const latestNBS = pmiData[pmiData.length - 1]?.NBS;
    const latestCaixin = pmiData[pmiData.length - 1]?.Caixin;
    const hasPmiData = latestNBS != null && latestCaixin != null;
```

Then wrap the "PMI Dual Gauge" block (currently lines 100-118) so it only renders when data exists, falling back to `DataStatePanel` otherwise. Replace:

```tsx
                    {/* PMI Dual Gauge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'NBS PMI', value: latestNBS, sub: 'Official Manufacturing PMI', color: 'text-red-400' },
                            { label: 'Caixin PMI', value: latestCaixin, sub: 'Private sector / SME focus', color: 'text-amber-400' },
                        ].map(({ label, value, sub, color }) => {
                            const s = pmiStatus(value);
                            return (
                                <div key={label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center gap-2">
                                    <GaugeNeedle value={value} />
                                    <p className={cn('text-3xl font-black tabular-nums tracking-heading', color)}>{value.toFixed(1)}</p>
                                    <p className={cn('text-xs font-black uppercase tracking-uppercase', s.cls)}>{s.label}</p>
                                    <p className="text-xs font-black text-white/50 uppercase tracking-uppercase">{label}</p>
                                    <p className="text-xs text-muted-foreground/40">{sub}</p>
                                    <div className={cn('w-full h-0.5 rounded-full mt-1', value >= 50 ? 'bg-emerald-500/30' : 'bg-rose-500/30')} />
                                    <p className="text-xs text-muted-foreground/30">50.0 expansion threshold</p>
                                </div>
                            );
                        })}
                    </div>
```

with:

```tsx
                    {/* PMI Dual Gauge */}
                    {hasPmiData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'NBS PMI', value: latestNBS as number, sub: 'Official Manufacturing PMI', color: 'text-red-400' },
                                { label: 'Caixin PMI', value: latestCaixin as number, sub: 'Private sector / SME focus', color: 'text-amber-400' },
                            ].map(({ label, value, sub, color }) => {
                                const s = pmiStatus(value);
                                return (
                                    <div key={label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center gap-2">
                                        <GaugeNeedle value={value} />
                                        <p className={cn('text-3xl font-black tabular-nums tracking-heading', color)}>{value.toFixed(1)}</p>
                                        <p className={cn('text-xs font-black uppercase tracking-uppercase', s.cls)}>{s.label}</p>
                                        <p className="text-xs font-black text-white/50 uppercase tracking-uppercase">{label}</p>
                                        <p className="text-xs text-muted-foreground/40">{sub}</p>
                                        <div className={cn('w-full h-0.5 rounded-full mt-1', value >= 50 ? 'bg-emerald-500/30' : 'bg-rose-500/30')} />
                                        <p className="text-xs text-muted-foreground/30">50.0 expansion threshold</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <DataStatePanel
                            variant="empty"
                            title="PMI data unavailable"
                            description="China NBS/Caixin manufacturing PMI has not reported for the requested window."
                            accentColor="amber"
                            height={220}
                        />
                    )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/ChinaRealEconomyPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/sections/ChinaRealEconomyPanel.tsx src/features/dashboard/components/sections/__tests__/ChinaRealEconomyPanel.test.tsx
git commit -m "fix: remove fabricated PMI fallback values, show empty state instead"
```

---

### Task 6: Fix status-dot fabrication in `ChinaExternalSectorPanel`

**Context:** The KPI row computes `status: (latestTrade?.value ?? 0) > 70 ? 'safe' : 'warning'` (and the same for export growth and FX reserves) — when the metric is null, the numeric text correctly shows `'--'`, but the colored status dot still renders a confident green/amber verdict.

**Files:**
- Modify: `src/features/dashboard/components/sections/ChinaExternalSectorPanel.tsx:59-92`
- Test: `src/features/dashboard/components/sections/__tests__/ChinaExternalSectorPanel.test.tsx`

**Interfaces:**
- Consumes: `statusFromThreshold`, `STATUS_DOT_CLASS` from `@/lib/dataStatus` (Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/dashboard/components/sections/__tests__/ChinaExternalSectorPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, container as _c } from '@testing-library/react';
import { ChinaExternalSectorPanel } from '../ChinaExternalSectorPanel';

vi.mock('@/hooks/useChinaMacro', () => ({
    useChinaMacroPulse: () => ({ data: [] }),
    useLatestChinaMetric: () => ({ data: undefined }),
}));

describe('ChinaExternalSectorPanel', () => {
    it('renders a neutral no-data dot, not a green/amber verdict, when metrics are missing', () => {
        const { container } = render(<ChinaExternalSectorPanel />);
        const dots = container.querySelectorAll('.w-1\\.5.h-1\\.5.rounded-full');
        expect(dots.length).toBe(3);
        dots.forEach((dot) => {
            expect(dot.className).not.toMatch(/bg-emerald-500|bg-amber-500/);
            expect(dot.className).toMatch(/bg-white\/15/);
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/ChinaExternalSectorPanel.test.tsx`
Expected: FAIL — dots render `bg-amber-500` (from the `?? 0` fallback evaluating to `warning`)

- [ ] **Step 3: Fix the component**

In `src/features/dashboard/components/sections/ChinaExternalSectorPanel.tsx`, add the import:

```ts
import { statusFromThreshold, STATUS_DOT_CLASS } from '@/lib/dataStatus';
```

Replace lines 59-92 (the KPI Row array) from:

```tsx
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Trade Balance',
                        value: latestTrade?.value != null ? `$${latestTrade.value.toFixed(1)}Bn` : '--',
                        sub: 'Monthly surplus/deficit',
                        color: 'text-blue-400',
                        status: (latestTrade?.value ?? 0) > 70 ? 'safe' : 'warning',
                    },
                    {
                        label: 'Export Growth',
                        value: latestExports?.value != null ? `${latestExports.value >= 0 ? '+' : ''}${latestExports.value.toFixed(1)}%` : '--',
                        sub: 'YoY nominal exports',
                        color: (latestExports?.value ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400',
                        status: (latestExports?.value ?? 0) >= 0 ? 'safe' : 'warning',
                    },
                    {
                        label: 'PBOC FX Reserves',
                        value: latestFX?.value != null ? `$${latestFX.value.toFixed(2)}Tn` : '--',
                        sub: 'Total foreign exchange holdings',
                        color: 'text-cyan-400',
                        status: (latestFX?.value ?? 0) > 3.0 ? 'safe' : 'warning',
                    },
                ].map(({ label, value, sub, color, status }) => (
                    <div key={label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase">{label}</p>
                            <div className={cn('w-1.5 h-1.5 rounded-full', status === 'safe' ? 'bg-emerald-500' : 'bg-amber-500')} />
                        </div>
                        <p className={cn('text-3xl font-black tabular-nums tracking-heading mb-1', color)}>{value}</p>
                        <p className="text-xs text-muted-foreground/40">{sub}</p>
                    </div>
                ))}
            </div>
```

to:

```tsx
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Trade Balance',
                        value: latestTrade?.value != null ? `$${latestTrade.value.toFixed(1)}Bn` : '--',
                        sub: 'Monthly surplus/deficit',
                        color: 'text-blue-400',
                        status: statusFromThreshold(latestTrade?.value, (v) => v > 70),
                    },
                    {
                        label: 'Export Growth',
                        value: latestExports?.value != null ? `${latestExports.value >= 0 ? '+' : ''}${latestExports.value.toFixed(1)}%` : '--',
                        sub: 'YoY nominal exports',
                        color: (latestExports?.value ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400',
                        status: statusFromThreshold(latestExports?.value, (v) => v >= 0),
                    },
                    {
                        label: 'PBOC FX Reserves',
                        value: latestFX?.value != null ? `$${latestFX.value.toFixed(2)}Tn` : '--',
                        sub: 'Total foreign exchange holdings',
                        color: 'text-cyan-400',
                        status: statusFromThreshold(latestFX?.value, (v) => v > 3.0),
                    },
                ].map(({ label, value, sub, color, status }) => (
                    <div key={label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase">{label}</p>
                            <div className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT_CLASS[status])} />
                        </div>
                        <p className={cn('text-3xl font-black tabular-nums tracking-heading mb-1', color)}>{value}</p>
                        <p className="text-xs text-muted-foreground/40">{sub}</p>
                    </div>
                ))}
            </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/ChinaExternalSectorPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/sections/ChinaExternalSectorPanel.tsx src/features/dashboard/components/sections/__tests__/ChinaExternalSectorPanel.test.tsx
git commit -m "fix: stop coercing missing China trade metrics into a fake safe/warning verdict"
```

---

### Task 7: Fix radar/interpretation fabrication in `ChinaProprietarySignals`

**Context:** `radarData` computes chart values like `50 + (latestCI?.value ?? 0) * 15` and each `SignalCard`'s `interpretation` prop picks confident narrative text (`'🟢 Rising impulse → bullish for commodities...'`) purely from `(latestCI?.value ?? 0) > 1.5` — when the underlying metric is missing, this renders a specific, wrong, confidently-worded analyst call instead of "no data."

**Files:**
- Modify: `src/features/dashboard/components/sections/ChinaProprietarySignals.tsx:60-149` (pattern repeats per signal card; fix `China Credit Impulse` and `De-Dollarization Velocity` explicitly, applying the identical pattern to `Corporate Distress Score` and any remaining card in the same file)
- Test: `src/features/dashboard/components/sections/__tests__/ChinaProprietarySignals.test.tsx`

**Interfaces:**
- Consumes: `statusFromThreshold` from `@/lib/dataStatus` (Task 1) to gate the interpretation text; radar chart values are excluded from the null-coercion fix by omitting that subject's point entirely (see Step 3) rather than plotting a fabricated midpoint.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/dashboard/components/sections/__tests__/ChinaProprietarySignals.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChinaProprietarySignals } from '../ChinaProprietarySignals';

vi.mock('@/hooks/useChinaMacro', () => ({
    useChinaMacroPulse: () => ({ data: [] }),
    useLatestChinaMetric: () => ({ data: undefined }),
}));

describe('ChinaProprietarySignals', () => {
    it('does not render a confident bullish/bearish interpretation when the metric is missing', () => {
        render(<ChinaProprietarySignals />);
        expect(screen.queryByText(/Rising impulse/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/USD dominance stable/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/No data available/i).length).toBeGreaterThan(0);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/ChinaProprietarySignals.test.tsx`
Expected: FAIL — `'⬜ USD dominance stable'` still renders from the `?? 0` fallback

- [ ] **Step 3: Fix the component**

In `src/features/dashboard/components/sections/ChinaProprietarySignals.tsx`, add the import:

```ts
import { statusFromThreshold } from '@/lib/dataStatus';
```

Replace the `China Credit Impulse` card's `interpretation` prop (lines 102-108) from:

```tsx
                    interpretation={
                        (latestCI?.value ?? 0) > 1.5
                            ? '🟢 Rising impulse → bullish for commodities & EM equities in 9-12M'
                            : (latestCI?.value ?? 0) > 0
                            ? '🟡 Positive but decelerating → mixed signal'
                            : '🔴 Negative impulse → demand contraction signal'
                    }
```

to:

```tsx
                    interpretation={
                        latestCI?.value == null
                            ? 'No data available for this window.'
                            : latestCI.value > 1.5
                            ? '🟢 Rising impulse → bullish for commodities & EM equities in 9-12M'
                            : latestCI.value > 0
                            ? '🟡 Positive but decelerating → mixed signal'
                            : '🔴 Negative impulse → demand contraction signal'
                    }
```

Replace the `De-Dollarization Velocity` card's `interpretation` prop (lines 120-126) from:

```tsx
                    interpretation={
                        (latestDD?.value ?? 0) < -1.0
                            ? '🔴 Accelerating USD decoupling — CIPS + CNY trade routes expanding'
                            : (latestDD?.value ?? 0) < 0
                            ? '🟡 Slow de-dollarization — structural but gradual'
                            : '⬜ USD dominance stable'
                    }
```

to:

```tsx
                    interpretation={
                        latestDD?.value == null
                            ? 'No data available for this window.'
                            : latestDD.value < -1.0
                            ? '🔴 Accelerating USD decoupling — CIPS + CNY trade routes expanding'
                            : latestDD.value < 0
                            ? '🟡 Slow de-dollarization — structural but gradual'
                            : '⬜ USD dominance stable'
                    }
```

Apply the identical `value == null ? 'No data available for this window.' : ...` guard to the `Corporate Distress Score` card's `interpretation` prop later in the same array (the one keyed off `latestCD?.value`), and to any other `SignalCard` in this file following the same `(latestX?.value ?? 0)` pattern.

Then fix the radar chart so a missing metric is omitted rather than plotted at a fabricated midpoint. Replace lines 61-67:

```ts
    const radarData = [
        { subject: 'Liquidity', value: Math.min(100, Math.max(0, 50 + (latestPBOC?.net_liquidity_signal ?? 0) * 10)) },
        { subject: 'Credit', value: Math.min(100, Math.max(0, 50 + (latestCI?.value ?? 0) * 15)) },
        { subject: 'External', value: 70 },  // Strong surplus — proxy
        { subject: 'USD Decoupling', value: Math.min(100, 60 + Math.abs(latestDD?.value ?? 0) * 20) },
        { subject: 'Margins', value: Math.min(100, Math.max(0, 50 + (latestCD?.value ?? 0) * 5)) },
    ];
```

with:

```ts
    const radarData = [
        latestPBOC?.net_liquidity_signal != null && {
            subject: 'Liquidity',
            value: Math.min(100, Math.max(0, 50 + latestPBOC.net_liquidity_signal * 10)),
        },
        latestCI?.value != null && {
            subject: 'Credit',
            value: Math.min(100, Math.max(0, 50 + latestCI.value * 15)),
        },
        { subject: 'External', value: 70 },  // Strong surplus — proxy
        latestDD?.value != null && {
            subject: 'USD Decoupling',
            value: Math.min(100, 60 + Math.abs(latestDD.value) * 20),
        },
        latestCD?.value != null && {
            subject: 'Margins',
            value: Math.min(100, Math.max(0, 50 + latestCD.value * 5)),
        },
    ].filter(Boolean) as { subject: string; value: number }[];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/ChinaProprietarySignals.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/sections/ChinaProprietarySignals.tsx src/features/dashboard/components/sections/__tests__/ChinaProprietarySignals.test.tsx
git commit -m "fix: stop fabricating bullish/bearish China signal commentary from missing data"
```

---

### Task 8: Fix warn-flag fabrication in `ChinaLGFFiscalPanel`

**Context:** `warn: (specialRefi?.value ?? 0) > 1.5`, `warn: (netIssuance?.value ?? 0) < 0`, `warn: (landPct?.value ?? 100) < 25` all coerce a missing metric into a definitive true/false amber-highlight decision, even though the number itself correctly renders `—`.

**Files:**
- Modify: `src/features/dashboard/components/rows/ChinaLGFFiscalPanel.tsx:84-113`
- Test: `src/features/dashboard/components/rows/__tests__/ChinaLGFFiscalPanel.test.tsx`

**Interfaces:**
- Consumes: nothing external — fixed with a plain `!= null` guard per field (no shared helper needed since `warn` here is a boolean, not a three-state status).

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/dashboard/components/rows/__tests__/ChinaLGFFiscalPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, container as _c } from '@testing-library/react';
import { ChinaLGFFiscalPanel } from '../ChinaLGFFiscalPanel';

vi.mock('@/hooks/useChinaMacro', () => ({
    useChinaMacroPulse: () => ({ data: [] }),
    useLatestChinaMetric: () => ({ data: undefined }),
}));

describe('ChinaLGFFiscalPanel', () => {
    it('does not highlight a warning card when the underlying metric is missing', () => {
        const { container } = render(<ChinaLGFFiscalPanel />);
        const warningCards = container.querySelectorAll('.bg-amber-500\\/\\[0\\.04\\]');
        // Only "LGFV Debt Outstanding" carries a hardcoded warn:true by design;
        // the other three must not warn when their value is undefined.
        expect(warningCards.length).toBeLessThanOrEqual(1);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/rows/__tests__/ChinaLGFFiscalPanel.test.tsx`
Expected: FAIL — `landPct` missing evaluates `(undefined ?? 100) < 25` → `false`, but `specialRefi`/`netIssuance` missing evaluate to `warn: false`/`warn: true` inconsistently by accident of their thresholds, producing a flaky/wrong warn state rather than a principled "no data, don't warn" rule

- [ ] **Step 3: Fix the component**

In `src/features/dashboard/components/rows/ChinaLGFFiscalPanel.tsx:84-113`, change:

```ts
                {[
                    {
                        label: 'LGFV Debt Outstanding',
                        value: lgfvDebt?.value,
                        range: lgfvDebt ? `${lgfvDebt.value_low}–${lgfvDebt.value_high}` : null,
                        unit: 'CNY Tn',
                        warn: true,
                    },
                    {
                        label: 'Special Refinancing Issued',
                        value: specialRefi?.value,
                        range: specialRefi ? `${specialRefi.value_low}–${specialRefi.value_high}` : null,
                        unit: 'CNY Tn',
                        warn: (specialRefi?.value ?? 0) > 1.5,
                    },
                    {
                        label: 'LGFV Net Issuance',
                        value: netIssuance?.value,
                        range: null,
                        unit: 'CNY Tn',
                        warn: (netIssuance?.value ?? 0) < 0,
                    },
                    {
                        label: 'Land Revenue / LG Revenue',
                        value: landPct?.value,
                        range: null,
                        unit: '%',
                        warn: (landPct?.value ?? 100) < 25,
                    },
                ].map(({ label, value, range, unit, warn }) => (
```

to:

```ts
                {[
                    {
                        label: 'LGFV Debt Outstanding',
                        value: lgfvDebt?.value,
                        range: lgfvDebt ? `${lgfvDebt.value_low}–${lgfvDebt.value_high}` : null,
                        unit: 'CNY Tn',
                        warn: lgfvDebt?.value != null,
                    },
                    {
                        label: 'Special Refinancing Issued',
                        value: specialRefi?.value,
                        range: specialRefi ? `${specialRefi.value_low}–${specialRefi.value_high}` : null,
                        unit: 'CNY Tn',
                        warn: specialRefi?.value != null && specialRefi.value > 1.5,
                    },
                    {
                        label: 'LGFV Net Issuance',
                        value: netIssuance?.value,
                        range: null,
                        unit: 'CNY Tn',
                        warn: netIssuance?.value != null && netIssuance.value < 0,
                    },
                    {
                        label: 'Land Revenue / LG Revenue',
                        value: landPct?.value,
                        range: null,
                        unit: '%',
                        warn: landPct?.value != null && landPct.value < 25,
                    },
                ].map(({ label, value, range, unit, warn }) => (
```

(`LGFV Debt Outstanding` was unconditionally `warn: true` before — a static design choice, not a data-dependent fabrication — so it is preserved as "warn whenever a real value exists," matching this panel's intent that debt outstanding is always flagged for attention when known, and unflagged only when truly absent.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/rows/__tests__/ChinaLGFFiscalPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/rows/ChinaLGFFiscalPanel.tsx src/features/dashboard/components/rows/__tests__/ChinaLGFFiscalPanel.test.tsx
git commit -m "fix: stop coercing missing LGFV metrics into a fabricated warn/no-warn verdict"
```

---

### Task 9: Add empty-data state to `ASISection`

**Context:** `ASISection` has loading and error branches but no empty-data branch. When `india_asi` returns `[]`, it falls through to a full render with an empty map and `avgCapacityUtil` computed as `0 / 1`.

**Files:**
- Modify: `src/features/dashboard/components/sections/ASISection.tsx:52-53`
- Test: `src/features/dashboard/components/sections/__tests__/ASISection.test.tsx`

**Interfaces:**
- Consumes: `DataStatePanel` from `@/components/DataStatePanel`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/dashboard/components/sections/__tests__/ASISection.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ASISection } from '../ASISection';

vi.mock('@/hooks/useIndiaASI', () => ({
    useIndiaASI: () => ({ data: [], isLoading: false, error: null }),
}));
vi.mock('@/hooks/useGeopoliticalExposure', () => ({
    useGeopoliticalExposure: () => ({ data: [] }),
}));

describe('ASISection', () => {
    it('shows an empty state instead of a blank map when india_asi has no rows', () => {
        render(<ASISection />);
        expect(screen.getByText(/ASI industrial data unavailable/i)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/ASISection.test.tsx`
Expected: FAIL — the component renders the full map/rankings UI instead of an empty-state message

- [ ] **Step 3: Fix the component**

In `src/features/dashboard/components/sections/ASISection.tsx`, add the import:

```ts
import { DataStatePanel } from '@/components/DataStatePanel';
```

Change lines 52-53 from:

```tsx
    if (isLoading) return <div className="flex justify-center p-12"><Activity className="animate-spin text-blue-500" /></div>;
    if (error) return <div className="p-8 text-rose-400 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/20">Error loading ASI telemetry</div>;
```

to:

```tsx
    if (isLoading) return <div className="flex justify-center p-12"><Activity className="animate-spin text-blue-500" /></div>;
    if (error) return <div className="p-8 text-rose-400 font-bold bg-rose-500/10 rounded-2xl border border-rose-500/20">Error loading ASI telemetry</div>;
    if (!data || data.length === 0) {
        return (
            <DataStatePanel
                variant="empty"
                title="ASI industrial data unavailable"
                description="Annual Survey of Industries state-level data has not been published for the requested window."
                accentColor="blue"
                height={400}
            />
        );
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/ASISection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/sections/ASISection.tsx src/features/dashboard/components/sections/__tests__/ASISection.test.tsx
git commit -m "fix: show an empty state instead of a blank map when india_asi has no data"
```

---

### Task 10: Replace silent `return null` in `GoldPositioningMonitor`

**Context:** `if (isLoading || !historyData || historyData.length === 0) return null;` makes the entire Gold Derivatives section vanish from the page with zero explanation when `gold_positioning` is empty.

**Files:**
- Modify: `src/features/dashboard/components/sections/GoldPositioningMonitor.tsx:77`
- Test: `src/features/dashboard/components/sections/__tests__/GoldPositioningMonitor.test.tsx`

**Interfaces:**
- Consumes: `DataStatePanel` from `@/components/DataStatePanel`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/dashboard/components/sections/__tests__/GoldPositioningMonitor.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoldPositioningMonitor } from '../GoldPositioningMonitor';

vi.mock('@/hooks/useGoldPositioning', () => ({
    useGoldPositioning: () => ({ data: [], isLoading: false }),
}));

describe('GoldPositioningMonitor', () => {
    it('renders a visible empty state instead of vanishing when history is empty', () => {
        const { container } = render(<GoldPositioningMonitor />);
        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getByText(/Gold positioning data unavailable/i)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/GoldPositioningMonitor.test.tsx`
Expected: FAIL — the component returns `null`, so `container` is empty

- [ ] **Step 3: Fix the component**

In `src/features/dashboard/components/sections/GoldPositioningMonitor.tsx`, add the import:

```ts
import { DataStatePanel } from '@/components/DataStatePanel';
```

Change line 77 from:

```ts
    if (isLoading || !historyData || historyData.length === 0) return null;
```

to:

```ts
    if (isLoading) return null;
    if (!historyData || historyData.length === 0) {
        return (
            <DataStatePanel
                variant="empty"
                title="Gold positioning data unavailable"
                description="CFTC COT positioning and paper/physical basis data has not reported for the requested window."
                accentColor="amber"
                height={300}
            />
        );
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/GoldPositioningMonitor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/sections/GoldPositioningMonitor.tsx src/features/dashboard/components/sections/__tests__/GoldPositioningMonitor.test.tsx
git commit -m "fix: show empty state instead of silently hiding GoldPositioningMonitor"
```

---

### Task 11: Replace silent `return null` in `AfricaMacroSnapshot`

**Context:** Same pattern as Task 10 — `if (!snapshot) return null;` makes the Africa Macro Pulse section vanish from the Terminal homepage and its dedicated lab page with no explanation.

**Files:**
- Modify: `src/features/dashboard/components/sections/AfricaMacroSnapshot.tsx:20`
- Test: `src/features/dashboard/components/sections/__tests__/AfricaMacroSnapshot.test.tsx`

**Interfaces:**
- Consumes: `DataStatePanel` from `@/components/DataStatePanel`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/dashboard/components/sections/__tests__/AfricaMacroSnapshot.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AfricaMacroSnapshot } from '../AfricaMacroSnapshot';

vi.mock('@/hooks/useAfricaMacroSnapshot', () => ({
    useAfricaMacroSnapshot: () => ({ data: null, isLoading: false }),
}));

describe('AfricaMacroSnapshot', () => {
    it('renders a visible empty state instead of vanishing when no snapshot exists', () => {
        const { container } = render(<AfricaMacroSnapshot />);
        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getByText(/Africa macro snapshot unavailable/i)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/AfricaMacroSnapshot.test.tsx`
Expected: FAIL — the component returns `null`

- [ ] **Step 3: Fix the component**

In `src/features/dashboard/components/sections/AfricaMacroSnapshot.tsx`, add the import:

```ts
import { DataStatePanel } from '@/components/DataStatePanel';
```

Change line 20 from:

```ts
    if (!snapshot) return null;
```

to:

```ts
    if (!snapshot) {
        return (
            <DataStatePanel
                variant="empty"
                title="Africa macro snapshot unavailable"
                description="No continental snapshot has been published yet."
                accentColor="blue"
                height={300}
            />
        );
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/sections/__tests__/AfricaMacroSnapshot.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/sections/AfricaMacroSnapshot.tsx src/features/dashboard/components/sections/__tests__/AfricaMacroSnapshot.test.tsx
git commit -m "fix: show empty state instead of silently hiding AfricaMacroSnapshot"
```

---

### Task 12: Fix the sitemap generator

**Context:** `public/sitemap.xml` (regenerated at build time by `scripts/generate-sitemap.ts`) lists `https://graphiquestor.com/demo/`, which has no matching route in `src/App.tsx`, and is missing `/labs/gov-financial-position/`, which is a real, nav-linked route (`src/App.tsx:159`).

**Files:**
- Modify: `scripts/generate-sitemap.ts:91`, add entry near line 93-103

**Interfaces:** None — script-local array of `{ url, changefreq, lastmod }`.

- [ ] **Step 1: Remove the dead `/demo` entry**

In `scripts/generate-sitemap.ts:91`, delete the line:

```ts
    { url: '/demo',                changefreq: 'monthly', lastmod: BUILD_DATE },
```

- [ ] **Step 2: Add the missing route**

In `scripts/generate-sitemap.ts`, in the `/labs/*` block (lines 93-103), add a new entry matching the existing pattern, e.g. immediately after the `/labs/africa-macro` line:

```ts
    { url: '/labs/gov-financial-position', changefreq: 'weekly', lastmod: BUILD_DATE },
```

- [ ] **Step 3: Regenerate and verify**

Run:
```bash
npx tsx scripts/generate-sitemap.ts
grep -c "graphiquestor.com/demo/" public/sitemap.xml
grep -c "graphiquestor.com/labs/gov-financial-position/" public/sitemap.xml
```
Expected: first `grep -c` prints `0`, second prints `1`.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-sitemap.ts public/sitemap.xml
git commit -m "fix: remove dead /demo sitemap entry, add missing /labs/gov-financial-position"
```

---

### Task 13: Fix dead in-content glossary links

**Context:** `SovereignStressLab.tsx` links to `/glossary/sovereign-risk-matrix` and `ShadowSystemLab.tsx` links to `/glossary/shadow-trade-ratio` — neither slug exists in `src/features/glossary/glossaryData.ts`, so both 404 for users and crawlers. Given the institutional-tone requirement that glossary content be precise and verified (not written under launch-day time pressure), the correct pre-launch fix is to remove the broken hyperlink and keep the term as plain emphasized text; a real glossary entry can be authored and linked later as a fast-follow.

**Files:**
- Modify: `src/pages/labs/SovereignStressLab.tsx:144`
- Modify: `src/pages/labs/ShadowSystemLab.tsx:120`

**Interfaces:** None.

- [ ] **Step 1: Fix `SovereignStressLab.tsx`**

Change line 144 from:

```tsx
                        In the multipolar era, sovereign risk is no longer just about debt-to-GDP; it is about the <strong>Interest-to-Revenue Ratio</strong>. When a government spends more on servicing past debt than on future growth (infrastructure or R&D), the regime enters a structural decline. GraphiQuestor's <a href="/glossary/sovereign-risk-matrix" className="text-blue-400 hover:underline">Sovereign Risk Matrix</a> synthesizes these metrics into a real-time stress coordinate, enabling capital allocators to navigate the final stages of the global debt supercycle.
```

to:

```tsx
                        In the multipolar era, sovereign risk is no longer just about debt-to-GDP; it is about the <strong>Interest-to-Revenue Ratio</strong>. When a government spends more on servicing past debt than on future growth (infrastructure or R&D), the regime enters a structural decline. GraphiQuestor's <strong>Sovereign Risk Matrix</strong> synthesizes these metrics into a real-time stress coordinate, enabling capital allocators to navigate the final stages of the global debt supercycle.
```

- [ ] **Step 2: Fix `ShadowSystemLab.tsx`**

Change line 120 from:

```tsx
                        A critical indicator within our surveillance is the <strong>Trade Misinvoicing Index</strong>. By synthesizing bilateral trade data from over 40 countries, GraphiQuestor identifies discrepancies that typically signal illicit financial flows or elite wealth hedging. In the multipolar era, these "dark flows" often precede sovereign currency crises or regime shifts. Our <a href="/glossary/shadow-trade-ratio" className="text-blue-400 hover:underline">Shadow Trade Ratio</a> isolates the volume of trade settlement occurring outside the SWIFT architecture.
```

to:

```tsx
                        A critical indicator within our surveillance is the <strong>Trade Misinvoicing Index</strong>. By synthesizing bilateral trade data from over 40 countries, GraphiQuestor identifies discrepancies that typically signal illicit financial flows or elite wealth hedging. In the multipolar era, these "dark flows" often precede sovereign currency crises or regime shifts. Our <strong>Shadow Trade Ratio</strong> isolates the volume of trade settlement occurring outside the SWIFT architecture.
```

- [ ] **Step 3: Verify no remaining references to the dead slugs**

Run:
```bash
grep -rn "glossary/sovereign-risk-matrix\|glossary/shadow-trade-ratio" src/
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/pages/labs/SovereignStressLab.tsx src/pages/labs/ShadowSystemLab.tsx
git commit -m "fix: remove dead in-content glossary links pending real glossary entries"
```

---

### Task 14: Wire `reportClientError` into `SectionErrorBoundary`

**Context:** `SectionErrorBoundary.componentDidCatch` only calls `console.error`, unlike `GlobalErrorBoundary` and `ErrorBoundary`, which both call `reportClientError`. A section-level crash is therefore invisible to the error-reporting pipeline that already exists and is wired to the `report-client-error` Edge Function.

**Files:**
- Modify: `src/components/SectionErrorBoundary.tsx:1-26`
- Test: `src/components/__tests__/SectionErrorBoundary.test.tsx`

**Interfaces:**
- Consumes: `reportClientError` from `@/lib/errorReporting` — signature `(payload: { message: string; stack?: string; componentStack?: string; route?: string; boundary?: string }) => Promise<void>` (already used identically in `GlobalErrorBoundary.tsx:35-41`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/SectionErrorBoundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionErrorBoundary } from '../SectionErrorBoundary';

const reportClientErrorMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/errorReporting', () => ({
    reportClientError: (...args: unknown[]) => reportClientErrorMock(...args),
}));

function Boom(): JSX.Element {
    throw new Error('section exploded');
}

describe('SectionErrorBoundary', () => {
    it('reports the error to the client error pipeline with the section name', () => {
        render(
            <SectionErrorBoundary name="Gold Positioning">
                <Boom />
            </SectionErrorBoundary>
        );

        expect(screen.getByText(/Latency Breakdown/i)).toBeInTheDocument();
        expect(reportClientErrorMock).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'section exploded',
                boundary: 'SectionErrorBoundary:Gold Positioning',
            })
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/SectionErrorBoundary.test.tsx`
Expected: FAIL — `reportClientErrorMock` was never called

- [ ] **Step 3: Fix the component**

In `src/components/SectionErrorBoundary.tsx`, add the import:

```ts
import { reportClientError } from '@/lib/errorReporting';
```

Change `componentDidCatch` (lines 24-26) from:

```ts
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Error in section "${this.props.name || 'Unknown'}":`, error, errorInfo);
    }
```

to:

```ts
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Error in section "${this.props.name || 'Unknown'}":`, error, errorInfo);
        void reportClientError({
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack ?? undefined,
            route: typeof window !== 'undefined' ? window.location.pathname : undefined,
            boundary: `SectionErrorBoundary:${this.props.name || 'Unknown'}`,
        });
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/__tests__/SectionErrorBoundary.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SectionErrorBoundary.tsx src/components/__tests__/SectionErrorBoundary.test.tsx
git commit -m "fix: report section-level crashes to the client error pipeline"
```

---

### Task 15: Database security hardening migration

**Context:** Supabase's own security advisor flags 40 views as `SECURITY DEFINER` (ERROR level) and 4 functions as anon/authenticated-executable `SECURITY DEFINER` functions that should not be publicly callable: `increment_api_usage` has **no ownership check** — any anonymous caller can pass an arbitrary `key_id` and inflate another user's `api_keys.calls_used`; `refresh_us_sector_summary` lets any anonymous caller `TRUNCATE` and rebuild `us_sector_summary` on demand; `sync_latest_metrics` is a trigger function with no legitimate direct-call use case; `calculate_metric_deltas` lets any anonymous caller trigger a multi-table bulk `UPDATE` scan across 90 days of `metric_observations`. `confirm_subscription` and `manage_subscription` are correctly scoped (token-gated single-row mutations needed for anonymous email-confirmation/unsubscribe links) and must be **left untouched**. The `share-cards` storage bucket is `public = true`, so its `share_cards_public_read` SELECT policy is redundant and only adds unintended list/enumerate capability.

**Files:**
- Create: `supabase/migrations/20260801120000_security_hardening_pre_launch.sql`

**Interfaces:** None — pure DDL.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260801120000_security_hardening_pre_launch.sql

-- 1. Flip all SECURITY DEFINER views flagged by the Supabase security advisor
--    to SECURITY INVOKER. These are all public read-only macro-data
--    aggregation views with no dependency on elevated privileges; switching
--    to invoker mode makes them respect the querying role's own RLS grants
--    instead of the view creator's.
DO $$
DECLARE
    v_name text;
    v_names text[] := ARRAY[
        'vw_gold_ratios', 'vw_country_terminal', 'vw_institutional_dominance',
        'vw_smart_money_collective', 'vw_g20_sovereign', 'vw_g20_reserves_gold',
        'vw_net_liquidity', 'vw_dedollarization', 'vw_upcoming_events',
        'vw_tic_foreign_holders', 'vw_data_integrity_validation',
        'vw_gold_ratios_historical', 'vw_upi_autopay_latest',
        'vw_us_debt_gold_backing', 'vw_gold_ratios_stats',
        'vw_gold_ratios_percentiles', 'vw_gold_returns_events',
        'vw_gold_ratios_tall', 'vw_credit_creation_pulse',
        'vw_geopolitical_risk_index', 'fuel_geopolitical_daily_score',
        'vw_latest_ingestions', 'vw_data_integrity_ledger',
        'vw_sovereign_solvency', 'vw_mutual_fund_universe',
        'vw_latest_uk_traders', 'vw_latest_ingestion', 'vw_india_macro',
        'vw_brics_tracker', 'vw_frusg_net_cost_yearly',
        'vw_frusg_net_cost_concentration', 'vw_frusg_balance_sheet_summary',
        'vw_frusg_bs_line_items', 'vw_frusg_net_position_summary',
        'vw_frusg_reconciliation_summary', 'vw_frusg_cash_balance_summary',
        'vw_mts_agency_outlays_monthly', 'vw_mts_agency_outlays_rank',
        'vw_receipts_by_agency_yearly', 'vw_gfp_narrative_inputs'
    ];
BEGIN
    FOREACH v_name IN ARRAY v_names LOOP
        IF EXISTS (
            SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = v_name
        ) THEN
            EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true);', v_name);
        END IF;
    END LOOP;
END $$;

-- 2. Revoke public EXECUTE on internal maintenance / metering RPCs that have
--    no legitimate anonymous-caller use case. These are called only by
--    scheduled jobs or server-side code already running as service_role,
--    which is unaffected by revoking anon/authenticated grants.
REVOKE EXECUTE ON FUNCTION public.increment_api_usage(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_us_sector_summary() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_latest_metrics() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_metric_deltas() FROM anon, authenticated;

-- NOTE: public.confirm_subscription(text) and public.manage_subscription(text, text)
-- are intentionally left anon/authenticated-executable. Both are token-gated
-- (require a matching confirm_token) and back the public email
-- confirmation/unsubscribe links, which by definition must be reachable by
-- anonymous visitors.

-- 3. Convert the read-only gold-ratios RPC wrapper to invoker mode too, for
--    defense in depth (it is a pure SELECT over a now-invoker view).
ALTER FUNCTION public.get_latest_gold_ratios() SECURITY INVOKER;

-- 4. Drop the redundant public-list policy on the share-cards storage bucket.
--    The bucket is already `public = true`, so individual objects are
--    fetchable by their public URL without any storage.objects SELECT
--    policy. This policy's only effect was to allow enumerating/listing
--    every file in the bucket, which is unintended.
DROP POLICY IF EXISTS share_cards_public_read ON storage.objects;
```

- [ ] **Step 2: Apply the migration locally and verify the linter is clean**

Run:
```bash
supabase db push --local   # or: supabase migration up, per your local workflow
```

Then re-run the Supabase security advisor (via MCP `get_advisors` with `type: "security"`, or the Dashboard's Advisors page) and confirm:
- Zero remaining `security_definer_view` ERROR entries for the 40 views listed above.
- Zero remaining `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable` warnings for `increment_api_usage`, `refresh_us_sector_summary`, `sync_latest_metrics`, `calculate_metric_deltas`.
- `confirm_subscription` and `manage_subscription` still appear (expected — intentionally left as-is) but nothing else new appears.
- Zero remaining `public_bucket_allows_listing` warning for `share-cards`.

- [ ] **Step 3: Smoke-test the frontend against the now-invoker views**

Run the app locally (`npm run dev`) against the migrated database and load a page for each of these representative views to confirm they still return data under the querying role's own privileges (a view that silently broke under `security_invoker` would return empty/permission-denied instead of erroring loudly, so check actual row counts, not just "no crash"):
- `/` (Terminal) — uses `vw_country_terminal`, `vw_net_liquidity`
- `/labs/de-dollarization-gold` — uses `vw_dedollarization`, `vw_gold_ratios`, `vw_gold_ratios_historical`
- `/labs/sovereign-stress` — uses `vw_sovereign_solvency`, `vw_g20_sovereign`

If any view returns fewer rows than before the migration, that view depends on elevated privilege beyond what `anon`/`authenticated` currently has `SELECT` on for its underlying tables — grant the missing `SELECT` on the specific underlying table to the affected role rather than reverting that one view to `SECURITY DEFINER`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260801120000_security_hardening_pre_launch.sql
git commit -m "sec: convert public views to security_invoker, revoke anon/authenticated on internal RPCs, drop redundant storage list policy"
```

---

## Self-Review

**Spec coverage** — every "must fix before public launch" item from the audit maps to a task:
1. Restore `ALPHAVANTAGE_API_KEY` → operational step (below), not a code change.
2. Fabricated PMI fallback → Task 5.
3. `ingest-fiscaldata` DNS failure → Task 3.
4. `ingest-mospi` NOT NULL violation → Task 2.
5. `ingest-macro-news-headlines` logging bug → Task 4.
6. Triage 40 SECURITY DEFINER views → Task 15.
7. `?? 0`-into-status pattern across China panels → Tasks 6, 7, 8 (all three files the audit named, via the shared Task 1 helper where a three-state status applies).
8. Sitemap + dead glossary links → Tasks 12, 13.
9. Africa Macro Pulse disclosure → Task 11 (empty-state fix; the snapshot date is already shown prominently in the header when data *is* present, so the only gap was the silent-vanish case).
10. Externally-verifiable items (Netlify env vars, `VITE_ENABLE_ERROR_REPORTING`) → operational checklist below, since they are not code changes this plan can test.

**Placeholder scan** — no `TBD`/`TODO`/"add appropriate handling" remain; every step has literal code or an exact shell command.

**Type consistency** — `DataStatus`/`statusFromThreshold`/`STATUS_DOT_CLASS` (Task 1) are used with identical names and signatures in Tasks 6 and 7; `DataStatePanel`'s prop names (`variant`, `title`, `description`, `accentColor`, `height`) match its real definition in `src/components/DataStatePanel.tsx` exactly across Tasks 5, 9, 10, 11.

---

## Operational Checklist (not code — do outside this plan's tasks)

- [ ] Set the `ALPHAVANTAGE_API_KEY` secret on the Supabase project (`supabase secrets set ALPHAVANTAGE_API_KEY=...` or via Dashboard → Edge Functions → Secrets) so `ingest-gold`/`ingest-gold-history` stop failing. Verify by invoking `ingest-gold` once and checking `metric_observations` for a fresh `GOLD_PRICE_USD` row.
- [ ] Verify the `GSC_SERVICE_ACCOUNT_KEY` secret is set and valid; `gsc-sync` already has proper retry/Discord-alert logic (`_shared/job-runner.ts`), so check whether Discord alerts have been firing silently for this job.
- [ ] Confirm the Netlify production build has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set — the audit's own build ran without them and fell back to degraded sitemap/snapshot generation by design; this must not be true of the real production build.
- [ ] Confirm the intended production value of `VITE_ENABLE_ERROR_REPORTING` (defaults to off) — decide and set deliberately, don't leave it as an accident of the default.
- [ ] Complete the Phase 3 public-source spot-check (3-5 data points per section against a public source) and Phase 8 manual cross-browser/mobile QA — both require live verification outside this repo's automated tooling.
- [ ] Fast-follow, not required before launch: delete `IndiaMacroDashboard.tsx`/`useIndiaMacroSnapshot.ts`/`india_macro_snapshots` table and the dead `src/features/USC/*` tree per their own "delete after one release" note; consolidate `llm.txt`/`llms.txt`; fix the `commodity_reserves` duplicate index; add a primary key to `fomc_minutes_analysis`.

---

## Eng Review Amendments (2026-08-01)

Locked in via `/plan-eng-review`. Implementers MUST apply these on top of the task text above.

### Scope
- **Full plan (Tasks 1–15)** ships. No scope reduction.
- Operational checklist remains out-of-band (secrets, Netlify env, manual QA).

### Architecture decisions
1. **Task 7 radar External axis:** Do **not** hardcode `{ subject: 'External', value: 70 }`. Omit External unless a real external-sector metric is available; otherwise radar only plots observed axes.
2. **Task 6 export color:** When `latestExports?.value` is null/undefined, use a neutral/muted color (e.g. `text-muted-foreground` or existing default), not `?? 0` → rose. Status dots already use `statusFromThreshold`.
3. **Task 4 news ingest:** Prefer a **surgical fix** — correct `rows_inserted` → `filteredArticles.length` and `throw e` → `throw error`; extract/export `doIngestMacroNewsHeadlines` only as thin wrapper for tests. Do **not** rewrite the entire ~170-line handler body from the plan's pasted dump.
4. **Task 15:** Ship full security migration; **mandatory** post-migrate smoke on `/`, `/labs/de-dollarization-gold`, `/labs/sovereign-stress` with real row counts before merge/deploy. Grant missing underlying `SELECT` if any view goes empty under invoker — do not flip that view back to DEFINER.

### Code quality decisions
5. **Task 15 `increment_api_usage`:** Generated types use `key_id: string`, not `uuid`. Use the real Postgres arg type (`text`/`uuid` verified at apply) and guard REVOKEs so missing/mismatched signatures do not fail the whole migration (dynamic REVOKE over `pg_proc` by name, or `DO $$ ... EXCEPTION` per function).
6. **Task 7 `pbocFedGap`:** Also remove `latestPBOC?.pboc_vs_fed_gap ?? -3.33`. When missing, show no-data / neutral label — never a fabricated −3.33 divergence.
7. **Task 5 PMI gauges:** Per-series empty state. NBS and Caixin each render their own value or their own empty panel independently; do not hide both when only one series is present.

### Test decisions
8. **Task 4:** Add a throw-path regression: with articles present, force upsert error → reject with real message (`boom`), not `ReferenceError` for `e` / `rows_inserted`.
9. **Tasks 5–8:** Add one happy-path smoke each (mock a real value → number/label still appears).
10. **Tasks 12–13:** Add lightweight source/string unit checks: sitemap has no `/demo`, includes `/labs/gov-financial-position`; lab files no longer contain the dead glossary hrefs.

### Performance
- No material performance concerns for this plan.

### Verified bugs still present in tree (pre-implementation)
| Audit item | Evidence |
|---|---|
| MOSPI ASI missing `as_of_date` | `ingest-mospi/index.ts` ASI `grouped[key]` has no `as_of_date` (energy path does) |
| IMF `http://` | `ingest-fiscaldata/index.ts:42` |
| News undefined vars | `return { ... rows_inserted }` and `throw e` with catch `error` |
| PMI fabrication | `ChinaRealEconomyPanel.tsx:75-76` `?? 50.1` / `?? 50.5` |
| Status `?? 0` | China external/proprietary/LGF panels |
| Silent null | Gold + Africa sections |
| Dead `/demo` sitemap | `generate-sitemap.ts:91`; no App route |
| Dead glossary links | `shadow-trade-ratio`, `sovereign-risk-matrix` not in glossary data |
| SectionErrorBoundary | no `reportClientError` (Global/ErrorBoundary already wire it) |
| Security | Prior invoker migration only 13 views; plan lists ~40 remaining |

### What already exists (reuse, don't rebuild)
- `DataStatePanel` — empty/error UI pattern
- `reportClientError` / `ErrorBoundary` / `GlobalErrorBoundary` — copy wiring pattern into SectionErrorBoundary
- `20260719000040_security_invoker_public_views.sql` — already flipped 13 views; Task 15 is additive for the remaining set
- Edge test pattern: colocated `index.test.ts` + explicit vitest path (see `ingest-fred`)

### NOT in scope
- ALPHAVANTAGE / GSC secrets and Netlify env (operational)
- Phase 3 public-source spot-check and Phase 8 browser QA
- Deleting dead IndiaMacroDashboard / USC trees
- Consolidation of `llm.txt` / `llms.txt`
- `commodity_reserves` duplicate index / `fomc_minutes_analysis` PK
- Product marketing launch campaign (see `/launch` separately if needed)

## Implementation Tasks
Synthesized from eng-review findings. Checkbox as you ship.

- [ ] **T1 (P1)** — Apply Eng Review Amendments while executing Tasks 1–15 (do not implement plan text that conflicts with amendments)
- [ ] **T2 (P1)** — Task 15 REVOKE signatures + IF EXISTS / dynamic guards
- [ ] **T3 (P1)** — Task 7 External radar omit + pbocFedGap no-data
- [ ] **T4 (P1)** — Task 4 surgical fix + throw-path test
- [ ] **T5 (P2)** — Happy-path smokes for Tasks 5–8; SEO string tests for 12–13
- [ ] **T6 (P1)** — Mandatory view row-count smoke after Task 15 migration

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 10 issues folded into amendments, 0 critical gaps open |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **VERDICT:** ENG CLEARED — ready to implement with Eng Review Amendments binding.

NO UNRESOLVED DECISIONS
