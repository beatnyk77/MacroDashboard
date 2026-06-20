import React, { useState } from 'react'
import { HSCodeSearch } from '../HSCodeSearch'
import { RecentHSCodes } from '../RecentHSCodes'
import { MacroHealthCell } from '../MacroHealthCell'
import { TradeRankerSkeleton } from '../TradeRankerSkeleton'
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge'
import { useHSImportFlows, concentrationLabel, formatImportFlowValue } from '../../hooks/useHSImportFlows'
import { useRecentHSCodes } from '../../hooks/useRecentHSCodes'
import { COMTRADE_PROVENANCE } from '../../constants'
import { cn } from '@/lib/utils'
import type { HSCodeMaster } from '../../types/trade'

export const ImportFlowsView: React.FC = () => {
    const { push } = useRecentHSCodes()
    const [activeCode, setActiveCode] = useState<string | null>(null)
    const [activeDescription, setActiveDescription] = useState<string>('')

    const { data, isLoading, error } = useHSImportFlows(activeCode)

    const handleSelect = (item: HSCodeMaster) => {
        push(item.code, item.description)
        setActiveCode(item.code)
        setActiveDescription(item.description)
    }

    const hhi = data?.hhi ?? 0
    const concentration = concentrationLabel(hhi)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-white/40 font-semibold max-w-xl">
                    Identify global supplier concentration and macro stability for any HS code.
                </p>
                <DataProvenanceBadge
                    source={COMTRADE_PROVENANCE.source}
                    methodology="Supplier breakdown · bilateral flows"
                    size="sm"
                />
            </div>

            <HSCodeSearch onSelect={handleSelect} />
            <RecentHSCodes />

            {activeCode && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                Supplier Concentration — HS {activeCode}
                            </h3>
                            {activeDescription && (
                                <p className="text-xs text-white/40 font-mono mt-1">{activeDescription}</p>
                            )}
                        </div>
                        {data && (
                            <span className={cn('px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider', concentration.color)}>
                                HHI {hhi.toFixed(2)} · {concentration.label}
                            </span>
                        )}
                    </div>

                    {isLoading && <TradeRankerSkeleton />}

                    {error && (
                        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">
                            Failed to load supplier data.
                        </div>
                    )}

                    {!isLoading && !error && data?.rows.length === 0 && (
                        <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                            <p className="text-xs font-black text-white/20 uppercase tracking-widest">No supplier data for this code</p>
                        </div>
                    )}

                    {data && data.rows.length > 0 && (
                        <div className="overflow-x-auto rounded-2xl border border-white/5">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-4 py-3 text-left font-black text-white/25 uppercase tracking-widest">Supplier</th>
                                        <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-widest">Volume</th>
                                        <th className="px-4 py-3 text-right font-black text-white/25 uppercase tracking-widest">Share</th>
                                        <th className="px-4 py-3 text-center font-black text-white/25 uppercase tracking-widest">Macro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.rows.map(row => (
                                        <tr key={row.partner_iso3} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                            <td className="px-4 py-3">
                                                <p className="font-black text-white/80">{row.partner_name || row.partner_iso3}</p>
                                                <p className="text-[10px] text-white/25 font-mono">{row.partner_iso3}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-black text-white/70">
                                                {formatImportFlowValue(row.total_import_usd)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-black text-cyan-400">
                                                {row.market_share_pct.toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <MacroHealthCell score={row.macro_score} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}