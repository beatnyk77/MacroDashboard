import React, { Suspense, lazy } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { LabPageHeader } from '@/components/LabPageHeader';
import { TrailLink } from '@/components/TrailLink';

const PetrodollarVsPetroyuan = lazy(() => import('@/features/dashboard/components/sections/PetrodollarVsPetroyuan').then(m => ({ default: m.PetrodollarVsPetroyuan })));
const GoldOilRevaluationScenario = lazy(() => import('@/features/dashboard/components/sections/GoldOilRevaluationScenario').then(m => ({ default: m.GoldOilRevaluationScenario })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-border rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-[11px] font-semibold text-terminal-dim uppercase tracking-wider">Loading Telemetry...</span>
    </div>
);

export const PetrodollarDecay: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.BRENT_CRUDE_PRICE);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
            <SEOManager
                title="Petrodollar System Decay Indicators & Petroyuan Adoption"
                description="Track the structural decay of the Petrodollar system, the rise of Petroyuan settlement, and the Gold/Oil revaluation scenario."
                keywords={['petrodollar decay', 'petroyuan adoption', 'oil trade settlement', 'gold oil ratio', 'energy settlement']}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Dataset',
                        'name': 'Petrodollar vs Petroyuan Settlement Data',
                        'description': 'Tracking the volume of crude oil settling in USD vs RMB.',
                        'url': 'https://graphiquestor.com/labs/petrodollar-decay-indicators'
                    }
                ]}
            />
            <div className="page-shell">
                <LabPageHeader
                    trail={[{ label: 'Home', to: '/' }, { label: 'De-Dollarization Lab', to: '/labs/de-dollarization-gold/' }]}
                    current="Petrodollar Decay"
                    badge="Petrodollar Settlement Telemetry"
                    title={<>Petrodollar System <span className="text-blue-400">Decay Indicators</span></>}
                    status={<FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />}
                    thesis="Monitoring the expiration of historical US-Saudi agreements and the emergence of a multipolar energy pricing regime."
                />

                <div className="space-y-16">
                    <section>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">Petrodollar vs. Petroyuan Settlement Tracking</h2>
                        <div className="p-6 bg-white/[0.02] border border-border rounded-xl mb-6">
                            <SectionErrorBoundary name="Petrodollar Tracker">
                                <Suspense fallback={<LoadingFallback />}>
                                    <PetrodollarVsPetroyuan />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            Analyzing crude oil volumes settling in RMB on the Shanghai International Energy Exchange (INE). The Saudi pivot eastward fundamentally alters the structural bid for offshore Eurodollars.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">The Gold/Oil Revaluation Scenario</h2>
                        <div className="p-6 bg-white/[0.02] border border-border rounded-xl mb-6">
                            <SectionErrorBoundary name="Gold Oil Ratio">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldOilRevaluationScenario />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            GraphiQuestor's proprietary framework tracks how BRICS+ nations are implicitly pricing energy in ounces of gold to bypass fiat FX volatility, creating profound arbitrage opportunities in physical markets.
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
