import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, ArrowLeft, Globe2, AlertTriangle, Calendar } from 'lucide-react'
import { useHSDemand } from '../features/trade/hooks/useHSDemand'
import { useHSCodeSearch } from '../features/trade/hooks/useHSCodeSearch'
import { GlobalDemandRanker } from '../features/trade/components/GlobalDemandRanker'
import { FreshnessChip } from '../components/FreshnessChip'
import { TradeRankerSkeleton } from '../features/trade/components/TradeRankerSkeleton'

const HSCodeOverviewPage: React.FC = () => {
    const { code } = useParams<{ code: string }>()
    const navigate = useNavigate()

    const { refresh, ...state } = useHSDemand(code || null)
    
    // Quick fetch to get description
    const { results } = useHSCodeSearch(code || '')
    const hsDescription = results.find(r => r.code === code)?.description

    const cachedAt = state.status === 'success' ? state.cachedAt : null
    const freshnessStatus = React.useMemo(() => {
        if (!cachedAt) return 'no_data'
        const diff = Date.now() - new Date(cachedAt).getTime()
        const days = diff / (1000 * 60 * 60 * 24)
        if (days < 7) return 'fresh'
        if (days < 30) return 'lagged'
        return 'stale'
    }, [cachedAt])

    const isLoading = state.status === 'loading' || state.status === 'fetching_live' || state.status === 'refreshing'

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-24 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/trade')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white/60" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-black text-white italic tracking-heading uppercase flex items-center gap-3">
                                <Globe2 className="w-6 h-6 text-emerald-500" />
                                Global Demand Ranking
                            </h1>
                            {state.status === 'success' && (
                                <FreshnessChip 
                                    status={freshnessStatus} 
                                    lastUpdated={state.cachedAt}
                                />
                            )}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white/40 font-mono mt-1">
                            HS {code} {hsDescription ? `— ${hsDescription}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refresh()}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            isLoading 
                                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
                        }`}
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        {state.status === 'refreshing' ? 'Regenerating...' : 'Refresh Intelligence'}
                    </button>
                </div>
            </div>
            
            {state.status === 'success' && state.isFallback && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-rose-500 uppercase tracking-tight">Latest Refresh Failed</p>
                            <p className="text-xs font-medium text-rose-500/70">
                                {state.softError || 'Showing last known good data while live data is unavailable.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => refresh()}
                        className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-400 transition-colors shrink-0 shadow-lg shadow-rose-500/20"
                    >
                        Retry Refresh
                    </button>
                </div>
            )}

            {state.status === 'success' && !state.isFallback && freshnessStatus === 'stale' && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-500 uppercase tracking-tight">Historical Data Notice</p>
                            <p className="text-xs font-medium text-amber-500/60">This intelligence report is over 30 days old. A refresh is recommended for current UN Comtrade trends.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refresh()}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors shrink-0"
                    >
                        Update Now
                    </button>
                </div>
            )}

            {state.status === 'error' && (
                <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <p className="text-sm font-bold text-rose-400">{state.message}</p>
                    <button 
                        onClick={() => refresh()}
                        className="mt-4 text-xs font-bold text-white/40 hover:text-white transition-colors underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Ranker Table */}
            {isLoading && state.status !== 'refreshing' ? (
                <TradeRankerSkeleton />
            ) : (
                <GlobalDemandRanker 
                    markets={state.status === 'success' ? state.markets : []} 
                    hsCode={code || ''} 
                    loading={isLoading && state.status !== 'refreshing'} 
                    refreshing={state.status === 'refreshing'}
                />
            )}
        </div>
    )
}

export default HSCodeOverviewPage
