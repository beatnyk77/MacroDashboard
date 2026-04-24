import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OpportunityScoreBadge } from './OpportunityScoreBadge'
import type { TradeMarket } from '../types/trade'
import { formatTradeValue } from '../types/trade'

interface GlobalDemandRankerProps {
    markets: TradeMarket[]
    hsCode: string
    loading?: boolean
}

type SortKey = 'overall_score' | 'latest_import_usd' | 'cagr_5yr_pct' | 'hhi' | 'macro_score'
type SortDir = 'asc' | 'desc'

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 text-white/20" />
    return sortDir === 'desc'
        ? <ChevronDown className="w-3 h-3 text-emerald-400" />
        : <ChevronUp className="w-3 h-3 text-emerald-400" />
}

const ColHeader = ({ col, label, sortKey, sortDir, handleSort }: { col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir; handleSort: (k: SortKey) => void }) => (
    <button
        onClick={() => handleSort(col)}
        className="flex items-center gap-1 hover:text-white transition-colors group"
    >
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
    </button>
)

export const GlobalDemandRanker: React.FC<GlobalDemandRankerProps> = ({
    markets,
    hsCode,
    loading = false,
}) => {
    const navigate = useNavigate()
    const [sortKey, setSortKey] = useState<SortKey>('overall_score')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [page, setPage] = useState(0)
    const perPage = 15

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc')
        } else {
            setSortKey(key)
            setSortDir('desc')
        }
        setPage(0)
    }

    const sorted = [...markets].sort((a, b) => {
        const av = (a as any)[sortKey] ?? -Infinity
        const bv = (b as any)[sortKey] ?? -Infinity
        return sortDir === 'desc' ? bv - av : av - bv
    })

    const paginated = sorted.slice(page * perPage, (page + 1) * perPage)
    const totalPages = Math.ceil(sorted.length / perPage)

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">
                    Computing market intelligence…
                </p>
            </div>
        )
    }

    if (markets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-2">
                <p className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">No market data found</p>
                <p className="text-xs text-white/10">Data may still be processing — check back shortly.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Summary stat row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Markets Ranked', value: markets.length },
                    { label: 'Top Opportunity', value: sorted[0]?.reporter_name || '—' },
                    { label: 'Top Score', value: sorted[0]?.overall_score ?? '—' },
                ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{s.label}</p>
                        <p className="text-xl font-black text-white font-mono">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em] w-10">#</th>
                            <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em]">Market</th>
                            <th className="px-4 py-3 text-center font-black text-white/25 uppercase tracking-[0.15em]">
                                <ColHeader col="overall_score" label="Score" sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                            </th>
                            <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">
                                <ColHeader col="latest_import_usd" label="Import Value" sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                            </th>
                            <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">
                                <ColHeader col="cagr_5yr_pct" label="5yr Growth" sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                            </th>
                            <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">
                                <ColHeader col="hhi" label="HHI" sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                            </th>
                            <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-[0.15em]">
                                <ColHeader col="macro_score" label="Macro" sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                            </th>
                            <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-[0.15em]">Tags</th>
                            <th className="px-3 py-3 w-8" />
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((m, i) => {
                            const rank = page * perPage + i + 1
                            const isTop3 = rank <= 3
                            const cagrPositive = (m.cagr_5yr_pct ?? 0) >= 0

                            return (
                                <tr
                                    key={`${m.reporter_iso3}-${m.hs_code}`}
                                    onClick={() => navigate(`/trade/hs/${hsCode}/market/${m.reporter_iso3}`)}
                                    className={cn(
                                        'border-b border-white/[0.04] cursor-pointer group transition-all duration-150',
                                        'hover:bg-emerald-500/5 hover:border-emerald-500/10',
                                        isTop3 && 'bg-white/[0.015]'
                                    )}
                                >
                                    {/* Rank */}
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            'text-xs font-black font-mono',
                                            rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-600' : 'text-white/20'
                                        )}>
                                            {String(rank).padStart(2, '0')}
                                        </span>
                                    </td>

                                    {/* Country */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base leading-none">{m.flag}</span>
                                            <div>
                                                <p className="font-black text-white/85 group-hover:text-white transition-colors">
                                                    {m.reporter_name || m.reporter_iso3}
                                                </p>
                                                <p className="text-[10px] text-white/25 font-mono">{m.reporter_iso3}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Score badge */}
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            <OpportunityScoreBadge score={m.overall_score} size="sm" />
                                        </div>
                                    </td>

                                    {/* Import value */}
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-black text-white/70 font-mono">
                                            {formatTradeValue(m.latest_import_usd)}
                                        </span>
                                    </td>

                                    {/* CAGR */}
                                    <td className="px-4 py-3 text-right">
                                        {m.cagr_5yr_pct !== null ? (
                                            <div className={cn('flex items-center justify-end gap-1 font-black font-mono', cagrPositive ? 'text-emerald-400' : 'text-rose-400')}>
                                                {cagrPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                {Math.abs(m.cagr_5yr_pct).toFixed(1)}%
                                            </div>
                                        ) : (
                                            <span className="text-white/20">—</span>
                                        )}
                                    </td>

                                    {/* HHI */}
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn('font-black font-mono',
                                            (m.hhi ?? 0) < 0.2 ? 'text-emerald-400' :
                                            (m.hhi ?? 0) < 0.4 ? 'text-amber-400' : 'text-rose-400'
                                        )}>
                                            {m.hhi !== null ? m.hhi.toFixed(2) : '—'}
                                        </span>
                                    </td>

                                    {/* Macro score */}
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn('font-black font-mono',
                                            m.macro_score >= 70 ? 'text-emerald-400' :
                                            m.macro_score >= 45 ? 'text-amber-400' : 'text-rose-400'
                                        )}>
                                            {m.macro_score}
                                        </span>
                                    </td>

                                    {/* Tags */}
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {m.opportunityTags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-white/5 text-white/40 whitespace-nowrap">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Arrow */}
                                    <td className="px-3 py-3">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-white/10 group-hover:text-emerald-400 transition-colors rotate-[0deg]" />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-white/30 font-bold">
                        Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, sorted.length)} of {sorted.length}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3 py-1.5 text-xs font-black rounded-lg bg-white/5 border border-white/5 disabled:opacity-30 hover:bg-white/10 transition-all"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="px-3 py-1.5 text-xs font-black rounded-lg bg-white/5 border border-white/5 disabled:opacity-30 hover:bg-white/10 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
