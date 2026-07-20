import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';

function MacroMetricTile({
    metricId,
    label,
    unit,
}: {
    metricId: string;
    label: string;
    unit?: string;
}) {
    const { data, isLoading } = useLatestMetric(metricId);
    const freshness = getStaleness(data?.lastUpdated, data?.frequency);

    if (isLoading) {
        return (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 min-h-[120px] animate-pulse" />
        );
    }

    if (!data) {
        return (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 min-h-[120px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{label}</p>
                <p className="mt-3 text-sm text-muted-foreground/70">Unavailable — no live observation for {metricId}.</p>
            </div>
        );
    }

    const value = Number.isFinite(data.value)
        ? data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : '—';

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 min-h-[120px]">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{label}</p>
                <FreshnessChip status={freshness.state} lastUpdated={data.lastUpdated} />
            </div>
            <p className="mt-3 text-2xl font-black tabular-nums text-white">
                {value}
                {unit ? <span className="ml-1 text-sm font-bold text-muted-foreground/60">{unit}</span> : null}
            </p>
            {data.source ? (
                <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground/40">Source · {data.source}</p>
            ) : null}
        </div>
    );
}

export const BricsTradeSettlement: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.BRICS_GDP_PPP_TN);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
            <SEOManager
                title="BRICS Trade Settlement & Local Currency Monitor"
                description="Monitor BRICS reserve composition, gold holdings, and local-currency settlement architecture away from G7 networks."
                keywords={['BRICS trade settlement', 'petroyuan', 'local currency trade', 'CIPS adoption', 'non-USD clearing']}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Dataset',
                        name: 'BRICS Trade Settlement Data',
                        description: 'Tracking BRICS reserve and gold metrics relevant to local-currency settlement.',
                        url: 'https://graphiquestor.com/labs/brics-trade-settlement',
                    },
                ]}
            />
            <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
                <div className="mb-8">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <a href="/" className="hover:text-white transition-colors">Home</a>
                        <ChevronRight size={10} />
                        <a href="/labs/de-dollarization-gold" className="hover:text-white transition-colors">De-Dollarization Lab</a>
                        <ChevronRight size={10} />
                        <span className="text-amber-500">BRICS Trade Settlement</span>
                    </nav>
                </div>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
                            BRICS Trade Settlement & <span className="text-amber-500">Local Currency</span>
                        </h1>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </div>
                    <p className="text-muted-foreground max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                        Structural telemetry on BRICS gold, USD reserve share, and settlement gravity — not commercial HS export scouting.
                    </p>
                </div>

                <div className="space-y-24">
                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">Settlement & Reserve Stack</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                            <MacroMetricTile metricId={MID.BRICS_GDP_PPP_TN} label="BRICS GDP (PPP)" unit="Tn" />
                            <MacroMetricTile metricId={MID.BRICS_GOLD_HOLDINGS_TONNES} label="BRICS Gold Holdings" unit="t" />
                            <MacroMetricTile metricId={MID.BRICS_GOLD_SHARE_PCT} label="Gold Share of Reserves" unit="%" />
                            <MacroMetricTile metricId={MID.BRICS_USD_RESERVE_SHARE_PCT} label="USD Reserve Share" unit="%" />
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            Local-currency clearing and CIPS adoption are observed through reserve composition and gold accumulation — not bilateral HS-code flows.
                            When a series is missing, the panel shows unavailable rather than fabricated trade stats.
                        </p>
                    </section>
                </div>

                <div className="mt-24 pt-12 border-t border-white/5 text-center">
                    <Button variant="ghost" className="text-muted-foreground/40 font-black uppercase tracking-widest hover:text-white" asChild>
                        <a href="/labs/de-dollarization-gold" className="flex items-center gap-2">
                            <ArrowLeft size={18} /> Back to Lab
                        </a>
                    </Button>
                </div>
                <RelatedContent />
                <RelatedMetrics />
            </div>
        </>
    );
};
