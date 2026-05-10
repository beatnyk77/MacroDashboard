import React, { useState } from 'react'
import { Target, TrendingUp, BarChart3, AlertCircle, RefreshCw } from 'lucide-react'
import { useIndiaChinaComparison } from '../hooks/useIndiaChinaComparison'
import { formatTradeValue } from '../types/trade'
import { cn } from '@/lib/utils'
import { ComparisonSkeleton } from './ComparisonSkeleton'
import { FreshnessChip, FreshnessStatus } from '@/components/FreshnessChip'

const COMPARISON_CATEGORIES = [
    { label: 'Smartphones', code: '851713' },
    { label: 'EVs', code: '870380' },
    { label: 'Solar Cells', code: '854143' },
    { label: 'Processors', code: '854231' },
    { label: 'Medicaments', code: '300490' },
    { label: 'Cotton Apparel', code: '620342' },
]

export const IndiaChinaDeepDive: React.FC = () => {
    const [selectedCode, setSelectedCode] = useState(COMPARISON_CATEGORIES[0].code)
    const { data, loading, refreshing, error, refresh, lastFetchedAt } = useIndiaChinaComparison(selectedCode)
    const latest = data[0]

    const getFreshnessStatus = (date: string | null | undefined): FreshnessStatus => {
        if (!date) return 'no_data'
        const diff = Date.now() - new Date(date).getTime()
        const days = diff / (1000 * 60 * 60 * 24)
        if (days < 7) return 'fresh'
        if (days < 30) return 'lagged'
        return 'stale'
    }

    return (
        <div className="w-full space-y-8 p-8 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] -ml-32 -mb-32 rounded-full pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-xl font-black text-white italic tracking-heading uppercase">
                            Manufacturing Shift: India vs China
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-xs text-white/40 font-bold uppercase tracking-[0.2em]">
                            6-Digit Granularity Deep Dive
                        </p>
                        {lastFetchedAt && (
                            <FreshnessChip 
                                status={getFreshnessStatus(lastFetchedAt)} 
                                lastUpdated={lastFetchedAt} 
                            />
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        {COMPARISON_CATEGORIES.map(c => (
                            <button
                                key={c.code}
                                onClick={() => setSelectedCode(c.code)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedCode === c.code
                                        ? "bg-white/10 text-white border border-white/20 shadow-lg shadow-black/20"
                                        : "bg-white/[0.02] text-white/30 border border-white/5 hover:border-white/20 hover:text-white/60"
                                )}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={refresh}
                        disabled={refreshing || loading}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50"
                        )}
                    >
                        <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                        {refreshing ? 'Syncing...' : 'Refresh Intelligence'}
                    </button>
                </div>
            </div>

            {lastFetchedAt && new Date().getTime() - new Date(lastFetchedAt).getTime() > 24 * 60 * 60 * 1000 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        Bilateral flow data might be stale. Click refresh to trigger live Comtrade ingestion for HS {selectedCode}.
                    </p>
                </div>
            )}

            {loading ? (
                <ComparisonSkeleton />
            ) : error ? (
                <div className="h-[300px] flex items-center justify-center rounded-2xl bg-rose-500/5 border border-rose-500/10 p-8 text-center">
                    <div className="space-y-2">
                        <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
                        <p className="text-xs font-bold text-rose-400">Failed to load comparison: {error}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                    {/* India Card */}
                    <div className="space-y-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🇮🇳</span>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Bharat Potential</h3>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Reporter: IND</p>
                                </div>
                            </div>
                            <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Emerging</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Export Value</p>
                                <p className="text-2xl font-black text-white font-mono">
                                    {formatTradeValue(latest?.india_export_usd ?? 0)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Quantity</p>
                                <p className="text-2xl font-black text-emerald-400 font-mono">
                                    {latest?.india_qty ? latest.india_qty.toLocaleString() : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3" /> Growth Trajectory
                                </span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
                            </div>
                        </div>
                    </div>

                    {/* China Card */}
                    <div className="space-y-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🇨🇳</span>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Dragon Dominance</h3>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Reporter: CHN</p>
                                </div>
                            </div>
                            <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Established</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Export Value</p>
                                <p className="text-2xl font-black text-white font-mono">
                                    {formatTradeValue(latest?.china_export_usd ?? 0)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Market Share</p>
                                <p className="text-2xl font-black text-blue-400 font-mono">
                                    {latest?.china_export_usd && latest?.india_export_usd ? Math.round((latest.china_export_usd / (latest.china_export_usd + latest.india_export_usd)) * 100) : 0}%
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <BarChart3 className="w-3 h-3" /> Market Concentration
                                </span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                            </div>
                        </div>
                    </div>

                    {!latest && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
                            <div className="text-center space-y-2">
                                <p className="text-xs font-black text-white uppercase tracking-widest">No detailed 6-digit data found</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">Trigger deep-dive sync to compare</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
