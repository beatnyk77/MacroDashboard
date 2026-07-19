import React, { Suspense, lazy } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';

const TradeFlowsCard = lazy(() => import('@/features/dashboard/components/cards/TradeFlowsCard').then(m => ({ default: m.TradeFlowsCard })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Loading Telemetry...</span>
    </div>
);

export const BricsTradeSettlement: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.BRICS_GDP_PPP_TN);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
            <SEOManager
                title="BRICS Trade Settlement & Local Currency Monitor"
                description="Monitor BRICS trade settlement volumes, local currency trade adoption, and the shift in global trade gravity away from G7 networks."
                keywords={['BRICS trade settlement', 'petroyuan', 'local currency trade', 'CIPS adoption', 'non-USD clearing']}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Dataset',
                        'name': 'BRICS Trade Settlement Data',
                        'description': 'Tracking the volume of physical trade settling in local currencies among BRICS nations.',
                        'url': 'https://graphiquestor.com/labs/brics-trade-settlement'
                    }
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
                        Tracking the reality of the "BRICS Currency" through the architecture of local currency clearing and trade gravity.
                    </p>
                </div>

                <div className="space-y-24">
                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">Local Currency Settlement Volumes</h2>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6 max-w-3xl">
                            <SectionErrorBoundary name="Trade Flows">
                                <Suspense fallback={<LoadingFallback />}>
                                    <TradeFlowsCard />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            The rise of RMB clearing in Russia, Brazil, and Argentina, facilitated by the expansion of PBoC bilateral swap lines. The transition away from the SWIFT network is measurable in these direct bilateral trade volumes.
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
