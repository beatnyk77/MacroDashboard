import React, { Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { SEOManager } from '@/components/SEOManager'
import { FreshnessChip } from '@/components/FreshnessChip'
import { RelatedContent } from '@/components/RelatedContent'
import { RelatedMetrics } from '@/components/RelatedMetrics'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { ModuleRow } from '@/components/layout/ModuleRow'
import { TradeViewToggle } from '@/features/trade/components/TradeViewToggle'
import { ExportMarketsView } from '@/features/trade/components/views/ExportMarketsView'
import { ImportFlowsView } from '@/features/trade/components/views/ImportFlowsView'
import { BilateralView } from '@/features/trade/components/views/BilateralView'
import { TRADE_DATA_YEAR, type TradeView } from '@/features/trade/constants'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getStaleness } from '@/hooks/useStaleness'
import { TrailNavLink } from '@/components/TrailLink'

const ViewFallback = () => (
    <div className="w-full min-h-[200px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Loading view…</span>
    </div>
)

const TradeDashboard: React.FC = () => {
    const [searchParams] = useSearchParams()
    const view = (searchParams.get('view') as TradeView) || 'exports'

    const { data: latestLog } = useQuery({
        queryKey: ['trade-ingestion-log'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ingestion_logs')
                .select('*')
                .eq('function_name', 'ingest-trade-global-pulse')
                .order('start_time', { ascending: false })
                .limit(1)
            if (error) return null
            return data?.[0] ?? null
        },
        refetchInterval: 30000,
    })

    const dataFreshness = getStaleness(latestLog?.start_time, 'daily')

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-24">
            <SEOManager
                title="Trade Intelligence Terminal — Export Markets & Import Flows | GraphiQuestor"
                description="Rank global export markets by opportunity score. Track bilateral trade flows. Identify supplier concentration risk. HS code-level trade intelligence with macro health overlay."
                keywords={[
                    'Trade Intelligence Terminal', 'HS Code Opportunity Scoring', 'UN Comtrade',
                    'Supplier Concentration', 'Import Flows', 'Export Markets',
                ]}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'Dataset',
                    '@id': 'https://graphiquestor.com/trade#dataset',
                    name: 'Global Bilateral HS-6 Trade Intelligence Dataset',
                    description: `Annual UN Comtrade (${TRADE_DATA_YEAR}) bilateral trade flows with opportunity scoring and supplier concentration.`,
                    url: 'https://graphiquestor.com/trade',
                    creator: { '@id': 'https://graphiquestor.com/#organization' },
                    temporalCoverage: '2020-01-01/2026-05-30',
                    spatialCoverage: 'Worldwide',
                }}
            />

            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 mb-8 mt-4">
                <TrailNavLink to="/" className="hover:text-white transition-colors">Home</TrailNavLink>
                <ChevronRight size={10} />
                <span className="text-emerald-400">Trade Intelligence</span>
            </nav>

            <div className="mb-8">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                        Trade Intelligence <span className="text-emerald-400">Terminal</span>
                    </h1>
                    <FreshnessChip status={dataFreshness.state} lastUpdated={latestLog?.start_time} />
                </div>
                <p className="text-sm text-white/40 font-medium max-w-3xl leading-relaxed">
                    UN Comtrade {TRADE_DATA_YEAR} bilateral telemetry — global demand ranking, supplier concentration, and country-level import/export pulse.
                </p>
            </div>

            <TrailNavLink
                to="/trade-fx"
                className="group mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-[#B8860B]/25 bg-[#B8860B]/[0.04] p-5 no-underline transition-colors hover:border-[#B8860B]/40 hover:bg-[#B8860B]/[0.07]"
            >
                <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#B8860B]/70">
                        Currency Intelligence
                    </span>
                    <h2 className="text-lg font-black text-white m-0">
                        TradeFx — Currency Intelligence
                    </h2>
                    <p className="text-xs text-white/45 leading-relaxed m-0 max-w-2xl">
                        Regime-aware hedging analysis for Indian exporters &amp; importers.
                    </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#B8860B] shrink-0">
                    Explore Currency Intelligence
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
            </TrailNavLink>

            <ModuleRow label="TRADE INTELLIGENCE TERMINAL" labelColor="text-emerald-400/60">
                <div className="space-y-6">
                    <TradeViewToggle />

                    <SectionErrorBoundary name="Trade View">
                        <Suspense fallback={<ViewFallback />}>
                            {view === 'exports' && <ExportMarketsView />}
                            {view === 'imports' && <ImportFlowsView />}
                            {view === 'bilateral' && <BilateralView />}
                        </Suspense>
                    </SectionErrorBoundary>
                </div>
            </ModuleRow>

            <RelatedMetrics path="/trade" />
            <RelatedContent />
        </div>
    )
}

export default TradeDashboard