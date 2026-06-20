import React from 'react'
import { MapPin, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FreshnessChip, type FreshnessStatus } from '@/components/FreshnessChip'
import type { UKTraderIntelligence } from '../../hooks/useUKTraderIntel'

const FREE_ROW_LIMIT = 10

function mapStaleness(flag: UKTraderIntelligence['staleness_flag']): FreshnessStatus {
    if (flag === 'very_lagged') return 'stale'
    return flag
}

interface UKTraderTableProps {
    traders: UKTraderIntelligence[]
    hsCode: string
    loading?: boolean
    error?: boolean
    onRetry?: () => void
}

export const UKTraderTable: React.FC<UKTraderTableProps> = ({
    traders,
    hsCode,
    loading,
    error,
    onRetry,
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <RefreshCw className="w-6 h-6 text-white/30 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-rose-400">
                <AlertCircle size={24} />
                <span className="text-sm">Failed to load trader data</span>
                {onRetry && (
                    <button onClick={onRetry} className="text-xs underline hover:text-rose-300">Retry</button>
                )}
            </div>
        )
    }

    if (traders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-white/30">
                <p className="text-sm font-semibold">No entity records for HS {hsCode}</p>
                <p className="text-xs text-white/20">Data ingests on first visit — retry in a moment if recently triggered.</p>
            </div>
        )
    }

    const visible = traders.slice(0, FREE_ROW_LIMIT)
    const hasMore = traders.length > FREE_ROW_LIMIT

    return (
        <div className="space-y-3">
            <div className="overflow-auto max-h-[420px] rounded-xl border border-white/5">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-950 border-b border-white/5 z-10">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-white/25 uppercase tracking-widest">Company</th>
                            <th className="px-4 py-3 text-[10px] font-black text-white/25 uppercase tracking-widest">Postcode</th>
                            <th className="px-4 py-3 text-[10px] font-black text-white/25 uppercase tracking-widest">Flow</th>
                            <th className="px-4 py-3 text-[10px] font-black text-white/25 uppercase tracking-widest">Month</th>
                            <th className="px-4 py-3 text-[10px] font-black text-white/25 uppercase tracking-widest">Freshness</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {visible.map(trader => (
                            <tr key={trader.id} className="hover:bg-white/[0.02]">
                                <td className="px-4 py-3 font-semibold text-white/85">{trader.company_name}</td>
                                <td className="px-4 py-3 text-white/40">
                                    <span className="inline-flex items-center gap-1.5">
                                        <MapPin size={12} className="text-white/20" />
                                        {trader.postcode || '—'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        'px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border',
                                        trader.flow_type === 'Import'
                                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    )}>
                                        {trader.flow_type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white/40 font-mono text-xs">{trader.month_id}</td>
                                <td className="px-4 py-3">
                                    <FreshnessChip status={mapStaleness(trader.staleness_flag)} lastUpdated={trader.last_updated} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {hasMore && (
                <p className="text-[10px] text-white/30 text-center font-semibold">
                    Showing {FREE_ROW_LIMIT} of {traders.length} entities.
                    <a href="mailto:hello@graphiquestor.com?subject=UK%20Trade%20Full%20Directory" className="text-indigo-400 hover:text-indigo-300 ml-1">
                        Request full directory →
                    </a>
                </p>
            )}
        </div>
    )
}