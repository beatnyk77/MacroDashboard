import React, { useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RefreshCw, AlertTriangle, Calendar, MapPin, ExternalLink } from 'lucide-react'
import { useHSDemand } from '../features/trade/hooks/useHSDemand'
import { useMarketDrilldown } from '../features/trade/hooks/useMarketDrilldown'
import { MarketOpportunityCard } from '../features/trade/components/MarketOpportunityCard'
import { ImportTrendChart } from '../features/trade/components/ImportTrendChart'
import { SupplierShareChart } from '../features/trade/components/SupplierShareChart'
import { MacroOverlayPanel } from '../features/trade/components/MacroOverlayPanel'
import { isoToFlag } from '../features/trade/types/trade'
import { FreshnessChip } from '../components/FreshnessChip'
import { DrilldownSkeleton } from '../features/trade/components/DrilldownSkeleton'
import { cn } from '../lib/utils'
import { SEOManager } from '@/components/SEOManager'
import { RelatedContent } from '@/components/RelatedContent'
import { RelatedMetrics } from '@/components/RelatedMetrics'
import { ShareButton } from '@/components/ShareButton'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge'
import { TradeBreadcrumbs } from '@/features/trade/components/TradeBreadcrumbs'
import { COMTRADE_PROVENANCE } from '@/features/trade/constants'

const MarketDeepDivePage: React.FC = () => {
    const { code, iso } = useParams<{ code: string; iso: string }>()
    const drilldownRef = useRef<HTMLDivElement>(null)
    // We need iso2 for macro overlay. The demand hook holds this in the list.
    const demandState = useHSDemand(code || null)
    const state = demandState as any
    const markets = state.status === 'success' ? state.markets : []
    const marketScore = markets.find((m: any) => m.reporter_iso3 === iso)
    
    const { trend, suppliers, macroMetrics, loading: drilldownLoading, error: drilldownError } = useMarketDrilldown(
        code || null, 
        iso || null, 
        marketScore?.reporter_iso2 || null
    )

    const [now] = React.useState(() => Date.now())
    const cachedAt = state.status === 'success' ? state.cachedAt : null

    const freshnessStatus = React.useMemo(() => {
        if (!cachedAt) return 'no_data'
        const diff = now - new Date(cachedAt).getTime()
        const days = diff / (1000 * 60 * 60 * 24)
        if (days < 7) return 'fresh'
        if (days < 30) return 'lagged'
        return 'stale'
    }, [cachedAt, now])

    const isLoading = state.status === 'loading' || state.status === 'fetching_live' || state.status === 'refreshing' || drilldownLoading

    if (!code || !iso) return null

    const countryName = marketScore?.reporter_name || iso
    const displayTitle = `${countryName} Import Intelligence Deep Dive | HS ${code}`
    const displayDesc = `Detailed import flows, supplier shares, and real-time macroeconomic health overlay for HS code ${code} into ${countryName}. Institutional macro telemetry.`

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-24">
            <SEOManager
                title={displayTitle}
                description={displayDesc}
                keywords={[
                    `HS ${code} ${countryName}`, `${countryName} imports HS ${code}`,
                    `supplier share ${countryName} HS ${code}`, 'GraphiQuestor'
                ]}
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Dataset",
                        "@id": `https://graphiquestor.com/trade/hs/${code}/market/${iso}#dataset`,
                        "name": `${countryName} Import Opportunity Dataset for HS ${code}`,
                        "description": `Detailed bilateral import flows, HHI supplier shares, and real-time macroeconomic indicators for HS ${code} into ${countryName}.`,
                        "url": `https://graphiquestor.com/trade/hs/${code}/market/${iso}`,
                        "creator": {
                            "@id": "https://graphiquestor.com/#organization"
                        },
                        "temporalCoverage": "2020-01-01/2026-05-30",
                        "spatialCoverage": countryName
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": `Market Deep Dive: HS ${code} in ${countryName}`,
                        "description": `Detailed import flows, supplier shares, and real-time macroeconomic health overlay for HS code ${code} into ${countryName}.`,
                        "author": {
                            "@type": "Organization",
                            "name": "GraphiQuestor"
                        }
                    }
                ]}
            />

            <div className="px-4 sm:px-6">
                <TradeBreadcrumbs
                    crumbs={[
                        { label: 'Trade Intelligence', to: '/trade' },
                        { label: `HS ${code}`, to: `/trade/hs/${code}` },
                        { label: marketScore?.reporter_name || iso },
                    ]}
                />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl sm:text-2xl font-black text-white italic tracking-heading uppercase flex items-center gap-3">
                            <span className="text-2xl sm:text-3xl leading-none shrink-0">{isoToFlag(marketScore?.reporter_iso2 || null)}</span>
                            {marketScore?.reporter_name || iso}
                        </h1>
                        {state.status === 'success' && (
                            <FreshnessChip
                                status={freshnessStatus}
                                lastUpdated={state.cachedAt}
                            />
                        )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-white/40 font-mono mt-1">
                        Market Drilldown for HS {code}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <DataProvenanceBadge
                        source={COMTRADE_PROVENANCE.source}
                        methodology={COMTRADE_PROVENANCE.methodology}
                        lastVerified={cachedAt}
                        size="sm"
                    />
                    {iso === 'GBR' && (
                        <Link
                            to={`/trade/uk/${code}`}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
                        >
                            UK Entity Intel
                        </Link>
                    )}
                    <button
                        onClick={() => state.refresh()}
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
                <div className="mx-4 sm:mx-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
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
                        onClick={() => state.refresh()}
                        className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-400 transition-colors shrink-0 shadow-lg shadow-rose-500/20"
                    >
                        Retry Refresh
                    </button>
                </div>
            )}

            {state.status === 'success' && !state.isFallback && freshnessStatus === 'stale' && (
                <div className="mx-4 sm:mx-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-500 uppercase tracking-tight">Historical Data Notice</p>
                            <p className="text-xs font-medium text-amber-500/60">This market analysis is over 30 days old. A refresh is recommended for current UN Comtrade data.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => state.refresh()}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-colors shrink-0"
                    >
                        Update Now
                    </button>
                </div>
            )}

            {(drilldownError || state.status === 'error') && (
                <div className="mx-4 sm:mx-6 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-sm font-bold text-rose-400">{drilldownError || (state as any).message}</p>
                </div>
            )}

            <div className="px-4 sm:px-6">
                <SectionErrorBoundary name="Market Drilldown">
                <div ref={drilldownRef} className="relative group">
                    <ShareButton
                        targetRef={drilldownRef}
                        title={`${countryName} Market Drilldown — HS ${code}`}
                        dataSource="UN Comtrade"
                        href={`/trade/hs/${code}/market/${iso}`}
                    />
                {isLoading && state.status !== 'refreshing' ? (
                    <DrilldownSkeleton />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column (2/3): Charts */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className={cn("p-6 rounded-3xl bg-white/[0.02] border border-white/5 transition-opacity", state.status === 'refreshing' && "opacity-50")}>
                                <ImportTrendChart data={trend} countryName={marketScore?.reporter_name || iso} />
                            </div>
                            <div className={cn("p-6 rounded-3xl bg-white/[0.02] border border-white/5 transition-opacity", state.status === 'refreshing' && "opacity-50")}>
                                <SupplierShareChart data={suppliers} />
                            </div>
                        </div>

                        {/* Right Column (1/3): Context & Macro */}
                        <div className="space-y-6">
                            {marketScore ? (
                                <div className={cn("transition-opacity", state.status === 'refreshing' && "opacity-50")}>
                                    <MarketOpportunityCard score={marketScore} />
                                </div>
                            ) : null}

                            <div className={cn("p-6 rounded-3xl bg-white/[0.02] border border-white/5 transition-opacity", state.status === 'refreshing' && "opacity-50")}>
                                <MacroOverlayPanel metrics={macroMetrics} loading={drilldownLoading} />
                                
                                {marketScore?.reporter_iso2 && (
                                    <Link
                                        to={`/countries/${marketScore.reporter_iso2}`}
                                        className="w-full mt-6 py-3 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors flex items-center justify-center gap-2 group decoration-none"
                                    >
                                        <MapPin className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest group-hover:text-white transition-colors">
                                            View Full Macro Profile
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-blue-400/50" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                </div>
                </SectionErrorBoundary>
            </div>
            <RelatedMetrics path={`/trade/hs/${code}/market/${iso}`} />
            <RelatedContent />
        </div>
    )
}

export default MarketDeepDivePage
