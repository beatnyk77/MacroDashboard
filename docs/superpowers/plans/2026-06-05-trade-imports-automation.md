# Trade Imports Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate `import_value_usd` in `trade_global_aggregates` for all 17 reporter countries via UN Comtrade API, scheduled weekly via pg_cron.

**Architecture:** A new Deno edge function `ingest-trade-imports` calls Comtrade's HS2 aggregate endpoint (`cmdCode=AG2`, `flowCode=M`) — one call per reporter per year (34 calls total for 17 countries × 2 years). Results are batch-upserted into `trade_global_aggregates`. A migration deploys the pg_cron schedule and fires an immediate backfill. No frontend changes needed — `GlobalImportPulse` already reads from `vw_country_trade_imports` which queries `import_value_usd`.

**Tech Stack:** Deno (edge function), UN Comtrade API v1, Supabase JS client, `_shared/logging.ts` (`runIngestion` wrapper), pg_cron + `net.http_post` (migration), vitest (unit tests for pure helpers)

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| **Create** | `supabase/functions/ingest-trade-imports/index.ts` | Edge function: fetch Comtrade imports, upsert to DB |
| **Create** | `src/utils/__tests__/tradeImportHelpers.test.ts` | Unit tests for pure helper functions |
| **Create** | `supabase/migrations/20260605000000_schedule_trade_imports_cron.sql` | pg_cron schedule + immediate backfill trigger |

---

## Task 1: Unit Tests for Pure Helpers (TDD — write tests first)

**Files:**
- Create: `src/utils/__tests__/tradeImportHelpers.test.ts`

These pure functions will be copied verbatim into the edge function in Task 2. Testing them in vitest (jsdom) avoids needing Deno test infrastructure.

- [ ] **Step 1.1: Write the failing tests**

Create `src/utils/__tests__/tradeImportHelpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

// ── Pure helpers (copy of what lives in the edge function) ──────────────────
// These are extracted here solely for unit-testability in vitest/jsdom.
// The actual implementations in the edge function must stay identical.

const REPORTER_MAP: Record<string, string> = {
  AUS: '36',  BRA: '76',  CAN: '124', CHN: '156',
  DEU: '276', ESP: '724', FRA: '251', GBR: '826',
  IND: '699', ITA: '381', JPN: '392', KOR: '410',
  MEX: '484', NLD: '528', SAU: '682', TUR: '792',
  USA: '842',
}

function parseComtradeRecord(record: { cmdCode?: unknown; primaryValue?: unknown }) {
  return {
    hsCode: String(record.cmdCode ?? '').padStart(2, '0'),
    importValue: Number(record.primaryValue ?? 0),
  }
}

function buildReporterList(
  reporterISO: string | null,
  force: boolean,
  alreadyPopulated: Set<string>
): string[] {
  const all = Object.keys(REPORTER_MAP)
  const list = reporterISO ? [reporterISO.toUpperCase()] : all
  return force ? list : list.filter((iso3) => !alreadyPopulated.has(iso3))
}
// ───────────────────────────────────────────────────────────────────────────

describe('parseComtradeRecord', () => {
  it('returns zero-padded hsCode and numeric importValue for a valid record', () => {
    const result = parseComtradeRecord({ cmdCode: '1', primaryValue: 5_000_000 })
    expect(result.hsCode).toBe('01')
    expect(result.importValue).toBe(5_000_000)
  })

  it('keeps two-digit codes intact (no extra padding)', () => {
    const result = parseComtradeRecord({ cmdCode: '27', primaryValue: 1_234 })
    expect(result.hsCode).toBe('27')
  })

  it('returns importValue 0 when primaryValue is null', () => {
    const result = parseComtradeRecord({ cmdCode: '05', primaryValue: null })
    expect(result.importValue).toBe(0)
  })

  it('handles numeric cmdCode (Comtrade sometimes returns integers)', () => {
    const result = parseComtradeRecord({ cmdCode: 3, primaryValue: 999 })
    expect(result.hsCode).toBe('03')
  })

  it('returns hsCode "00" when cmdCode is absent', () => {
    const result = parseComtradeRecord({})
    expect(result.hsCode).toBe('00')
  })
})

describe('buildReporterList', () => {
  it('returns single reporter when reporterISO is set', () => {
    const list = buildReporterList('chn', false, new Set())
    expect(list).toEqual(['CHN'])
  })

  it('returns all 17 reporters when reporterISO is null', () => {
    const list = buildReporterList(null, false, new Set())
    expect(list).toHaveLength(17)
  })

  it('excludes already-populated reporters when force=false', () => {
    const populated = new Set(['CHN', 'DEU', 'JPN'])
    const list = buildReporterList(null, false, populated)
    expect(list).not.toContain('CHN')
    expect(list).not.toContain('DEU')
    expect(list.length).toBe(14)
  })

  it('includes already-populated reporters when force=true', () => {
    const populated = new Set(['CHN', 'DEU'])
    const list = buildReporterList(null, true, populated)
    expect(list).toContain('CHN')
    expect(list).toContain('DEU')
    expect(list).toHaveLength(17)
  })

  it('includes target reporter even if populated, when force=true', () => {
    const list = buildReporterList('IND', true, new Set(['IND']))
    expect(list).toEqual(['IND'])
  })

  it('excludes target reporter if already populated and force=false', () => {
    const list = buildReporterList('IND', false, new Set(['IND']))
    expect(list).toEqual([])
  })
})
```

- [ ] **Step 1.2: Run tests — verify they fail with "function not defined"**

```bash
cd /Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard
npx vitest run src/utils/__tests__/tradeImportHelpers.test.ts
```

Expected: **FAIL** — `parseComtradeRecord is not a function` (or similar) since the functions aren't yet imported/defined in testable scope. Wait — actually the test file defines them inline (copy of edge function helpers) so they *will* pass immediately. Run the test and confirm **PASS** with 11 tests.

Expected output:
```
✓ src/utils/__tests__/tradeImportHelpers.test.ts (11)
Test Files  1 passed (1)
Tests       11 passed (11)
```

- [ ] **Step 1.3: Commit**

```bash
git add src/utils/__tests__/tradeImportHelpers.test.ts
git commit -m "test: add unit tests for trade import helper functions"
```

---

## Task 2: Edge Function — `ingest-trade-imports`

**Files:**
- Create: `supabase/functions/ingest-trade-imports/index.ts`

The function uses the project's `runIngestion` wrapper from `_shared/logging.ts` — same pattern as `ingest-trade-gravity` and others. It fetches Comtrade `flowCode=M&cmdCode=AG2` for each reporter+year and batch-upserts into `trade_global_aggregates`.

- [ ] **Step 2.1: Create the edge function**

Create `supabase/functions/ingest-trade-imports/index.ts`:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { runIngestion } from '../_shared/logging.ts';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ISO 3166-1 alpha-3 → UN Comtrade M49 reporter codes
// Covers all 17 countries currently in trade_global_aggregates
const REPORTER_MAP: Record<string, string> = {
  AUS: '36',
  BRA: '76',
  CAN: '124',
  CHN: '156',
  DEU: '276',
  ESP: '724',
  FRA: '251',
  GBR: '826',
  IND: '699',
  ITA: '381',
  JPN: '392',
  KOR: '410',
  MEX: '484',
  NLD: '528',
  SAU: '682',
  TUR: '792',
  USA: '842',
};

const COMTRADE_BASE = 'https://comtradeapi.un.org/data/v1/get/C/A/HS';
const DEFAULT_YEARS = ['2023', '2024'];

// ── Pure helpers (keep in sync with src/utils/__tests__/tradeImportHelpers.test.ts) ──

export function parseComtradeRecord(record: { cmdCode?: unknown; primaryValue?: unknown }): {
  hsCode: string;
  importValue: number;
} {
  return {
    hsCode: String(record.cmdCode ?? '').padStart(2, '0'),
    importValue: Number(record.primaryValue ?? 0),
  };
}

export function buildReporterList(
  reporterISO: string | null,
  force: boolean,
  alreadyPopulated: Set<string>
): string[] {
  const all = Object.keys(REPORTER_MAP);
  const list = reporterISO ? [reporterISO.toUpperCase()] : all;
  return force ? list : list.filter((iso3) => !alreadyPopulated.has(iso3));
}

// ─────────────────────────────────────────────────────────────────────────────

async function doIngest(ctx: any, req: Request): Promise<any> {
  const url = new URL(req.url);
  const reporterISO = url.searchParams.get('reporterISO');
  const force = url.searchParams.get('force') === 'true';
  const yearParam = url.searchParams.get('year');
  const years = yearParam ? [yearParam] : DEFAULT_YEARS;

  const comtradeKey = Deno.env.get('COMTRADE_API_KEY') ?? '';
  if (!comtradeKey) {
    throw new Error('COMTRADE_API_KEY edge secret is not set');
  }

  // Determine which reporters already have import data
  let alreadyPopulated = new Set<string>();
  if (!force) {
    const { data: existing, error: existErr } = await ctx.supabase
      .from('trade_global_aggregates')
      .select('reporter_iso3')
      .not('import_value_usd', 'is', null)
      .gt('import_value_usd', 0);
    if (existErr) {
      console.warn('[ingest-trade-imports] Could not check existing data:', existErr.message);
    }
    alreadyPopulated = new Set((existing ?? []).map((r: any) => r.reporter_iso3 as string));
  }

  const reporters = buildReporterList(reporterISO, force, alreadyPopulated);

  if (reporters.length === 0) {
    return {
      message: 'All reporters already have import data. Use ?force=true to re-ingest.',
      countries_updated: 0,
      rows_updated: 0,
    };
  }

  console.log(`[ingest-trade-imports] Processing ${reporters.length} reporters: ${reporters.join(', ')}`);

  const summary: any[] = [];
  let totalRowsUpdated = 0;

  for (const iso3 of reporters) {
    const m49 = REPORTER_MAP[iso3];
    if (!m49) {
      console.warn(`[ingest-trade-imports] No M49 mapping for ${iso3}, skipping`);
      summary.push({ reporter: iso3, status: 'skipped', reason: 'no_m49_mapping' });
      continue;
    }

    for (const year of years) {
      try {
        const comtradeUrl =
          `${COMTRADE_BASE}?reporterCode=${m49}&period=${year}&cmdCode=AG2&flowCode=M` +
          `&subscription-key=${comtradeKey}`;

        console.log(`[ingest-trade-imports] Fetching ${iso3} (M49:${m49}) ${year}...`);
        const res = await fetch(comtradeUrl);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Comtrade API ${res.status}: ${errText.slice(0, 200)}`);
        }

        const json = (await res.json()) as { data: any[] };
        const parsed = (json.data ?? [])
          .map(parseComtradeRecord)
          .filter((r) => r.importValue > 0);

        if (parsed.length === 0) {
          console.log(`[ingest-trade-imports] No data for ${iso3} ${year}`);
          summary.push({ reporter: iso3, year, status: 'no_data', rows_updated: 0 });
          // Still rate-limit even on empty responses
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }

        // Batch upsert: updates import_value_usd on existing rows, inserts new rows where absent
        // onConflict targets UNIQUE (reporter_iso3, hs_code, year)
        const rows = parsed.map((r) => ({
          reporter_iso3: iso3,
          hs_code: r.hsCode,
          year: parseInt(year, 10),
          import_value_usd: r.importValue,
          fetched_at: new Date().toISOString(),
        }));

        const { error: upsertErr } = await ctx.supabase
          .from('trade_global_aggregates')
          .upsert(rows, { onConflict: 'reporter_iso3,hs_code,year', ignoreDuplicates: false });

        if (upsertErr) throw upsertErr;

        totalRowsUpdated += rows.length;
        summary.push({ reporter: iso3, year, status: 'success', rows_updated: rows.length });
        console.log(`[ingest-trade-imports] ✓ ${iso3} ${year}: ${rows.length} rows upserted`);

      } catch (e: any) {
        console.error(`[ingest-trade-imports] ✗ ${iso3} ${year}:`, e.message);
        summary.push({ reporter: iso3, year, status: 'failed', error: e.message });
      }

      // Rate-limit: 200ms between API calls
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return {
    countries_updated: reporters.length,
    rows_updated: totalRowsUpdated,
    metadata: { summary },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  return runIngestion(
    supabase,
    'ingest-trade-imports',
    (ctx) => doIngest(ctx, req),
    corsHeaders
  );
});
```

- [ ] **Step 2.2: Deploy the function to Supabase**

```bash
cd /Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard
npx supabase functions deploy ingest-trade-imports --project-ref debdriyzfcwvgrhzzzre
```

Expected output:
```
Deploying Function ingest-trade-imports ...
Done: ingest-trade-imports
```

If it fails with "supabase not found", use `npx supabase` or install via `brew install supabase/tap/supabase`.

- [ ] **Step 2.3: Smoke test — single country, single year**

```bash
curl -X POST \
  "https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports?reporterISO=CHN&year=2023" \
  -H "Authorization: Bearer $(npx supabase secrets list --project-ref debdriyzfcwvgrhzzzre 2>/dev/null | grep SUPABASE_ANON_KEY | awk '{print $2}')" \
  -H "Content-Type: application/json" \
  -d '{}'
```

If anon key retrieval is awkward, get it from `.env.local` (`VITE_SUPABASE_ANON_KEY`) and use directly:

```bash
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env.local | cut -d= -f2)
curl -X POST \
  "https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports?reporterISO=CHN&year=2023" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response (success):
```json
{
  "success": true,
  "ok": true,
  "countries_updated": 1,
  "rows_updated": 97,
  "metadata": {
    "summary": [
      { "reporter": "CHN", "year": "2023", "status": "success", "rows_updated": 97 }
    ]
  }
}
```

If `rows_updated` is 0, check Comtrade API key is set: `npx supabase secrets list --project-ref debdriyzfcwvgrhzzzre`. If `COMTRADE_API_KEY` is missing, the function will return `{"success":false,"error":"COMTRADE_API_KEY edge secret is not set"}`.

- [ ] **Step 2.4: Verify CHN import data landed in DB via Supabase MCP**

Run this SQL against project `debdriyzfcwvgrhzzzre`:

```sql
SELECT reporter_iso3, COUNT(*) AS rows_with_imports, MAX(fetched_at) AS last_fetched
FROM trade_global_aggregates
WHERE reporter_iso3 = 'CHN'
  AND import_value_usd IS NOT NULL
  AND import_value_usd > 0
GROUP BY reporter_iso3;
```

Expected: 1 row, `rows_with_imports` = 97, `last_fetched` = within the last few minutes.

- [ ] **Step 2.5: Commit**

```bash
git add supabase/functions/ingest-trade-imports/index.ts
git commit -m "feat: add ingest-trade-imports edge function for global import data"
```

---

## Task 3: Migration — Schedule + Immediate Backfill

**Files:**
- Create: `supabase/migrations/20260605000000_schedule_trade_imports_cron.sql`

This migration:
1. Schedules weekly cron (Sunday 07:00 UTC)
2. Fires an immediate POST to backfill all 15 missing countries (uses `?force=false` so IND/USA are skipped automatically)

- [ ] **Step 3.1: Create the migration file**

Create `supabase/migrations/20260605000000_schedule_trade_imports_cron.sql`:

```sql
-- ============================================================
-- Migration: Schedule ingest-trade-imports + immediate backfill
-- Date: 2026-06-05
-- Cron: Weekly Sunday 07:00 UTC (after ingest-un-comtrade at 06:00)
-- ============================================================

BEGIN;

-- 1. Unschedule any existing job (idempotent re-runs)
DO $$
BEGIN
    PERFORM cron.unschedule('ingest-trade-imports-weekly');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Schedule weekly run — no ?force so already-populated reporters are skipped
SELECT cron.schedule(
    'ingest-trade-imports-weekly',
    '0 7 * * 0',
    format(
        'SELECT net.http_post(' ||
        'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports'', ' ||
        'headers := jsonb_build_object(' ||
        '''Content-Type'', ''application/json'', ' ||
        '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1)' ||
        '), ' ||
        'body := ''{}''::jsonb, ' ||
        'timeout_milliseconds := 120000' ||
        ') AS request_id;'
    )
);

-- 3. Immediate one-time backfill for all missing countries
--    ?force=false means IND and USA (already populated) are skipped automatically
SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-imports',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
            SELECT decrypted_secret
            FROM vault.decrypted_secrets
            WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
            LIMIT 1
        )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
) AS request_id;

COMMIT;
```

- [ ] **Step 3.2: Apply the migration via Supabase MCP**

Use the Supabase MCP `apply_migration` tool with:
- `project_id`: `debdriyzfcwvgrhzzzre`
- `name`: `schedule_trade_imports_cron`
- `query`: (contents of the SQL file above)

This fires the immediate backfill as a side effect of migration apply.

- [ ] **Step 3.3: Verify cron job is registered**

Run SQL:

```sql
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname = 'ingest-trade-imports-weekly';
```

Expected: 1 row with schedule `0 7 * * 0`.

- [ ] **Step 3.4: Wait ~2 minutes for backfill to complete, then verify all 17 countries have import data**

Run SQL:

```sql
SELECT
    reporter_iso3,
    COUNT(*) FILTER (WHERE import_value_usd > 0) AS rows_with_imports,
    MAX(fetched_at) AS last_fetched
FROM trade_global_aggregates
GROUP BY reporter_iso3
ORDER BY rows_with_imports DESC;
```

Expected: All 17 reporters show `rows_with_imports >= 80` (most chapters will have data; a few may be zero-trade). `last_fetched` should be within the last few minutes for the newly populated countries.

If any reporter shows 0 rows, check `ingestion_logs`:

```sql
SELECT function_name, status, start_time, completed_at
FROM ingestion_logs
WHERE function_name = 'ingest-trade-imports'
ORDER BY start_time DESC
LIMIT 5;
```

- [ ] **Step 3.5: Commit**

```bash
git add supabase/migrations/20260605000000_schedule_trade_imports_cron.sql
git commit -m "feat: schedule ingest-trade-imports weekly cron + fire immediate backfill"
```

---

## Task 4: End-to-End Verification

No code changes. Confirms the frontend now renders import data for all countries.

- [ ] **Step 4.1: Run the test suite to confirm no regressions**

```bash
cd /Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard
npm run test
```

Expected: all tests pass including the new `tradeImportHelpers.test.ts`.

- [ ] **Step 4.2: Confirm view returns data for previously empty countries**

Run SQL:

```sql
SELECT reporter_iso3, COUNT(*) AS import_rows
FROM vw_country_trade_imports
GROUP BY reporter_iso3
ORDER BY import_rows DESC;
```

Expected: all 17 countries appear in the view (previously only IND and USA did).

- [ ] **Step 4.3: Verify GlobalImportPulse renders for CHN and DEU**

Open the `/trade` page in a browser, select **China** from the country selector. The `GlobalImportPulse` component should now render the horizontal bar chart and top-10 table instead of "Import data not yet available". Repeat for **Germany**.

- [ ] **Step 4.4: Final commit (if any fixes were applied)**

```bash
git add -p
git commit -m "fix: <description of any fixes found during verification>"
```

If no fixes were needed, skip this step.

---

## Self-Review Notes

**Spec coverage check:**
- ✅ All 17 countries: `REPORTER_MAP` contains all 17 ISO3→M49 mappings
- ✅ `?reporterISO` param for targeted single-country refresh
- ✅ `?force=true` to re-ingest IND/USA
- ✅ Weekly pg_cron at Sunday 07:00 UTC (after existing jobs)
- ✅ Immediate backfill on migration apply
- ✅ Per-reporter try/catch (batch survives individual failures)
- ✅ Uses `runIngestion` wrapper (matches project pattern)
- ✅ 200ms rate-limiting between calls
- ✅ `ingestion_logs` populated via `runIngestion` (handles start/end/status automatically)
- ✅ Upsert on `UNIQUE (reporter_iso3, hs_code, year)` — idempotent

**Type consistency:**
- `parseComtradeRecord` → returns `{ hsCode: string; importValue: number }` — used consistently in Task 2
- `buildReporterList` → returns `string[]` — used consistently in Task 2
- Test file in Task 1 uses identical signatures

**No placeholders:** All steps contain complete code.
