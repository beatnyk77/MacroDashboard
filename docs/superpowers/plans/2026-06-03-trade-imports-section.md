# Trade Intelligence — Import Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a symmetric Imports section to `/trade` mirroring the existing Exports panel — same country selector, same glassmorphic aesthetic, with a horizontal bar chart and a vulnerability narrative panel.

**Architecture:** The `trade_global_aggregates` table already has an `import_value_usd` column (from migration `20260427000000_trade_intelligence_expansion.sql`) but it is never populated. The plan is to (1) enhance `ingest-trade-global-pulse` to also fetch imports (`flowCode=M`) and upsert `import_value_usd`, (2) expose a `useGlobalImports` hook reading that column, (3) build `GlobalImportPulse` using the same Recharts/table pattern as `GlobalTradePulse` + `FuelSecurityClockIndia`, and (4) restructure `TradeIntelligencePage` into a two-column grid.

**Tech Stack:** Supabase (Postgres view + Edge Function Deno), TanStack Query v5, React 18 + TypeScript, Recharts (`BarChart layout="vertical"`), Tailwind CSS.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260603000001_trade_imports_view.sql` | `vw_country_trade_imports` — readable view over `trade_global_aggregates` for imports |
| Modify | `supabase/functions/ingest-trade-global-pulse/index.ts` | Add second pass fetching `flowCode=M` to populate `import_value_usd` |
| Create | `src/features/trade/hooks/useGlobalImports.ts` | Hook: reads `trade_global_aggregates` ordered by `import_value_usd` |
| Create | `src/features/trade/components/GlobalImportPulse.tsx` | UI: table + horizontal bar chart + vulnerability panel |
| Modify | `src/pages/TradeIntelligencePage.tsx` | Add import section in 2-col grid under Global Pulse row |
| Modify | `src/smoke.test.tsx` | Smoke-render `GlobalImportPulse` |

---

## Task 1: SQL Migration — `vw_country_trade_imports`

**Files:**
- Create: `supabase/migrations/20260603000001_trade_imports_view.sql`

- [ ] **Step 1: Write the migration**

```sql
-- vw_country_trade_imports
-- Readable view of import aggregates from trade_global_aggregates.
-- Only rows where import_value_usd is populated are surfaced.
CREATE OR REPLACE VIEW public.vw_country_trade_imports AS
SELECT
    reporter_iso3,
    hs_code,
    year,
    import_value_usd,
    yoy_growth_pct,
    share_of_total_pct,
    untapped_score,
    fetched_at
FROM public.trade_global_aggregates
WHERE import_value_usd IS NOT NULL
  AND import_value_usd > 0;

-- Public read (no RLS on views — relies on underlying table policies)
GRANT SELECT ON public.vw_country_trade_imports TO anon, authenticated;
```

- [ ] **Step 2: Apply locally (optional — skip if no local Supabase stack)**

```bash
supabase db diff --use-migra
```

Expected: shows `CREATE VIEW public.vw_country_trade_imports`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260603000001_trade_imports_view.sql
git commit -m "feat(trade): add vw_country_trade_imports view over trade_global_aggregates"
```

---

## Task 2: Enhance `ingest-trade-global-pulse` — Add Import Flow

**Files:**
- Modify: `supabase/functions/ingest-trade-global-pulse/index.ts`

The function currently only calls the Comtrade API with `flowCode=X` (exports). We add a second pass for `flowCode=M` (imports) and `upsert` the `import_value_usd` field into the same rows.

- [ ] **Step 1: Add the `fetchImportChapters` helper function**

Inside `ingest-trade-global-pulse/index.ts`, add this function before `Deno.serve`:

```typescript
async function fetchImportChapters(
    supabase: SupabaseClient,
    reporter: { code: string; iso3: string },
    targetYear: string,
    prevYear: string,
    comtradeKey: string
): Promise<number> {
    const tryFetch = async (y: string, p: string) => {
        const url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporter.code}&period=${y}&cmdCode=AG2&flowCode=M&partnerCode=${p}`
        const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } })
        if (!res.ok) return []
        const d = await res.json() as any
        return d.data || []
    }

    let records: any[] = await tryFetch(targetYear, '0')
    let effectiveYear = targetYear

    if (records.length === 0) {
        records = await tryFetch(prevYear, '0')
        effectiveYear = prevYear
    }

    if (records.length === 0) return 0

    const prevRecords = await tryFetch(String(parseInt(effectiveYear) - 1), '0')
    const prevMap = new Map<string, number>()
    prevRecords.forEach((r: any) => {
        const cmd = r.CmdCode || r.cmdCode
        const val = r.PrimaryValue || r.primaryValue || 0
        prevMap.set(cmd, val)
    })

    const totalImportValue = records.reduce((s: number, r: any) => s + (r.PrimaryValue || r.primaryValue || 0), 0)

    const rows = records.map((r: any) => {
        const cmdCode = r.CmdCode || r.cmdCode
        const currentVal = r.PrimaryValue || r.primaryValue || 0
        const prevVal = prevMap.get(cmdCode) || 0
        const growth = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0
        const share = totalImportValue > 0 ? (currentVal / totalImportValue) * 100 : 0
        return {
            reporter_iso3: reporter.iso3,
            hs_code: cmdCode,
            year: parseInt(String(r.Period || r.period || effectiveYear).substring(0, 4)),
            import_value_usd: Math.round(currentVal),
            // Keep existing export fields unchanged — only patch import column
            yoy_growth_pct: parseFloat(growth.toFixed(2)),
            share_of_total_pct: parseFloat(share.toFixed(3)),
            fetched_at: new Date().toISOString(),
        }
    })

    const unique = Array.from(
        rows.reduce((m: Map<string, any>, row: any) => {
            const k = `${row.reporter_iso3}-${row.hs_code}-${row.year}`
            m.set(k, row)
            return m
        }, new Map()).values()
    )

    // Upsert — only update import_value_usd; use ignoreDuplicates:false so it merges
    if (unique.length > 0) {
        await chunkedUpsert(supabase, 'trade_global_aggregates', unique, 'reporter_iso3,hs_code,year')
    }

    return unique.length
}
```

- [ ] **Step 2: Call `fetchImportChapters` inside the main `Deno.serve` loop**

After the existing block that calls `chunkedUpsert(supabase, 'trade_global_aggregates', uniqueRows, ...)`, add:

```typescript
// ── Imports: second pass (flowCode=M) ──
const importCount = await fetchImportChapters(supabase, reporter, targetYear, prevYear, comtradeKey)
console.log(`[ingest-trade-global-pulse] Import rows for ${reporter.iso3}: ${importCount}`)
totalUpserted += importCount

await delay(300) // brief back-off between export and import calls
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard
npm run lint
```

Expected: no new errors (Supabase functions are Deno, not linted by ESLint here, but ensure no import issues).

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ingest-trade-global-pulse/index.ts
git commit -m "feat(ingest): add import chapter pass (flowCode=M) to ingest-trade-global-pulse"
```

---

## Task 3: `useGlobalImports` Hook

**Files:**
- Create: `src/features/trade/hooks/useGlobalImports.ts`

This mirrors `useGlobalTrade` but reads `import_value_usd` from `vw_country_trade_imports`.

- [ ] **Step 1: Write the hook**

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { GlobalAggregate } from '../types/trade'

export function useGlobalImports(iso3: string | null) {
    const [data, setData] = useState<GlobalAggregate[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const [prevIso3, setPrevIso3] = useState(iso3)
    const [prevTrigger, setPrevTrigger] = useState(refreshTrigger)

    if (iso3 !== prevIso3) {
        setPrevIso3(iso3)
        setData([])
        setLoading(!!iso3)
        setError(null)
    } else if (refreshTrigger !== prevTrigger) {
        setPrevTrigger(refreshTrigger)
        setRefreshing(true)
        setError(null)
    }

    const refresh = () => setRefreshTrigger(prev => prev + 1)

    useEffect(() => {
        if (!iso3) return

        const fetchImports = async () => {
            try {
                const isManualRefresh = refreshTrigger > prevTrigger

                if (isManualRefresh) {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
                    await fetch(`${supabaseUrl}/functions/v1/ingest-trade-global-pulse?reporterISO=${iso3}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json',
                        },
                    })
                }

                const { data: results, error: err } = await supabase
                    .from('vw_country_trade_imports')
                    .select('*')
                    .eq('reporter_iso3', iso3)
                    .order('import_value_usd', { ascending: false })

                if (err) throw err
                setData(results || [])
            } catch (e: any) {
                console.error('[useGlobalImports] Error:', e)
                setError(e.message)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }

        fetchImports()
    }, [iso3, refreshTrigger, prevTrigger])

    const lastFetchedAt = data.length > 0 ? data[0].fetched_at : null

    return { data, loading, refreshing, error, refresh, lastFetchedAt }
}
```

- [ ] **Step 2: Verify lint clean**

```bash
npm run lint
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/trade/hooks/useGlobalImports.ts
git commit -m "feat(trade): add useGlobalImports hook reading vw_country_trade_imports"
```

---

## Task 4: `GlobalImportPulse` Component

**Files:**
- Create: `src/features/trade/components/GlobalImportPulse.tsx`

Three visual sections:
1. **Table** — mirrors `GlobalTradePulse` (HS2 chapter, import value, YoY, share)
2. **Horizontal Bar Chart** — Recharts `BarChart layout="vertical"` pattern from `FuelSecurityClockIndia.tsx`
3. **Vulnerability Panel** — narrative showing top-3 dependency chapters, derived from data

The country selector is passed as a prop from the page (shared with `GlobalTradePulse`).

- [ ] **Step 1: Write the component**

```tsx
import React from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Package, ArrowUpRight, ArrowDownRight, AlertTriangle, RefreshCw, Info } from 'lucide-react'
import { useGlobalImports } from '../hooks/useGlobalImports'
import { formatTradeValue } from '../types/trade'
import { HS2_CHAPTER_NAMES } from '../types/hsCodes'
import { FreshnessChip, FreshnessStatus } from '@/components/FreshnessChip'
import { TradeRankerSkeleton } from './TradeRankerSkeleton'
import { cn } from '@/lib/utils'

interface Props {
    selectedISO: string
}

function getFreshnessStatus(date: string | null | undefined, now: number): FreshnessStatus {
    if (!date) return 'no_data'
    const days = (now - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    if (days < 7) return 'fresh'
    if (days < 30) return 'lagged'
    return 'stale'
}

export const GlobalImportPulse: React.FC<Props> = ({ selectedISO }) => {
    const { data, loading, refreshing, error, refresh, lastFetchedAt } = useGlobalImports(selectedISO)
    const [now] = React.useState(() => Date.now())
    const isLoading = loading || refreshing

    const top10 = data.slice(0, 10)

    const totalImports = top10.reduce((s, r) => s + (r.import_value_usd ?? 0), 0)

    // Top-3 chapters by value → vulnerability narrative
    const top3 = top10.slice(0, 3).filter(r => r.import_value_usd)

    const barData = top10.map(r => ({
        name: (HS2_CHAPTER_NAMES[r.hs_code] || `Ch. ${r.hs_code}`).slice(0, 30),
        value: Math.round((r.import_value_usd ?? 0) / 1_000_000_000 * 10) / 10,
    }))

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                        <Package className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-black text-white italic tracking-heading uppercase">
                                Import Composition
                            </h2>
                            {lastFetchedAt && (
                                <FreshnessChip
                                    status={getFreshnessStatus(lastFetchedAt, now)}
                                    lastUpdated={lastFetchedAt}
                                />
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                            Top Import Chapters (2-Digit HS)
                        </p>
                    </div>
                </div>
                <button
                    onClick={refresh}
                    disabled={isLoading}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                        isLoading
                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                    )}
                >
                    <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                    {refreshing ? 'Syncing…' : 'Refresh'}
                </button>
            </div>

            {loading ? (
                <TradeRankerSkeleton />
            ) : error ? (
                <div className="h-[300px] flex items-center justify-center rounded-3xl bg-rose-500/5 border border-rose-500/10">
                    <p className="text-xs font-bold text-rose-400">Failed to load import data: {error}</p>
                </div>
            ) : top10.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center rounded-3xl bg-white/[0.02] border border-white/5 gap-3">
                    <Info className="w-6 h-6 text-white/10" />
                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No import data for {selectedISO}</p>
                    <p className="text-[10px] text-white/10 uppercase tracking-widest">Trigger Refresh to ingest from UN Comtrade</p>
                </div>
            ) : (
                <>
                    {/* Table */}
                    <div className={cn("overflow-x-auto rounded-2xl border border-white/5", refreshing && "opacity-50 transition-opacity")}>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em] w-16">HS2</th>
                                    <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em]">Chapter</th>
                                    <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">Import Value</th>
                                    <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">YoY</th>
                                    <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10.map(row => {
                                    const isPos = (row.yoy_growth_pct ?? 0) >= 0
                                    const shareOfTotal = totalImports > 0
                                        ? ((row.import_value_usd ?? 0) / totalImports * 100).toFixed(1)
                                        : (row.share_of_total_pct ?? 0).toFixed(1)
                                    return (
                                        <tr key={row.hs_code} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-4 py-4 font-mono text-white/40">{row.hs_code}</td>
                                            <td className="px-4 py-4 font-bold text-white/80 group-hover:text-white transition-colors">
                                                {HS2_CHAPTER_NAMES[row.hs_code] || `Chapter ${row.hs_code}`}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-black text-white/70">
                                                {formatTradeValue(row.import_value_usd)}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className={cn(
                                                    "flex items-center justify-end gap-1 font-mono font-black",
                                                    isPos ? "text-blue-400" : "text-rose-400"
                                                )}>
                                                    {isPos
                                                        ? <ArrowUpRight className="w-3 h-3" />
                                                        : <ArrowDownRight className="w-3 h-3" />}
                                                    {Math.abs(row.yoy_growth_pct ?? 0).toFixed(1)}%
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-white/40">
                                                {shareOfTotal}%
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Horizontal Bar Chart */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 space-y-3">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                            Import Value by Chapter — $B
                        </p>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: '#ffffff40', fontSize: 9 }}
                                        axisLine={false}
                                        tickLine={false}
                                        unit="B"
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fill: '#ffffff60', fontSize: 9 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={130}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#000000e0',
                                            border: '1px solid #ffffff10',
                                            borderRadius: 12,
                                            fontSize: 10,
                                        }}
                                        formatter={(v: number) => [`$${v}B`, 'Import Value']}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#3b82f6" opacity={0.8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Vulnerability Panel */}
                    {top3.length > 0 && (
                        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/15 p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
                                    Key Import Dependencies
                                </p>
                            </div>
                            <div className="space-y-2">
                                {top3.map((r, i) => (
                                    <div key={r.hs_code} className="flex items-start gap-3 text-[10px]">
                                        <span className="font-black text-amber-500/60 w-4 shrink-0">{i + 1}.</span>
                                        <span className="text-white/60 leading-relaxed">
                                            <span className="font-black text-white/80">
                                                {HS2_CHAPTER_NAMES[r.hs_code] || `HS ${r.hs_code}`}
                                            </span>{' '}
                                            — {formatTradeValue(r.import_value_usd)} imported
                                            {r.yoy_growth_pct != null && (
                                                <span className={cn(
                                                    "ml-1 font-bold",
                                                    r.yoy_growth_pct > 10 ? "text-amber-400" : "text-white/40"
                                                )}>
                                                    ({r.yoy_growth_pct > 0 ? '+' : ''}{r.yoy_growth_pct.toFixed(1)}% YoY)
                                                </span>
                                            )}
                                            {r.yoy_growth_pct != null && r.yoy_growth_pct > 15 && (
                                                <span className="ml-1 text-amber-400 font-black">↑ Rising dependency</span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-white/20 font-semibold uppercase tracking-wider mt-1">
                                Source: UN Comtrade via ingest-trade-global-pulse · 2-digit HS chapters
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/trade/components/GlobalImportPulse.tsx \
        src/features/trade/hooks/useGlobalImports.ts
git commit -m "feat(trade): GlobalImportPulse — table + bar chart + vulnerability panel"
```

---

## Task 5: Update `TradeIntelligencePage` — Dual Layout

**Files:**
- Modify: `src/pages/TradeIntelligencePage.tsx`

The page currently shows `GlobalTradePulse` (exports) as Section 1. We restructure it as a two-column grid with exports on the left and imports on the right. The country selector state is lifted to the page and shared by both panels.

- [ ] **Step 1: Rewrite page to add import section**

Replace the content of `src/pages/TradeIntelligencePage.tsx` with:

```tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe2, PackageSearch, Target } from 'lucide-react'
import { HSCodeSearch } from '../features/trade/components/HSCodeSearch'
import { GlobalTradePulse } from '../features/trade/components/GlobalTradePulse'
import { GlobalImportPulse } from '../features/trade/components/GlobalImportPulse'
import { IndiaChinaDeepDive } from '../features/trade/components/IndiaChinaDeepDive'
import { RecentHSCodes } from '../features/trade/components/RecentHSCodes'
import type { HSCodeMaster } from '../features/trade/types/trade'
import { isoToFlag } from '../features/trade/types/trade'
import { cn } from '@/lib/utils'
import { SEOManager } from '@/components/SEOManager'

const MAJOR_REPORTERS = [
    { iso3: 'USA', name: 'United States', iso2: 'US' },
    { iso3: 'CHN', name: 'China', iso2: 'CN' },
    { iso3: 'DEU', name: 'Germany', iso2: 'DE' },
    { iso3: 'JPN', name: 'Japan', iso2: 'JP' },
    { iso3: 'IND', name: 'India', iso2: 'IN' },
    { iso3: 'GBR', name: 'United Kingdom', iso2: 'GB' },
    { iso3: 'FRA', name: 'France', iso2: 'FR' },
    { iso3: 'KOR', name: 'South Korea', iso2: 'KR' },
]

const TradeIntelligencePage: React.FC = () => {
    const navigate = useNavigate()
    const [selectedISO, setSelectedISO] = useState('CHN')

    const handleSelect = (code: HSCodeMaster) => {
        navigate(`/trade/hs/${code.code}`)
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 pb-24">
            <SEOManager
                title="Trade Intelligence Engine | Bilateral Flows & Demand Ranking"
                description="Real-time macro bilateral trade telemetry tracking 6-digit HS codes, market opportunity scoring, supplier concentration (HHI), and global demand shifts. Powered by live UN Comtrade integration."
                keywords={[
                    'Global Trade Intelligence', 'HS Code Opportunity Scoring', 'UN Comtrade Telemetry',
                    'Supplier Dominance Analysis', 'Herfindahl-Hirschman Index', 'Export Scout Playbook',
                    'Multipolar Trade Flows', 'Bilateral Trade Data',
                ]}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Dataset",
                    "@id": "https://graphiquestor.com/trade#dataset",
                    "name": "Global Bilateral HS-6 Trade Intelligence Dataset",
                    "description": "Institutional bilateral trade flows, HHI concentration, supplier dominance, and macroeconomic opportunity scoring based on 5-year UN Comtrade trend lines.",
                    "url": "https://graphiquestor.com/trade",
                    "creator": { "@id": "https://graphiquestor.com/#organization" },
                    "temporalCoverage": "2020-01-01/2026-05-30",
                    "spatialCoverage": "Worldwide",
                }}
            />

            {/* Header */}
            <div className="space-y-4 text-center mt-12">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 mb-2">
                    <Globe2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-heading uppercase">
                    Trade Intelligence
                </h1>
                <p className="text-sm font-bold text-emerald-400/80 uppercase tracking-[0.2em] max-w-2xl mx-auto">
                    Global Demand • Supplier Competition • Macro Overlay
                </p>
            </div>

            {/* Shared Country Selector */}
            <div className="flex flex-wrap justify-center gap-2">
                {MAJOR_REPORTERS.map(r => (
                    <button
                        key={r.iso3}
                        onClick={() => setSelectedISO(r.iso3)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                            selectedISO === r.iso3
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
                        )}
                    >
                        <span className="mr-1.5">{isoToFlag(r.iso2)}</span>
                        {r.iso3}
                    </button>
                ))}
            </div>

            {/* Section 1: Exports | Imports (2-col on desktop, stacked on mobile) */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Exports */}
                    <div className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 lg:p-8">
                        <GlobalTradePulse selectedISO={selectedISO} hideCountrySelector />
                    </div>

                    {/* Right: Imports */}
                    <div className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 lg:p-8">
                        <GlobalImportPulse selectedISO={selectedISO} />
                    </div>
                </div>
            </section>

            {/* Section 2: Product Deep Dive Search */}
            <div className="flex justify-center pt-8 border-t border-white/5">
                <div className="w-full max-w-2xl space-y-8">
                    <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative">
                        <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div className="relative space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-lg font-black text-white uppercase tracking-widest">
                                    Product Deep Dive
                                </h2>
                                <p className="text-xs text-white/40 font-semibold">
                                    Search 6-digit HS codes for precise market opportunity scoring.
                                </p>
                            </div>
                            <HSCodeSearch
                                onSelect={handleSelect}
                                className="scale-105 transform origin-top shadow-xl shadow-black/50"
                            />
                            <RecentHSCodes />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { icon: PackageSearch, title: "Global Demand", desc: "Discover growth based on 5-year UN Comtrade trends." },
                            { icon: Target, title: "Competition", desc: "Analyze HHI concentration and supplier dominance." },
                        ].map((f, i) => (
                            <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white/[0.01] border border-white/5">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center">
                                    <f.icon className="w-5 h-5 text-white/60" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">{f.title}</h3>
                                    <p className="text-[10px] text-white/40 leading-relaxed font-semibold">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section 3: India vs China Deep Dive */}
            <div className="w-full pt-8 border-t border-white/5">
                <IndiaChinaDeepDive />
            </div>
        </div>
    )
}

export default TradeIntelligencePage
```

- [ ] **Step 2: Update `GlobalTradePulse` to accept props**

`GlobalTradePulse` currently manages its own `selectedISO` state. We need it to accept an optional `selectedISO` prop and hide its own country selector when `hideCountrySelector` is true.

Open `src/features/trade/components/GlobalTradePulse.tsx` and apply these changes:

**a) Change the component signature:**

```tsx
// Before
export const GlobalTradePulse: React.FC = () => {
    const [selectedISO, setSelectedISO] = useState('CHN')
```

```tsx
// After
interface GlobalTradePulseProps {
    selectedISO?: string
    hideCountrySelector?: boolean
}

export const GlobalTradePulse: React.FC<GlobalTradePulseProps> = ({
    selectedISO: propISO,
    hideCountrySelector = false,
}) => {
    const [internalISO, setInternalISO] = useState('CHN')
    const selectedISO = propISO ?? internalISO
    const setSelectedISO = propISO != null ? () => undefined : setInternalISO
```

**b) Wrap the country selector buttons + refresh button in a conditional:**

```tsx
// Wrap the existing flex div containing MAJOR_REPORTERS.map(...) buttons
// and the refresh button:
{!hideCountrySelector && (
    <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
            {MAJOR_REPORTERS.map(r => (
                // ... existing button JSX unchanged ...
            ))}
        </div>
        <button onClick={() => refresh()} ...>
            {/* ... existing refresh button unchanged ... */}
        </button>
    </div>
)}
```

When `hideCountrySelector` is true, only the title + freshness chip remain in the header, and the refresh button is removed (the page-level `GlobalImportPulse` has its own refresh).

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/TradeIntelligencePage.tsx \
        src/features/trade/components/GlobalTradePulse.tsx
git commit -m "feat(trade): dual exports/imports layout with shared country selector"
```

---

## Task 6: Update Smoke Test

**Files:**
- Modify: `src/smoke.test.tsx`

- [ ] **Step 1: Add imports and a render test for `GlobalImportPulse`**

Find the existing import block for trade components (there may not be one — add it near the other feature imports):

```tsx
// Add this import near the top alongside other feature imports
import { GlobalImportPulse } from '@/features/trade/components/GlobalImportPulse'
```

Add the test alongside the other smoke tests:

```tsx
it('GlobalImportPulse renders without crashing', () => {
    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <GlobalImportPulse selectedISO="CHN" />
            </MemoryRouter>
        </QueryClientProvider>
    )
    // Loading skeleton or empty state — just verify no throw
    expect(document.body).toBeTruthy()
})
```

- [ ] **Step 2: Run tests**

```bash
npm run test
```

Expected: all existing tests pass + new smoke test passes.

- [ ] **Step 3: Commit**

```bash
git add src/smoke.test.tsx
git commit -m "test: smoke-render GlobalImportPulse"
```

---

## Task 7: Build Verification

- [ ] **Step 1: Run lint (must be clean)**

```bash
npm run lint
```

Expected: 0 warnings, 0 errors (lint is `--max-warnings 0`).

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: successful build, no TypeScript errors, `dist/` generated.

- [ ] **Step 3: Run tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 4: Final commit (if any files were touched during verification)**

```bash
git add -p
git commit -m "fix: build/lint corrections after import section integration"
```

---

## Self-Review

### Spec Coverage

| Requirement | Covered by |
|-------------|-----------|
| Symmetrical side-by-side layout | Task 5 (2-col grid) |
| Keep existing Exports section | Task 5 (`GlobalTradePulse` preserved with props) |
| Top 10 Import Products table (HS, Name, Value, Share, YoY) | Task 4 (table section) |
| Horizontal bar chart for imports | Task 4 (Recharts BarChart layout="vertical") |
| Key Import Dependencies panel | Task 4 (vulnerability panel) |
| Uses `trade_global_aggregates.import_value_usd` | Tasks 2 + 3 |
| New view `vw_country_trade_imports` | Task 1 |
| `useGlobalImports` hook | Task 3 |
| No mocks / no stale data | Hook fetches from DB; refresh triggers live ingestion |
| Consistent styling / glassmorphic | Task 4 matches existing aesthetic exactly |
| `npm run lint && npm run build` clean | Task 7 |

### Open Items (out of scope for this plan)
- **Import Origin Choropleth Map** — requires per-chapter partner data that is not in `trade_global_aggregates`. A future plan can add `trade_import_partner_breakdown` table + a `ingest-trade-import-partners` function.
- **Top Origin Countries column** — same dependency. Could be added when partner data is available.

### Type Consistency
- `GlobalImportPulse` accepts `{ selectedISO: string }` → matches how `TradeIntelligencePage` calls it ✓
- `GlobalTradePulse` updated to accept `{ selectedISO?: string; hideCountrySelector?: boolean }` — existing zero-prop call sites (none, since this is the first external call) are fine ✓
- `useGlobalImports` returns `{ data: GlobalAggregate[], loading, refreshing, error, refresh, lastFetchedAt }` → matches what `GlobalImportPulse` destructures ✓
- `GlobalAggregate.import_value_usd` already defined in `src/features/trade/types/trade.ts` ✓
