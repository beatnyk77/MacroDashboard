import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe2 } from 'lucide-react'
import { useHSDemand } from '../features/trade/hooks/useHSDemand'
import { useHSCodeSearch } from '../features/trade/hooks/useHSCodeSearch'
import { GlobalDemandRanker } from '../features/trade/components/GlobalDemandRanker'

const HSCodeOverviewPage: React.FC = () => {
    const { code } = useParams<{ code: string }>()
    const navigate = useNavigate()

    const state = useHSDemand(code || null)
    
    // Quick fetch to get description
    const { results } = useHSCodeSearch(code || '')
    const hsDescription = results.find(r => r.code === code)?.description

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/trade')}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-white/60" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-heading uppercase flex items-center gap-3">
                        <Globe2 className="w-6 h-6 text-emerald-500" />
                        Global Demand Ranking
                    </h1>
                    <p className="text-sm font-bold text-white/40 font-mono mt-1">
                        HS {code} {hsDescription ? `— ${hsDescription}` : ''}
                    </p>
                </div>
                {state.status === 'success' && state.cachedAt && (
                    <div className="ml-auto text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                            Live Intelligence
                        </p>
                        <p className="text-[10px] font-mono text-white/30">
                            Data as of {new Date(state.cachedAt).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>

            {state.status === 'error' && (
                <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <p className="text-sm font-bold text-rose-400">{state.message}</p>
                </div>
            )}

            {/* Ranker Table */}
            <GlobalDemandRanker 
                markets={state.status === 'success' ? state.markets : []} 
                hsCode={code || ''} 
                loading={state.status === 'loading' || state.status === 'fetching_live'} 
            />
        </div>
    )
}

export default HSCodeOverviewPage
