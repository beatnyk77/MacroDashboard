import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { LabPageHeader } from '@/components/LabPageHeader';
import { TrailLink } from '@/components/TrailLink';

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
            <div className="rounded-xl border border-border bg-white/[0.02] p-4 min-h-[120px] animate-pulse" />
        );
    }

    if (!data) {
        return (
            <div className="rounded-xl border border-border bg-white/[0.02] p-4 min-h-[120px]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">{label}</p>
                <p className="mt-3 text-sm text-muted-foreground">Unavailable — no live observation for {metricId}.</p>
            </div>
        );
    }

    const value = Number.isFinite(data.value)
        ? data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : '—';

    return (
        <div className="rounded-xl border border-border bg-white/[0.02] p-4 min-h-[120px]">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">{label}</p>
                <FreshnessChip status={freshness.state} lastUpdated={data.lastUpdated} />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-white">
                {value}
                {unit ? <span className="ml-1 text-sm font-bold text-muted-foreground">{unit}</span> : null}
            </p>
            {data.source ? (
                <p className="mt-2 text-[11px] uppercase tracking-wider text-terminal-dim">Source · {data.source}</p>
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
            <div className="page-shell">
                <LabPageHeader
                    trail={[{ label: 'Home', to: '/' }, { label: 'De-Dollarization Lab', to: '/labs/de-dollarization-gold/' }]}
                    current="BRICS Trade Settlement"
                    badge="BRICS Settlement Telemetry"
                    title={<>BRICS Trade Settlement & <span className="text-blue-400">Local Currency</span></>}
                    status={<FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />}
                    thesis="Structural telemetry on BRICS gold, USD reserve share, and settlement gravity — not commercial HS export scouting."
                />

                <div className="space-y-16">
                    <section>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">Settlement & Reserve Stack</h2>
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

                <div className="mt-24 pt-12 border-t border-border text-center">
                    <Button variant="ghost" className="text-terminal-dim font-semibold uppercase tracking-wider hover:text-white" asChild>
                        <TrailLink to="/labs/de-dollarization-gold/" className="flex items-center gap-2">
                            <ArrowLeft size={18} /> Back to Lab
                        </TrailLink>
                    </Button>
                </div>
                <RelatedContent />
                <RelatedMetrics />
            </div>
        </>
    );
};
