import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HSCodeSearch } from '../HSCodeSearch'
import { GlobalDemandRanker } from '../GlobalDemandRanker'
import { RecentHSCodes } from '../RecentHSCodes'
import { TradeRankerSkeleton } from '../TradeRankerSkeleton'
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge'
import { useHSDemand } from '../../hooks/useHSDemand'
import { useRecentHSCodes } from '../../hooks/useRecentHSCodes'
import { COMTRADE_PROVENANCE } from '../../constants'
import type { HSCodeMaster } from '../../types/trade'

export const ExportMarketsView: React.FC = () => {
    const navigate = useNavigate()
    const { push } = useRecentHSCodes()
    const [activeCode, setActiveCode] = useState<string | null>(null)
    const [activeDescription, setActiveDescription] = useState<string>('')

    const demandState = useHSDemand(activeCode)

    const handleSelect = (item: HSCodeMaster) => {
        push(item.code, item.description)
        setActiveCode(item.code)
        setActiveDescription(item.description)
    }

    const isLoading = demandState.status === 'loading' || demandState.status === 'fetching_live'
    const markets = demandState.status === 'success' ? demandState.markets : []

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-white/40 font-semibold max-w-xl">
                    Search a 6-digit HS code to rank global import markets by opportunity score.
                </p>
                <DataProvenanceBadge
                    source={COMTRADE_PROVENANCE.source}
                    methodology={COMTRADE_PROVENANCE.methodology}
                    size="sm"
                />
            </div>

            <HSCodeSearch onSelect={handleSelect} autoFocus />

            <RecentHSCodes />

            {activeCode && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                Demand Ranking — HS {activeCode}
                            </h3>
                            {activeDescription && (
                                <p className="text-xs text-white/40 font-mono mt-1">{activeDescription}</p>
                            )}
                        </div>
                        <button
                            onClick={() => navigate(`/trade/hs/${activeCode}`)}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            Open full page →
                        </button>
                    </div>

                    {isLoading ? (
                        <TradeRankerSkeleton />
                    ) : (
                        <GlobalDemandRanker
                            markets={markets}
                            hsCode={activeCode}
                            loading={isLoading}
                            refreshing={demandState.status === 'refreshing'}
                        />
                    )}
                </div>
            )}
        </div>
    )
}