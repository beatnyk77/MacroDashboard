# Trade Intelligence Engine — Hardening & Automation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the broken Trade Intelligence MVP into a trustworthy, automated institutional terminal — with 5-year historical data, live import/export flows, real opportunity scoring, and automated weekly pipeline via Supabase MCP.

**Architecture:** Fix data integrity bugs first (P0), then expand the pipeline to ingest 5 years of both export and import flows across 20 reporters and 50+ HS codes via scheduled Supabase Edge Functions, then surface the data through corrected frontend hooks and richer visualisations.

**Tech Stack:** Deno/Supabase Edge Functions, Supabase MCP (pg_cron + execute_sql), React 18 + TanStack Query v5 + Recharts, UN Comtrade API v1

---

## Codebase Map

### Files to Modify

| File | What changes |
|---|---|
| `supabase/functions/ingest-trade-global-pulse/index.ts` | Fix YoY growth null when prevVal=0; fix untapped_score noise |
| `supabase/functions/fetch-hs-demand/index.ts` | Remove early-break so ALL 5 years are fetched, not just one |
| `supabase/functions/compute-hs-opportunity-scores/index.ts` | Fix column: queries `export_value_usd` but table has `import_value_usd` |
| `src/features/trade/hooks/useMarketDrilldown.ts` | Fix column in select: `export_value_usd` → `import_value_usd` |
| `src/features/trade/components/GlobalTradePulse.tsx` | Deduplicate rows before render |
| `src/features/trade/components/IndiaChinaDeepDive.tsx` | Replace hardcoded `width: 65%` / `85%` with computed values; fix "Export Value" labels to "Import Value" |
| `src/pages/TradeIntelligencePage.tsx` | Remove "real-time" claims from SEO copy |

### Files to Create

| File | Purpose |
|---|---|
| `supabase/functions/ingest-trade-historical/index.ts` | Backfill 5 years (2019–2023) of AG2 export data for 20 reporters |
| `supabase/migrations/20260603000001_trade_pipeline_fixes.sql` | Fix cron (http_get → http_post), add weekly schedule, fix India-China view column, add pipeline_status view |
| `src/features/trade/components/TradePipelineStatus.tsx` | DataHealthBanner showing last ingestion per function from `ingestion_logs` |
| `src/features/trade/components/TradeWorldMap.tsx` | Choropleth of top export destinations (react-simple-maps, already installed) |
| `src/hooks/useTradePipelineStatus.ts` | TanStack Query hook reading `ingestion_logs` for pipeline health display |

---

## Phase 1 — Data Integrity Fixes (P0 bugs that corrupt output)

---

### Task 1: Fix YoY growth = 0 bug in ingest-trade-global-pulse

**Context:** When `partnerCode=0` (World aggregate) returns no records from Comtrade, the fallback chain sets `prevRecords = []`. Then `prevMap` stays empty. Then `growth = prevVal > 0 ? ... : 0` writes `0.0%` for every row. This is a math artefact, not real data.

**Files:**
- Modify: `supabase/functions/ingest-trade-global-pulse/index.ts` (lines 162–193)

- [ ] **Step 1: Open the file and locate the growth calculation block**

The relevant lines are in the inner `rows = targetRecords.map(...)` call. Find:
```typescript
const prevVal = prevMap.get(cmdCode) || 0;
const growth = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
```
And the untapped score line:
```typescript
untapped_score: Math.min(100, untapped + (idx % 20)),
```

- [ ] **Step 2: Replace the growth calculation and untapped score**

Change those two lines to:
```typescript
const prevVal = prevMap.get(cmdCode) ?? null;
const growth = prevVal !== null && prevVal > 0
    ? ((currentVal - prevVal) / prevVal) * 100
    : null;   // null = "prior year unavailable" — never write 0 as a fake value
```
And:
```typescript
untapped_score: Math.min(100, untapped),  // remove (idx % 20) noise
```

- [ ] **Step 3: Also fix the `yoy_growth_pct` row field to accept null**

The row builder currently has:
```typescript
yoy_growth_pct: parseFloat(growth.toFixed(2)),
```
Change to:
```typescript
yoy_growth_pct: growth !== null ? parseFloat(growth.toFixed(2)) : null,
```

- [ ] **Step 4: Verify the schema accepts NULL for yoy_growth_pct**

In `supabase/migrations/20260427000000_trade_intelligence_expansion.sql`, confirm:
```sql
yoy_growth_pct      DECIMAL(10,2),
```
It has no `NOT NULL` constraint — no migration needed. ✓

- [ ] **Step 5: Commit**
```bash
git add supabase/functions/ingest-trade-global-pulse/index.ts
git commit -m "fix(trade): write null yoy_growth when prev year unavailable, remove idx noise from untapped_score"
```

---

### Task 2: Fix GlobalTradePulse duplicate row rendering

**Context:** `hs_code_master` seeds both `'85'` (chapter, level=2) and `'8501'` etc. (level=4). `trade_global_aggregates` uses `VARCHAR(2)` for hs_code (chapter level only). But the seed's chapter entries have codes like `'85'` which match, and when the DB returns duplicate chapter rows the React key `row.hs_code` de-dupes visually but table rows still double up because the data array itself has duplicates from the upsert fallback paths.

**Files:**
- Modify: `src/features/trade/components/GlobalTradePulse.tsx` (line 138)

- [ ] **Step 1: Add deduplication before render**

Find line 138:
```tsx
{data.slice(0, 15).map((row, _idx) => {
```
Replace with:
```tsx
{Array.from(new Map(data.map(r => [r.hs_code, r])).values())
    .slice(0, 15)
    .map((row) => {
```

- [ ] **Step 2: Fix the closing `}` and `)`**

The existing closing matches — just confirm the closing brace for `data.slice(0, 15).map(...)` is correct after the change. The map still closes with `})}` for the JSX block.

- [ ] **Step 3: Verify in dev**
```bash
npm run dev
```
Navigate to `/trade`. Select any country. Confirm HS chapter `85` appears exactly once.

- [ ] **Step 4: Commit**
```bash
git add src/features/trade/components/GlobalTradePulse.tsx
git commit -m "fix(trade): deduplicate hs chapter rows before render in GlobalTradePulse"
```

---

### Task 3: Fix wrong column in useMarketDrilldown

**Context:** `useMarketDrilldown.ts:49` queries `.select('year, export_value_usd')` from `trade_demand_cache`. That table has `import_value_usd`, not `export_value_usd`. The query silently returns `null` for every trend point, making the trend chart blank.

**Files:**
- Modify: `src/features/trade/hooks/useMarketDrilldown.ts` (line 49)

- [ ] **Step 1: Fix the select call**

Find line 44–51:
```typescript
supabase
    .from('trade_demand_cache')
    .select('year, export_value_usd')
    .eq('hs_code', hsCode)
    .eq('reporter_iso3', reporterIso3)
    .order('year', { ascending: true })
    .limit(10),
```
Change to:
```typescript
supabase
    .from('trade_demand_cache')
    .select('year, import_value_usd')
    .eq('hs_code', hsCode)
    .eq('reporter_iso3', reporterIso3)
    .order('year', { ascending: true })
    .limit(10),
```

- [ ] **Step 2: Fix the data mapping on line 82**

Find:
```typescript
const trend: TrendPoint[] = (trendRes.data || []).map(r => ({
    year: r.year,
    export_value_usd: r.export_value_usd || 0,
}))
```
Change to:
```typescript
const trend: TrendPoint[] = (trendRes.data || []).map(r => ({
    year: r.year,
    export_value_usd: (r as any).import_value_usd || 0,
}))
```
(The `TrendPoint` type reuses `export_value_usd` as a generic "trade value" field — this is fine for now, the type will be renamed in Task 4 below.)

- [ ] **Step 3: Fix compute-hs-opportunity-scores with same column bug**

Open `supabase/functions/compute-hs-opportunity-scores/index.ts` line 108:
```typescript
.select('reporter_iso3, reporter_iso2, reporter_name, year, export_value_usd')
```
Change to:
```typescript
.select('reporter_iso3, reporter_iso2, reporter_name, year, import_value_usd')
```
And line 134:
```typescript
byReporter[row.reporter_iso3].yearlyValues.push({ year: row.year, usd: row.export_value_usd || 0 })
```
Change to:
```typescript
byReporter[row.reporter_iso3].yearlyValues.push({ year: row.year, usd: (row as any).import_value_usd || 0 })
```

- [ ] **Step 4: Commit**
```bash
git add src/features/trade/hooks/useMarketDrilldown.ts \
        supabase/functions/compute-hs-opportunity-scores/index.ts
git commit -m "fix(trade): correct column import_value_usd in drilldown hook and opportunity score compute"
```

---

### Task 4: Fix hardcoded progress bars and wrong "Export Value" labels in IndiaChinaDeepDive

**Context:** The India/China comparison card shows "Export Value" but the underlying data (`view_india_china_comparison`) pulls from `trade_demand_cache` which stores *import* values (what each country *imports*). The semantic is: India imports X, China imports Y of this product — that's the demand comparison, not their export capacity. Additionally `width: '65%'` and `width: '85%'` are static.

**Files:**
- Modify: `src/features/trade/components/IndiaChinaDeepDive.tsx` (lines 129, 135, 149–150, 177, 185–186)

- [ ] **Step 1: Fix the India card label and bar**

Find line 130:
```tsx
<p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Export Value</p>
```
Change to:
```tsx
<p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Import Demand</p>
```

Before the India card JSX (around line 112), compute the bar widths:
```tsx
const total = (latest?.india_export_usd ?? 0) + (latest?.china_export_usd ?? 0)
const indiaWidth = total > 0
    ? Math.round(((latest?.india_export_usd ?? 0) / total) * 100)
    : 0
const chinaWidth = total > 0
    ? Math.round(((latest?.china_export_usd ?? 0) / total) * 100)
    : 0
```

- [ ] **Step 2: Replace static width on India bar**

Find line 150:
```tsx
<div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
```
Change to:
```tsx
<div className="h-full bg-emerald-500 rounded-full" style={{ width: `${indiaWidth}%` }} />
```

- [ ] **Step 3: Fix the China card label**

Find line ~177:
```tsx
<p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Export Value</p>
```
Change to:
```tsx
<p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Import Demand</p>
```

- [ ] **Step 4: Replace static width on China bar**

Find line 186:
```tsx
<div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
```
Change to:
```tsx
<div className="h-full bg-blue-500 rounded-full" style={{ width: `${chinaWidth}%` }} />
```

- [ ] **Step 5: Commit**
```bash
git add src/features/trade/components/IndiaChinaDeepDive.tsx
git commit -m "fix(trade): compute India/China bar widths from real data; correct Import Demand label"
```

---

### Task 5: Remove false "real-time" claims from SEO copy

**Context:** UN Comtrade publishes annual data with 6–18 month lag. Claiming "real-time" on an institutional product is a credibility risk.

**Files:**
- Modify: `src/pages/TradeIntelligencePage.tsx` (lines 22–40)

- [ ] **Step 1: Update the SEO description**

Find line 23:
```tsx
description="Real-time macro bilateral trade telemetry tracking 6-digit HS codes, market opportunity scoring, supplier concentration (HHI), and global demand shifts. Powered by live UN Comtrade integration."
```
Change to:
```tsx
description="Institutional bilateral trade telemetry tracking 6-digit HS codes, market opportunity scoring, supplier concentration (HHI), and global demand shifts. Annual UN Comtrade data (2019–2023)."
```

- [ ] **Step 2: Update the JSON-LD description**

Find line 33:
```tsx
"description": "Institutional bilateral trade flows, HHI concentration, supplier dominance, and macroeconomic opportunity scoring based on 5-year UN Comtrade trend lines.",
```
This is already accurate. Update `temporalCoverage`:
```tsx
"temporalCoverage": "2019-01-01/2023-12-31",
```

- [ ] **Step 3: Remove "Live Sync Active" pulsing dot in MarketOpportunityCard**

Open `src/features/trade/components/MarketOpportunityCard.tsx` line 84:
```tsx
<div className="flex items-center gap-1 text-[9px] font-bold text-white/20 uppercase tracking-widest">
    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
    Live Sync Active
</div>
```
Change to:
```tsx
<div className="flex items-center gap-1 text-[9px] font-bold text-white/20 uppercase tracking-widest">
    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
    UN Comtrade 2019–2023
</div>
```

- [ ] **Step 4: Commit**
```bash
git add src/pages/TradeIntelligencePage.tsx src/features/trade/components/MarketOpportunityCard.tsx
git commit -m "fix(trade): remove false real-time claims; set accurate annual UN Comtrade attribution"
```

---

## Phase 2 — Pipeline Automation & Historical Backfill

---

### Task 6: Fix fetch-hs-demand to collect all 5 years, not just the first

**Context:** `fetch-hs-demand/index.ts` line 141 has `if (yearTotalRows.length > 0) break;` inside the year loop. This means if 2024 returns data, 2023–2021 are never fetched. For 5-year trend charts and CAGR computation we need all years in `trade_demand_cache`.

**Files:**
- Modify: `supabase/functions/fetch-hs-demand/index.ts` (lines 113–143)

- [ ] **Step 1: Remove the early break and accumulate all years**

Find the year loop (lines 115–142):
```typescript
for (const year of years) {
    console.log(`[fetch-hs-demand] Attempting fetch for year ${year}...`);
    const yearUrl = ...
    try {
        const yearRes = await fetch(yearUrl, ...);
        if (yearRes.ok) {
            const yearData = await yearRes.json() as { data?: ComtradeRecord[] };
            const yearRecords = yearData?.data || [];
            console.log(`[fetch-hs-demand] Got ${yearRecords.length} records for year ${year}`);
            if (yearRecords.length > 0) {
                yearRecords.forEach(rec => {
                    const repCode = ...;
                    if (repCode) yearTotalRows.push(rec);
                });
            }
        }
    } catch (err) { ... }
    if (yearTotalRows.length > 0) break;    // ← THIS IS THE BUG
}
```

Remove the final `if (yearTotalRows.length > 0) break;` line entirely. Also add a `delay(300)` between year fetches to respect Comtrade rate limits:

```typescript
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

for (const year of years) {
    console.log(`[fetch-hs-demand] Attempting fetch for year ${year}...`);
    const yearUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS` +
        `?reporterCode=${reporterString}&period=${year}&cmdCode=${hsCode}&flowCode=M&partnerCode=0,699`;
    try {
        const yearRes = await fetch(yearUrl, {
            headers: { 'Ocp-Apim-Subscription-Key': comtradeKey }
        });
        if (yearRes.ok) {
            const yearData = await yearRes.json() as { data?: ComtradeRecord[] };
            const yearRecords = yearData?.data || [];
            console.log(`[fetch-hs-demand] Got ${yearRecords.length} records for year ${year}`);
            yearRecords.forEach(rec => {
                const repCode = rec.ReporterCode || rec.reporterCode || rec.rtCode || rec.reporter_code;
                if (repCode) yearTotalRows.push(rec);
            });
        }
    } catch (err) {
        console.error(`[fetch-hs-demand] Error fetching year ${year}: ${err}`);
    }
    await delay(300);   // respect Comtrade rate limit
}
```

- [ ] **Step 2: Update the years default to cover 2019–2023**

Find line 291:
```typescript
const years = yearParam ? [parseInt(yearParam)] : [2024, 2023, 2022, 2021]
```
Change to:
```typescript
const years = yearParam ? [parseInt(yearParam)] : [2023, 2022, 2021, 2020, 2019]
```
(2024 data isn't available until mid-2025 at earliest on UN Comtrade. 2019–2023 is the reliable 5-year window.)

- [ ] **Step 3: Commit**
```bash
git add supabase/functions/fetch-hs-demand/index.ts
git commit -m "fix(trade): fetch all 5 years in fetch-hs-demand instead of stopping at first year"
```

---

### Task 7: Create ingest-trade-historical edge function (5-year bulk backfill)

**Context:** `fetch-hs-demand` runs per-HS-code and is designed for on-demand drilldown. We need a separate scheduled function that systematically backfills 5 years of export data for all 20 major reporters across all HS2 chapters (AG2 aggregation level). This populates `trade_global_aggregates` with real 5-year trends for the GlobalTradePulse table and accurate YoY computation.

**Files:**
- Create: `supabase/functions/ingest-trade-historical/index.ts`

- [ ] **Step 1: Create the function file**

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REPORTERS = [
    { code: "842", iso3: "USA" }, { code: "156", iso3: "CHN" }, { code: "699", iso3: "IND" },
    { code: "276", iso3: "DEU" }, { code: "392", iso3: "JPN" }, { code: "826", iso3: "GBR" },
    { code: "251", iso3: "FRA" }, { code: "380", iso3: "ITA" }, { code: "124", iso3: "CAN" },
    { code: "410", iso3: "KOR" }, { code: "076", iso3: "BRA" }, { code: "484", iso3: "MEX" },
    { code: "036", iso3: "AUS" }, { code: "724", iso3: "ESP" }, { code: "528", iso3: "NLD" },
    { code: "756", iso3: "CHE" }, { code: "682", iso3: "SAU" }, { code: "792", iso3: "TUR" },
    { code: "360", iso3: "IDN" }, { code: "643", iso3: "RUS" },
]

const YEARS = [2019, 2020, 2021, 2022, 2023]

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

async function chunkedUpsert(supabase: SupabaseClient, table: string, rows: any[], conflict: string) {
    for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabase.from(table).upsert(rows.slice(i, i + 100), { onConflict: conflict })
        if (error) throw error
    }
}

async function fetchYear(reporterCode: string, year: number, comtradeKey: string): Promise<any[]> {
    const url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporterCode}&period=${year}&cmdCode=AG2&flowCode=X&partnerCode=0`
    const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } })
    if (!res.ok) {
        console.warn(`[ingest-trade-historical] ${year}/${reporterCode} → HTTP ${res.status}`)
        return []
    }
    const d = await res.json() as any
    return d.data || []
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const comtradeKey = Deno.env.get('COMTRADE_API_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Allow single-reporter mode for incremental runs: ?reporter=IND
        const url = new URL(req.url)
        const targetIso3 = url.searchParams.get('reporter')
        const reporters = targetIso3
            ? REPORTERS.filter(r => r.iso3 === targetIso3)
            : REPORTERS

        console.log(`[ingest-trade-historical] Starting for ${reporters.length} reporters, years ${YEARS.join(',')}`)

        let totalUpserted = 0

        for (const reporter of reporters) {
            // Collect all years for this reporter
            const allRecords: Record<string, Record<number, number>> = {}  // cmdCode → year → value

            for (const year of YEARS) {
                const records = await fetchYear(reporter.code, year, comtradeKey)
                for (const r of records) {
                    const cmd = String(r.CmdCode || r.cmdCode || '')
                    const val = r.PrimaryValue || r.primaryValue || 0
                    if (!cmd) continue
                    if (!allRecords[cmd]) allRecords[cmd] = {}
                    allRecords[cmd][year] = val
                }
                console.log(`[ingest-trade-historical] ${reporter.iso3} ${year}: ${records.length} records`)
                await delay(400)  // respect rate limit
            }

            // Build rows with YoY growth computed from actual prior-year value
            const rows: any[] = []
            for (const [cmdCode, yearValues] of Object.entries(allRecords)) {
                const totalByYear: Record<number, number> = {}
                for (const r2 of Object.values(allRecords)) {
                    for (const [y, v] of Object.entries(r2)) {
                        totalByYear[Number(y)] = (totalByYear[Number(y)] || 0) + v
                    }
                }

                for (const year of YEARS) {
                    const currentVal = yearValues[year]
                    if (currentVal === undefined) continue

                    const prevVal = yearValues[year - 1] ?? null
                    const growth = prevVal !== null && prevVal > 0
                        ? parseFloat((((currentVal - prevVal) / prevVal) * 100).toFixed(2))
                        : null

                    const totalExport = totalByYear[year] || 0
                    const share = totalExport > 0
                        ? parseFloat(((currentVal / totalExport) * 100).toFixed(3))
                        : null

                    let untapped = 0
                    if (growth !== null && growth > 10) untapped += 40
                    if (growth !== null && growth > 25) untapped += 20
                    if (share !== null && share < 2) untapped += 20

                    rows.push({
                        reporter_iso3: reporter.iso3,
                        hs_code: cmdCode,
                        year,
                        export_value_usd: Math.round(currentVal),
                        import_value_usd: null,  // export-side pulse; imports tracked in trade_demand_cache
                        yoy_growth_pct: growth,
                        share_of_total_pct: share,
                        untapped_score: Math.min(100, untapped),
                        fetched_at: new Date().toISOString(),
                    })
                }
            }

            if (rows.length > 0) {
                await chunkedUpsert(supabase, 'trade_global_aggregates', rows, 'reporter_iso3,hs_code,year')
                totalUpserted += rows.length
            }

            await supabase.from('ingestion_logs').insert({
                function_name: 'ingest-trade-historical',
                status: 'success',
                metadata: { iso3: reporter.iso3, rows: rows.length },
                start_time: new Date().toISOString(),
            })

            await delay(500)  // pace between reporters
        }

        return new Response(JSON.stringify({ ok: true, totalUpserted }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        console.error('[ingest-trade-historical] Fatal:', err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
```

- [ ] **Step 2: Commit the new function**
```bash
git add supabase/functions/ingest-trade-historical/
git commit -m "feat(trade): add ingest-trade-historical for 5-year backfill across 20 reporters"
```

---

### Task 8: Fix cron schedule and add weekly automation via Supabase MCP

**Context:** The existing cron in `20260427000000_trade_intelligence_expansion.sql` uses `net.http_get` but edge functions only accept POST. Also it fires monthly (1st of month) which is too infrequent. We need three jobs: (1) weekly global pulse refresh, (2) monthly historical backfill for any new year, (3) daily opportunity score compute for top 20 HS codes.

**Files:**
- Create: `supabase/migrations/20260603000001_trade_pipeline_fixes.sql`

- [ ] **Step 1: Use Supabase MCP to check the current cron entries**

Run using the Supabase MCP `execute_sql` tool on the project:
```sql
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname LIKE '%trade%';
```
Note the `jobid` of `ingest-trade-intelligence-pulse`.

- [ ] **Step 2: Create the migration file**

```sql
-- ============================================================
-- Trade Pipeline Fixes — Cron & Schema
-- Date: 2026-06-03
-- ============================================================

-- 1. Remove broken old cron (used http_get, wrong method)
SELECT cron.unschedule('ingest-trade-intelligence-pulse');

-- 2. Weekly global pulse (every Monday 03:00 UTC)
SELECT cron.schedule(
    'trade-weekly-global-pulse',
    '0 3 * * 1',
    $$ SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-global-pulse',
        headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    ) $$
);

-- 3. Monthly historical backfill (1st of month, 04:00 UTC)
SELECT cron.schedule(
    'trade-monthly-historical-backfill',
    '0 4 1 * *',
    $$ SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-historical',
        headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    ) $$
);

-- 4. Daily opportunity score compute for top 20 HS codes (02:00 UTC)
-- Runs after daily ingestion pipelines have completed
SELECT cron.schedule(
    'trade-daily-opportunity-scores',
    '0 2 * * *',
    $$ SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/compute-hs-opportunity-scores?hsCode=620342',
        headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    ) $$
);

-- 5. Fix view_india_china_comparison to use correct import column
-- The view was referencing the table correctly but labels in the view
-- don't make the semantic clear. Recreate with explicit aliases.
CREATE OR REPLACE VIEW public.view_india_china_comparison AS
SELECT
    t1.hs_code,
    m.description  AS hs_description,
    t1.year,
    MAX(CASE WHEN t1.reporter_iso3 = 'IND' THEN t1.import_value_usd END) AS india_export_usd,
    MAX(CASE WHEN t1.reporter_iso3 = 'IND' THEN t1.qty_value END)        AS india_qty,
    MAX(CASE WHEN t1.reporter_iso3 = 'CHN' THEN t1.import_value_usd END) AS china_export_usd,
    MAX(CASE WHEN t1.reporter_iso3 = 'CHN' THEN t1.qty_value END)        AS china_qty,
    MAX(t1.fetched_at)                                                     AS fetched_at
FROM public.trade_demand_cache t1
LEFT JOIN public.hs_code_master m ON t1.hs_code = m.code
WHERE t1.reporter_iso3 IN ('IND', 'CHN')
GROUP BY t1.hs_code, m.description, t1.year;

-- 6. Pipeline status view (used by TradePipelineStatus component)
CREATE OR REPLACE VIEW public.view_trade_pipeline_status AS
SELECT
    function_name,
    MAX(start_time)  AS last_run,
    COUNT(*)         AS total_runs,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successes,
    SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) AS failures,
    (SELECT status FROM ingestion_logs i2
     WHERE i2.function_name = i1.function_name
     ORDER BY start_time DESC LIMIT 1) AS last_status
FROM ingestion_logs i1
WHERE function_name LIKE 'ingest-trade%'
   OR function_name LIKE 'compute-hs%'
   OR function_name LIKE 'fetch-hs%'
GROUP BY function_name;
```

- [ ] **Step 3: Apply the migration using Supabase MCP**

Using the `apply_migration` MCP tool with the migration content above. This creates the cron jobs and the pipeline status view live on the remote project.

- [ ] **Step 4: Verify cron jobs were created**

Using Supabase MCP `execute_sql`:
```sql
SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'trade%';
```
Expected output: 3 rows — `trade-weekly-global-pulse`, `trade-monthly-historical-backfill`, `trade-daily-opportunity-scores`.

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/20260603000001_trade_pipeline_fixes.sql
git commit -m "feat(trade): fix cron to POST, add weekly pulse + monthly backfill + daily scoring schedules"
```

---

### Task 9: Deploy edge functions to production using Supabase CLI

**Context:** The new `ingest-trade-historical` function and the patched `ingest-trade-global-pulse`, `fetch-hs-demand`, `compute-hs-opportunity-scores` need to be deployed. Use the Supabase CLI.

**Files:** No source changes — deployment only.

- [ ] **Step 1: Deploy all patched/new trade functions**
```bash
supabase functions deploy ingest-trade-historical
supabase functions deploy ingest-trade-global-pulse
supabase functions deploy fetch-hs-demand
supabase functions deploy compute-hs-opportunity-scores
```
Expected: Each shows `✓ Deployed Function <name>`

- [ ] **Step 2: Trigger a manual historical backfill via Supabase MCP**

Using Supabase MCP `execute_sql` to invoke the function:
```sql
SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-trade-historical?reporter=IND',
    headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
        'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
);
```
Repeat for `reporter=CHN`, `reporter=USA`. (Running one reporter at a time avoids the ~60s edge function timeout limit.)

- [ ] **Step 3: Verify data landed in trade_global_aggregates**

Using Supabase MCP `execute_sql`:
```sql
SELECT reporter_iso3, hs_code, year, export_value_usd, yoy_growth_pct
FROM trade_global_aggregates
WHERE reporter_iso3 = 'IND'
ORDER BY year DESC, export_value_usd DESC
LIMIT 20;
```
Expected: Non-null `yoy_growth_pct` for years 2020–2023 (2019 has no prior year so will be null, which is correct).

- [ ] **Step 4: Check ingestion_logs for errors**

Using Supabase MCP `execute_sql`:
```sql
SELECT function_name, status, metadata, start_time
FROM ingestion_logs
WHERE function_name = 'ingest-trade-historical'
ORDER BY start_time DESC
LIMIT 10;
```
Expected: All rows show `status = 'success'`.

- [ ] **Step 5: Trigger demand backfill for top 6 HS codes**

Run `fetch-hs-demand` for each of the 6 codes used in the India/China deep-dive:
```bash
for code in 851713 870380 854143 854231 300490 620342; do
  curl -X POST \
    "https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/fetch-hs-demand?hsCode=${code}" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json"
  sleep 5
done
```
Verify with MCP:
```sql
SELECT hs_code, reporter_iso3, year, import_value_usd
FROM trade_demand_cache
WHERE hs_code IN ('851713','870380','854143','854231','300490','620342')
ORDER BY hs_code, reporter_iso3, year;
```
Expected: 5 rows per reporter per HS code (years 2019–2023).

---

## Phase 3 — Pipeline Health Surface

---

### Task 10: Build TradePipelineStatus component and hook

**Context:** The page currently has no indicator of when data was last ingested. Adding a `DataHealthBanner`-style row at the top of `/trade` shows last run time and pass/fail status per function, so users understand data currency without guessing.

**Files:**
- Create: `src/hooks/useTradePipelineStatus.ts`
- Create: `src/features/trade/components/TradePipelineStatus.tsx`
- Modify: `src/pages/TradeIntelligencePage.tsx` (add component to page)

- [ ] **Step 1: Create the hook**

```typescript
// src/hooks/useTradePipelineStatus.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PipelineStatusRow {
    function_name: string
    last_run: string | null
    total_runs: number
    successes: number
    failures: number
    last_status: string | null
}

export function useTradePipelineStatus() {
    return useQuery<PipelineStatusRow[]>({
        queryKey: ['trade-pipeline-status'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('view_trade_pipeline_status')
                .select('*')
                .order('last_run', { ascending: false })
            if (error) throw error
            return data || []
        },
        staleTime: 1000 * 60 * 5,   // 5 min
        gcTime: 1000 * 60 * 30,
    })
}
```

- [ ] **Step 2: Create the component**

```tsx
// src/features/trade/components/TradePipelineStatus.tsx
import React from 'react'
import { Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { useTradePipelineStatus } from '@/hooks/useTradePipelineStatus'
import { cn } from '@/lib/utils'

const LABEL: Record<string, string> = {
    'ingest-trade-global-pulse':   'Global Pulse',
    'ingest-trade-historical':     '5-Year Historical',
    'fetch-hs-demand':             'HS Demand',
    'compute-hs-opportunity-scores': 'Opp. Scores',
}

function formatAge(iso: string | null): string {
    if (!iso) return 'Never'
    const diffMs = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diffMs / 86_400_000)
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days}d ago`
}

export const TradePipelineStatus: React.FC = () => {
    const { data, isLoading } = useTradePipelineStatus()

    if (isLoading || !data || data.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                <Activity className="w-3 h-3" />
                Pipeline
            </div>
            {data.map(row => {
                const isOk = row.last_status === 'success'
                const label = LABEL[row.function_name] || row.function_name
                return (
                    <div
                        key={row.function_name}
                        className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider',
                            isOk
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        )}
                    >
                        {isOk
                            ? <CheckCircle2 className="w-2.5 h-2.5" />
                            : <AlertTriangle className="w-2.5 h-2.5" />
                        }
                        {label}
                        <span className="opacity-60 flex items-center gap-0.5">
                            <Clock className="w-2 h-2" />
                            {formatAge(row.last_run)}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
```

- [ ] **Step 3: Add TradePipelineStatus to the page**

In `src/pages/TradeIntelligencePage.tsx`, after the imports add:
```tsx
import { TradePipelineStatus } from '../features/trade/components/TradePipelineStatus'
```
Then inside the `<div className="max-w-[1400px] mx-auto space-y-16 pb-24">`, after the header section and before `Section 1`, insert:
```tsx
{/* Pipeline health bar */}
<div className="animate-in fade-in duration-500">
    <TradePipelineStatus />
</div>
```

- [ ] **Step 4: Commit**
```bash
git add src/hooks/useTradePipelineStatus.ts \
        src/features/trade/components/TradePipelineStatus.tsx \
        src/pages/TradeIntelligencePage.tsx
git commit -m "feat(trade): add TradePipelineStatus banner showing last ingestion time per function"
```

---

## Phase 4 — Richer Visualisations

---

### Task 11: Wire the 5-year trend chart to real data in the HS drilldown page

**Context:** `ImportTrendChart.tsx` exists as a component. `useMarketDrilldown` now correctly fetches `import_value_usd` from `trade_demand_cache` (after Task 3). The drilldown page at `/trade/hs/:code` needs to render this component with the trend data.

**Files:**
- Read: `src/features/trade/components/ImportTrendChart.tsx` (to understand its props)
- Modify: `src/pages/HSCodeOverviewPage.tsx` (wire trend data)

- [ ] **Step 1: Read ImportTrendChart to understand its interface**

Open `src/features/trade/components/ImportTrendChart.tsx`. Note the props it expects (should be `data: TrendPoint[]` and a `title` prop).

- [ ] **Step 2: Check HSCodeOverviewPage to find where drilldown components are rendered**

Open `src/pages/HSCodeOverviewPage.tsx`. Find where `useMarketDrilldown` is called and where the trend array is available.

- [ ] **Step 3: Ensure ImportTrendChart is rendered with trend data**

Where the drilldown renders its detail section, add:
```tsx
import { ImportTrendChart } from '@/features/trade/components/ImportTrendChart'
// ... inside the render
{drilldown.trend.length > 0 && (
    <ImportTrendChart
        data={drilldown.trend}
        title="5-Year Import Demand Trend"
    />
)}
```
If `ImportTrendChart` has different props, adapt to match its actual interface.

- [ ] **Step 4: Commit**
```bash
git add src/pages/HSCodeOverviewPage.tsx
git commit -m "feat(trade): wire ImportTrendChart to real 5-year trend data in HS drilldown"
```

---

### Task 12: Add top-destinations world map to GlobalTradePulse

**Context:** `react-simple-maps` is already installed (confirmed in the codebase via other map components). A choropleth showing where a country's top export categories flow adds immediate institutional visual credibility.

**Files:**
- Create: `src/features/trade/components/TradeWorldMap.tsx`
- Modify: `src/features/trade/components/GlobalTradePulse.tsx` (add map below table)
- Modify: `src/features/trade/hooks/useGlobalTrade.ts` (fetch bilateral destinations)

- [ ] **Step 1: Update useGlobalTrade to also fetch top bilateral destinations**

In `src/features/trade/hooks/useGlobalTrade.ts`, add a second query inside `fetchGlobalTrade`:
```typescript
// After the main aggregate query, fetch top 10 bilateral destinations from trade_chokepoints
const { data: destResults } = await supabase
    .from('trade_chokepoints')
    .select('partner_name, partner_code, trade_value_usd')
    .eq('reporter_is_exporter', true)
    .ilike('reporter_code', '%')  // filter by reporter when data is available
    .order('trade_value_usd', { ascending: false })
    .limit(10)
```
Add `destinations: destResults || []` to the returned state type and setter.

> **Note:** If `trade_chokepoints` has sparse data initially, the map will gracefully show no shading — that's acceptable. The component handles empty data.

- [ ] **Step 2: Create TradeWorldMap component**

```tsx
// src/features/trade/components/TradeWorldMap.tsx
import React, { memo } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface Props {
    /** Array of { partner_code: string (ISO numeric), trade_value_usd: number } */
    destinations: { partner_code: string; trade_value_usd: number }[]
}

export const TradeWorldMap: React.FC<Props> = memo(({ destinations }) => {
    if (destinations.length === 0) return null

    const maxVal = Math.max(...destinations.map(d => d.trade_value_usd))
    const valueMap = new Map(destinations.map(d => [d.partner_code, d.trade_value_usd]))

    const getColor = (geoId: string): string => {
        const val = valueMap.get(geoId)
        if (!val) return 'rgba(255,255,255,0.04)'
        const intensity = val / maxVal
        if (intensity > 0.7) return 'rgba(16,185,129,0.6)'  // emerald-500
        if (intensity > 0.3) return 'rgba(16,185,129,0.35)'
        return 'rgba(16,185,129,0.15)'
    }

    return (
        <div className="w-full h-[220px] rounded-2xl overflow-hidden bg-white/[0.01] border border-white/5">
            <ComposableMap
                projectionConfig={{ scale: 130 }}
                style={{ width: '100%', height: '100%' }}
            >
                <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                        geographies.map(geo => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={getColor(geo.id)}
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: 'none' },
                                    hover: { outline: 'none', fill: 'rgba(16,185,129,0.5)' },
                                    pressed: { outline: 'none' },
                                }}
                            />
                        ))
                    }
                </Geographies>
            </ComposableMap>
        </div>
    )
})
TradeWorldMap.displayName = 'TradeWorldMap'
```

- [ ] **Step 3: Add map to GlobalTradePulse below the table**

In `src/features/trade/components/GlobalTradePulse.tsx`, after the closing `</div>` of the table wrapper (around line 180), add:
```tsx
import { TradeWorldMap } from './TradeWorldMap'
// ... inside the render, after the table:
{!loading && !error && (
    <div className="space-y-2">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
            Top Export Destinations
        </p>
        <TradeWorldMap destinations={[]} />
    </div>
)}
```
(Pass real `destinations` prop once `useGlobalTrade` returns it; empty array for now renders the empty map gracefully.)

- [ ] **Step 4: Commit**
```bash
git add src/features/trade/components/TradeWorldMap.tsx \
        src/features/trade/components/GlobalTradePulse.tsx \
        src/features/trade/hooks/useGlobalTrade.ts
git commit -m "feat(trade): add choropleth world map for top export destinations"
```

---

## Phase 5 — Final Verification

---

### Task 13: End-to-end verification using Supabase MCP

**Context:** Confirm all tables have real 5-year data, pipeline status is green, and the frontend shows non-zero YoY growth values.

- [ ] **Step 1: Check trade_global_aggregates has 5 years for IND**

Using Supabase MCP `execute_sql`:
```sql
SELECT reporter_iso3, year, COUNT(*) as chapters,
       AVG(yoy_growth_pct) as avg_growth,
       SUM(CASE WHEN yoy_growth_pct IS NULL THEN 1 ELSE 0 END) as null_growth_count
FROM trade_global_aggregates
WHERE reporter_iso3 = 'IND'
GROUP BY reporter_iso3, year
ORDER BY year;
```
Expected: 5 rows (2019–2023), avg_growth is non-zero for 2020–2023, null_growth_count = 0 for those years.

- [ ] **Step 2: Check trade_demand_cache has 5 years for key HS codes**

```sql
SELECT hs_code, reporter_iso3, year, import_value_usd
FROM trade_demand_cache
WHERE hs_code = '854231'
ORDER BY reporter_iso3, year;
```
Expected: Multiple reporters, years 2019–2023, non-null import_value_usd.

- [ ] **Step 3: Check hs_opportunity_scores was computed**

```sql
SELECT hs_code, reporter_iso3, overall_score, growth_score, market_size_score, computed_at
FROM hs_opportunity_scores
WHERE hs_code = '854231'
ORDER BY overall_score DESC
LIMIT 10;
```
Expected: Non-null scores for at least 5 countries, computed_at within last 24h.

- [ ] **Step 4: Check view_trade_pipeline_status**

```sql
SELECT * FROM view_trade_pipeline_status ORDER BY last_run DESC;
```
Expected: All trade functions show `last_status = 'success'`.

- [ ] **Step 5: Visual smoke test in browser**
```bash
npm run dev
```
- Open `/trade`
- Confirm no "STALE" badge on Global Pulse
- Confirm YoY growth shows actual percentages (not all 0.0%)
- Confirm no duplicate HS 85 row
- Confirm pipeline status bar at top shows green chips
- Select a country, confirm the table populates
- Open `/trade/hs/854231` (Processors), confirm trend chart renders with 5 data points

- [ ] **Step 6: Final commit**
```bash
git add -A
git commit -m "feat(trade): complete Trade Intelligence Engine hardening — real 5yr data, fixed pipeline, automated scheduling"
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Task |
|---|---|
| Fix YoY growth = 0 | Task 1 |
| Fix duplicate rows | Task 2 |
| Fix wrong column in drilldown hook | Task 3 |
| Fix hardcoded progress bars | Task 4 |
| Remove "real-time" false claims | Task 5 |
| Fetch all 5 years not just one year | Task 6 |
| 5-year historical backfill function | Task 7 |
| Automated weekly/monthly scheduling | Task 8 |
| Deploy and seed data | Task 9 |
| Pipeline health UI | Task 10 |
| Wire trend chart to real data | Task 11 |
| World map choropleth | Task 12 |
| End-to-end MCP verification | Task 13 |
| Fix compute-hs-opportunity-scores column bug | Task 3 (Step 3) |
| Fix view_india_china_comparison to include fetched_at | Task 8 (Step 2, SQL) |

### Known Limitations Not in Scope

- HHI computation from `trade_supplier_breakdown` — `competition_score` is null in the current scoring function (marked "Phase 1 removed"). Not addressed in this plan to avoid scope creep; add as a follow-on.
- Bilateral flow table on drilldown page (top 10 destinations) — requires `trade_chokepoints` to be populated via `ingest-un-comtrade` with `partnerCode=all` fetches. Deferred to follow-on.
- The `ingest-un-comtrade` function (not `ingest-trade-global-pulse`) is separately designed for specific category/HS code deep-dives and is not scheduled — acceptable for now as `fetch-hs-demand` handles the same use case for the frontend.
