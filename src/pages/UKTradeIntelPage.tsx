import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Building2, TrendingUp } from 'lucide-react'
import { SEOManager } from '@/components/SEOManager'
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { RelatedMetrics } from '@/components/RelatedMetrics'
import { ShareButton } from '@/components/ShareButton'
import { TradeBreadcrumbs } from '@/features/trade/components/TradeBreadcrumbs'
import { HSCodeSearch } from '@/features/trade/components/HSCodeSearch'
import { UKTradeFlowChart } from '@/features/trade/components/uk/UKTradeFlowChart'
import { UKTraderTable } from '@/features/trade/components/uk/UKTraderTable'
import { useUKTradeFlows } from '@/features/trade/hooks/useUKTradeFlows'
import { useUKTraderIntel } from '@/features/trade/hooks/useUKTraderIntel'
import { useHSCodeSearch } from '@/features/trade/hooks/useHSCodeSearch'
import { useRecentHSCodes } from '@/features/trade/hooks/useRecentHSCodes'
import type { HSCodeMaster } from '@/features/trade/types/trade'

const UKTradeIntelPage: React.FC = () => {
    const { code } = useParams<{ code: string }>()
    const navigate = useNavigate()
    const { push } = useRecentHSCodes()
    const flowRef = React.useRef<HTMLDivElement>(null)

    const { data: flows = [], isLoading: flowsLoading, error: flowsError } = useUKTradeFlows(code || '')
    const { data: traders = [], isLoading: tradersLoading, error: tradersError, refetch: refetchTraders } = useUKTraderIntel(code || null)
    const { results } = useHSCodeSearch(code || '')
    const hsDescription = results.find(r => r.code === code)?.description

    const handleSelect = (item: HSCodeMaster) => {
        push(item.code, item.description)
        navigate(`/trade/uk/${item.code}`)
    }

    const lastUpdated = flows[0]?.last_updated ?? traders[0]?.last_updated

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-24 px-4 sm:px-6">
            <SEOManager
                title={`UK Trade Intelligence — HS ${code} | HMRC OTS Entity Directory`}
                description={`HMRC Overseas Trade Statistics for HS ${code}. Monthly UK import/export flows and entity-level trader directory with freshness telemetry.`}
                keywords={[`UK trade HS ${code}`, 'HMRC OTS', 'UK trader directory', 'GraphiQuestor']}
            />

            <TradeBreadcrumbs
                crumbs={[
                    { label: 'Trade Intelligence', to: '/trade' },
                    { label: 'UK Trade Intel' },
                    { label: `HS ${code}` },
                ]}
            />

            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-indigo-400" />
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                            UK Trade Intelligence
                        </h1>
                    </div>
                    <p className="text-sm text-white/40 font-mono">
                        HS {code}{hsDescription ? ` — ${hsDescription}` : ''}
                    </p>
                </div>
                <DataProvenanceBadge
                    source="HMRC OTS"
                    methodology="Overseas Trade Statistics · entity-level directory"
                    lastVerified={lastUpdated}
                    size="sm"
                />
            </div>

            <div className="max-w-xl">
                <HSCodeSearch
                    onSelect={handleSelect}
                    placeholder="Switch HS code…"
                />
            </div>

            <SectionErrorBoundary name="UK OTS Flows">
                <div ref={flowRef} className="relative group p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                    <ShareButton
                        targetRef={flowRef}
                        title={`UK OTS Flows — HS ${code}`}
                        dataSource="HMRC OTS"
                        href={`/trade/uk/${code}`}
                    />
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Monthly OTS Flows</h2>
                    </div>
                    {flowsLoading ? (
                        <div className="h-48 animate-pulse bg-white/5 rounded-2xl" />
                    ) : flowsError ? (
                        <p className="text-sm text-rose-400">Failed to load OTS flow data.</p>
                    ) : (
                        <UKTradeFlowChart flows={flows} />
                    )}
                </div>
            </SectionErrorBoundary>

            <SectionErrorBoundary name="UK Trader Directory">
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-indigo-500/10">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">
                        Entity Directory
                    </h2>
                    <UKTraderTable
                        traders={traders}
                        hsCode={code || ''}
                        loading={tradersLoading}
                        error={!!tradersError}
                        onRetry={() => refetchTraders()}
                    />
                </div>
            </SectionErrorBoundary>

            <RelatedMetrics path={`/trade/uk/${code}`} />
        </div>
    )
}

export default UKTradeIntelPage