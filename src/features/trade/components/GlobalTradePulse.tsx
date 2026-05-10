import React, { useState } from 'react'
import { Globe2, ArrowUpRight, ArrowDownRight, Info, RefreshCw } from 'lucide-react'
import { useGlobalTrade } from '../hooks/useGlobalTrade'
import { formatTradeValue, isoToFlag } from '../types/trade'
import { HS2_CHAPTER_NAMES } from '../types/hsCodes'
import { FreshnessChip, FreshnessStatus } from '@/components/FreshnessChip'
import { TradeRankerSkeleton } from './TradeRankerSkeleton'
import { cn } from '@/lib/utils'

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

export const GlobalTradePulse: React.FC = () => {
    const [selectedISO, setSelectedISO] = useState('CHN')
    const { data, loading, refreshing, error, refresh, lastFetchedAt } = useGlobalTrade(selectedISO)

    const selectedCountry = MAJOR_REPORTERS.find(r => r.iso3 === selectedISO)

    const [now] = React.useState(() => Date.now())
    const isLoading = loading || refreshing

    const getFreshnessStatus = (date: string | null | undefined): FreshnessStatus => {
        if (!date) return 'no_data'
        const diff = now - new Date(date).getTime()
        const days = diff / (1000 * 60 * 60 * 24)
        if (days < 7) return 'fresh'
        if (days < 30) return 'lagged'
        return 'stale'
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                        <Globe2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-black text-white italic tracking-heading uppercase">
                                Global Market Pulse
                            </h2>
                            {lastFetchedAt && (
                                <FreshnessChip 
                                    status={getFreshnessStatus(lastFetchedAt)} 
                                    lastUpdated={lastFetchedAt}
                                />
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                            Top Export Chapters (2-Digit HS)
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-2">
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

                    <button
                        onClick={() => refresh()}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            isLoading 
                                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
                        }`}
                    >
                        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {data.length > 0 && getFreshnessStatus(lastFetchedAt) === 'stale' && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <RefreshCw className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-500 uppercase tracking-tight">Market Pulse is Stale</p>
                            <p className="text-xs font-medium text-amber-500/60">This data is over 30 days old. Trigger a refresh to ingest the latest global trade flows.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refresh()}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors shrink-0"
                    >
                        Refresh Now
                    </button>
                </div>
            )}

            {loading ? (
                <TradeRankerSkeleton />
            ) : error ? (
                <div className="h-[400px] flex items-center justify-center rounded-3xl bg-rose-500/5 border border-rose-500/10">
                    <p className="text-xs font-bold text-rose-400">Failed to load pulse data: {error}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em] w-16">HS2</th>
                                <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em]">Chapter Description</th>
                                <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">Export Value</th>
                                <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">YoY Growth</th>
                                <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">Global Share</th>
                                <th className="px-4 py-3 text-center font-black text-white/25 uppercase tracking-[0.15em]">Potential</th>
                            </tr>
                        </thead>
                        <tbody className={cn(refreshing && "opacity-50 transition-opacity")}>
                            {data.slice(0, 15).map((row, _idx) => {
                                const isPositive = (row.yoy_growth_pct ?? 0) >= 0
                                return (
                                    <tr key={row.hs_code} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-4 py-4 font-mono text-white/40">{row.hs_code}</td>
                                        <td className="px-4 py-4">
                                            <p className="font-bold text-white/80 group-hover:text-white transition-colors">
                                                {HS2_CHAPTER_NAMES[row.hs_code] || `Chapter ${row.hs_code} Category`}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono font-black text-white/70">
                                            {formatTradeValue(row.export_value_usd)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className={cn(
                                                "flex items-center justify-end gap-1 font-mono font-black",
                                                isPositive ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                {Math.abs(row.yoy_growth_pct ?? 0).toFixed(1)}%
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-white/40">
                                            {(row.share_of_total_pct ?? 0).toFixed(2)}%
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                <div className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                                    row.untapped_score >= 80 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                                    row.untapped_score >= 50 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                                                    "bg-white/5 text-white/20 border border-white/5"
                                                )}>
                                                    {row.untapped_score >= 80 ? 'High' : row.untapped_score >= 50 ? 'Medium' : 'Stable'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    
                    {data.length === 0 && !loading && (
                        <div className="p-12 text-center border-t border-white/5">
                            <Info className="w-6 h-6 text-white/10 mx-auto mb-3" />
                            <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No data available for {selectedCountry?.name}</p>
                            <p className="text-[10px] text-white/10 mt-1 uppercase tracking-widest">Trigger ingestion to populate</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
