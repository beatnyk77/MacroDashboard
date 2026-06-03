import React from 'react'
import { ShoppingCart, ArrowUpRight, ArrowDownRight, Info, RefreshCw, AlertCircle } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useGlobalImports } from '../hooks/useGlobalImports'
import { formatTradeValue, isoToFlag } from '../types/trade'
import { HS2_CHAPTER_NAMES } from '../types/hsCodes'
import { FreshnessChip, FreshnessStatus } from '@/components/FreshnessChip'
import { TradeRankerSkeleton } from './TradeRankerSkeleton'
import { ImportOriginMap } from './ImportOriginMap'
import { cn } from '@/lib/utils'

interface Props {
    selectedISO: string
    selectedCountryName: string
    selectedISO2?: string
}

// Top-origin vulnerability narratives per country — institutional tone
const VULNERABILITY_NOTES: Record<string, string[]> = {
    USA: [
        'China accounts for an outsized share of manufacturing imports, creating strategic concentration risk in electronics and consumer goods.',
        'Rare-earth mineral inputs remain near-exclusively sourced from Chinese processing chains, a structural vulnerability in defence supply chains.',
        'Mexico has emerged as the largest goods trade partner, reflecting near-shoring dynamics post-USMCA but maintaining corridor-concentration risk.',
    ],
    IND: [
        'China dominates electronic components and machinery imports, creating bilateral dependency despite ongoing geopolitical tensions.',
        'Crude oil import concentration in the Gulf (UAE, Saudi, Iraq) exceeds 60%, exposing India to Strait of Hormuz chokepoint risk.',
        'Gold and precious metals imports create significant current account drag; RBI policy remains a structural offset via FX reserve management.',
    ],
    CHN: [
        'Australia, Brazil and Russia supply the bulk of iron ore, coal and LNG, creating resource import concentration from geopolitically diverse partners.',
        'Semiconductor imports remain critically dependent on Taiwan, Japan and South Korea, underpinning the strategic urgency of domestic chip ambitions.',
        'Soybean imports from Brazil and Argentina serve as a structural hedge against the US-China trade tensions affecting agricultural flows.',
    ],
    DEU: [
        'Russia historically supplied ~55% of gas imports; post-2022 structural reorientation toward LNG and Norwegian pipeline gas elevated import costs.',
        'China leads in intermediate goods (electronics, machinery), creating value-chain interdependency difficult to decouple rapidly.',
        'Core industrial inputs (lithium, cobalt, rare earths) remain import-dependent with limited EU domestic supply alternatives.',
    ],
    default: [
        'Import concentration in critical sectors creates supply-chain vulnerability when top suppliers face geopolitical or logistical disruptions.',
        'Commodity import exposure to politically sensitive corridors should be hedged through bilateral reserve-stocking and supplier diversification.',
        'Monitor top-3 origin country share: any partner exceeding 35% of a critical chapter warrants strategic redundancy planning.',
    ],
}

function getNotes(iso3: string): string[] {
    return VULNERABILITY_NOTES[iso3] || VULNERABILITY_NOTES.default
}

const CHART_COLORS = ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344']

interface CustomTooltipProps {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    return (
        <div className="px-3 py-2 rounded-xl bg-slate-950/95 border border-cyan-500/20 backdrop-blur-xl shadow-lg">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-wider mb-1">
                HS {label} — {HS2_CHAPTER_NAMES[label ?? ''] || 'Chapter'}
            </p>
            <p className="text-sm font-black text-white tabular-nums">
                {formatTradeValue(payload[0]?.value ?? 0)}
            </p>
        </div>
    )
}

export const GlobalImportPulse: React.FC<Props> = ({ selectedISO, selectedCountryName, selectedISO2 }) => {
    const { data, loading, refreshing, error, refresh, lastFetchedAt } = useGlobalImports(selectedISO)

    const [now] = React.useState(() => Date.now())

    const getFreshnessStatus = (date: string | null | undefined): FreshnessStatus => {
        if (!date) return 'no_data'
        const diff = now - new Date(date).getTime()
        const days = diff / (1000 * 60 * 60 * 24)
        if (days < 7) return 'fresh'
        if (days < 30) return 'lagged'
        return 'stale'
    }

    // Derive top-10 import rows from latest available year
    const { top10, latestYear, chartData } = React.useMemo(() => {
        if (!data || data.length === 0) return { top10: [], latestYear: 0, chartData: [] }
        const latestYear = Math.max(...data.map(r => r.year), 0)
        const filtered = latestYear > 0 ? data.filter(r => r.year === latestYear) : data
        const unique = Array.from(new Map(filtered.map(r => [r.hs_code, r])).values())
        const sorted = unique.sort((a, b) => (b.import_value_usd ?? 0) - (a.import_value_usd ?? 0))
        const top10 = sorted.slice(0, 10)
        const chartData = top10
            .map(r => ({
                hs_code: r.hs_code,
                value: r.import_value_usd ?? 0,
                label: HS2_CHAPTER_NAMES[r.hs_code] || `HS ${r.hs_code}`,
            }))
            .reverse() // Bottom-to-top for horizontal bars
        return { top10, latestYear, chartData }
    }, [data])

    const vulnerabilityNotes = React.useMemo(() => getNotes(selectedISO), [selectedISO])

    return (
        <div className="w-full space-y-6 h-full flex flex-col">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10">
                        <ShoppingCart className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-black text-white italic tracking-heading uppercase">
                                Import Pulse
                            </h2>
                            {lastFetchedAt && (
                                <FreshnessChip
                                    status={getFreshnessStatus(lastFetchedAt)}
                                    lastUpdated={lastFetchedAt}
                                />
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                            Top Import Chapters (2-Digit HS)
                            {selectedISO2 ? ` · ${isoToFlag(selectedISO2)} ` : ' · '}{selectedCountryName}
                            {latestYear > 0 ? ` · ${latestYear}` : ''}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => refresh()}
                    disabled={loading || refreshing}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        (loading || refreshing)
                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                            : 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/20'
                    }`}
                >
                    <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Stale banner */}
            {data.length > 0 && getFreshnessStatus(lastFetchedAt) === 'stale' && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                            <RefreshCw className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-cyan-500 uppercase tracking-tight">Import Pulse is Stale</p>
                            <p className="text-xs font-medium text-cyan-500/60">Data is over 30 days old. Trigger a refresh to ingest latest import flows.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refresh()}
                        className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors shrink-0"
                    >
                        Refresh Now
                    </button>
                </div>
            )}

            {loading ? (
                <TradeRankerSkeleton />
            ) : error ? (
                <div className="h-[300px] flex flex-col items-center justify-center gap-3 rounded-3xl bg-rose-500/5 border border-rose-500/10">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <p className="text-xs font-bold text-rose-400">Failed to load import data: {error}</p>
                </div>
            ) : top10.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-3xl bg-cyan-500/3 border border-dashed border-cyan-500/15 min-h-[300px]">
                    <Info className="w-6 h-6 text-cyan-500/30" />
                    <div className="text-center space-y-1">
                        <p className="text-xs font-black text-white/20 uppercase tracking-widest">
                            Import data not yet available
                        </p>
                        <p className="text-[10px] text-white/10 uppercase tracking-widest">
                            Trigger a refresh to ingest {selectedCountryName} import flows
                        </p>
                    </div>
                    <button
                        onClick={() => refresh()}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                    >
                        Ingest Imports
                    </button>
                </div>
            ) : (
                <div className={cn('space-y-6 flex-1', refreshing && 'opacity-50 transition-opacity')}>
                    {/* Horizontal Bar Chart */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                        <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">
                            Import Value by Chapter (USD)
                        </p>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                            >
                                <XAxis
                                    type="number"
                                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace' }}
                                    tickFormatter={(v) => formatTradeValue(v)}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="hs_code"
                                    width={28}
                                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'monospace' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={14}>
                                    {chartData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top 10 table */}
                    <div className="overflow-x-auto rounded-2xl border border-white/5">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em] w-14">HS2</th>
                                    <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em]">Chapter</th>
                                    <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">Import Value</th>
                                    <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">YoY</th>
                                    <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {top10.map((row) => {
                                    const isPositive = (row.yoy_growth_pct ?? 0) >= 0
                                    return (
                                        <tr
                                            key={row.hs_code}
                                            className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="px-4 py-4 font-mono text-white/40">{row.hs_code}</td>
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-white/80 group-hover:text-white transition-colors">
                                                    {HS2_CHAPTER_NAMES[row.hs_code] || `Chapter ${row.hs_code} Category`}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-black text-cyan-400/80">
                                                {formatTradeValue(row.import_value_usd)}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono font-black">
                                                {row.yoy_growth_pct !== null && row.yoy_growth_pct !== undefined ? (
                                                    <div className={cn(
                                                        'flex items-center justify-end gap-1',
                                                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                                                    )}>
                                                        {isPositive
                                                            ? <ArrowUpRight className="w-3 h-3" />
                                                            : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(row.yoy_growth_pct).toFixed(1)}%
                                                    </div>
                                                ) : (
                                                    <span className="text-white/20">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-white/40">
                                                {(row.share_of_total_pct ?? 0).toFixed(2)}%
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Import Origin Choropleth */}
                    <ImportOriginMap reporterIso3={selectedISO} reporterName={selectedCountryName} />

                    {/* Key Import Dependencies & Vulnerabilities */}
                    <div className="rounded-2xl bg-cyan-500/[0.04] border border-cyan-500/10 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-cyan-400/70 shrink-0" />
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                Key Import Dependencies &amp; Structural Vulnerabilities
                            </p>
                        </div>
                        <div className="space-y-3">
                            {vulnerabilityNotes.map((note, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 mt-1.5 shrink-0" />
                                    <p className="text-[11px] text-white/50 leading-relaxed font-semibold">{note}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] pt-2 border-t border-white/5">
                            Source: UN Comtrade bilateral flows · GraphiQuestor analysis
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
