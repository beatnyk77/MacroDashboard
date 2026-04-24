import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, ExternalLink } from 'lucide-react'
import { useMarketDrilldown } from '../features/trade/hooks/useMarketDrilldown'
import { useHSDemand } from '../features/trade/hooks/useHSDemand'
import { ImportTrendChart } from '../features/trade/components/ImportTrendChart'
import { SupplierShareChart } from '../features/trade/components/SupplierShareChart'
import { MacroOverlayPanel } from '../features/trade/components/MacroOverlayPanel'
import { MarketOpportunityCard } from '../features/trade/components/MarketOpportunityCard'
import { isoToFlag } from '../features/trade/types/trade'

const MarketDeepDivePage: React.FC = () => {
    const { code, iso } = useParams<{ code: string; iso: string }>()
    const navigate = useNavigate()

    // We need iso2 for macro overlay. The demand hook holds this in the list.
    const state = useHSDemand(code || null)
    const markets = state.status === 'success' ? state.markets : []
    const marketScore = markets.find((m: any) => m.reporter_iso3 === iso)
    
    const { trend, suppliers, macroMetrics, loading, error } = useMarketDrilldown(
        code || null, 
        iso || null, 
        marketScore?.reporter_iso2 || null
    )

    if (!code || !iso) return null

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(`/trade/hs/${code}`)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white/60" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white italic tracking-heading uppercase flex items-center gap-3">
                            <span className="text-3xl leading-none">{isoToFlag(marketScore?.reporter_iso2 || null)}</span>
                            {marketScore?.reporter_name || iso}
                        </h1>
                        <p className="text-sm font-bold text-white/40 font-mono mt-1">
                            Market Analysis for HS {code}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-sm font-bold text-rose-400">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3): Charts */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                        <ImportTrendChart data={trend} countryName={marketScore?.reporter_name || iso} />
                    </div>
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                        <SupplierShareChart data={suppliers} />
                    </div>
                </div>

                {/* Right Column (1/3): Context & Macro */}
                <div className="space-y-6">
                    {marketScore ? (
                        <MarketOpportunityCard score={marketScore} />
                    ) : loading ? (
                        <div className="h-64 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                    ) : null}

                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                        <MacroOverlayPanel metrics={macroMetrics} loading={loading} />
                        
                        {marketScore?.reporter_iso2 && (
                            <button
                                onClick={() => navigate(`/countries/${marketScore.reporter_iso2}`)}
                                className="w-full mt-6 py-3 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors flex items-center justify-center gap-2 group"
                            >
                                <MapPin className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-black text-blue-400 uppercase tracking-widest group-hover:text-white transition-colors">
                                    View Full Macro Profile
                                </span>
                                <ExternalLink className="w-3 h-3 text-blue-400/50" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketDeepDivePage
