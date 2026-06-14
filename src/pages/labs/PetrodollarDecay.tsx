import React, { Suspense, lazy } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';

const PetrodollarVsPetroyuan = lazy(() => import('@/features/dashboard/components/sections/PetrodollarVsPetroyuan').then(m => ({ default: m.PetrodollarVsPetroyuan })));
const GoldOilRevaluationScenario = lazy(() => import('@/features/dashboard/components/sections/GoldOilRevaluationScenario').then(m => ({ default: m.GoldOilRevaluationScenario })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Loading Telemetry...</span>
    </div>
);

export const PetrodollarDecay: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.OIL_BRENT_PRICE_USD);
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
            <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
                <div className="mb-8">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <a href="/" className="hover:text-white transition-colors">Home</a>
                        <ChevronRight size={10} />
                        <a href="/labs/de-dollarization-gold" className="hover:text-white transition-colors">De-Dollarization Lab</a>
                        <ChevronRight size={10} />
                        <span className="text-amber-500">Petrodollar Decay</span>
                    </nav>
                </div>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
                            Petrodollar System <span className="text-amber-500">Decay Indicators</span>
                        </h1>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </div>
                    <p className="text-muted-foreground max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                        Monitoring the expiration of historical US-Saudi agreements and the emergence of a multipolar energy pricing regime.
                    </p>
                </div>

                <div className="space-y-24">
                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">Petrodollar vs. Petroyuan Settlement Tracking</h2>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
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
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">The Gold/Oil Revaluation Scenario</h2>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
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

                <div className="mt-24 pt-12 border-t border-white/5 text-center">
                    <Button variant="ghost" className="text-muted-foreground/40 font-black uppercase tracking-widest hover:text-white" asChild>
                        <a href="/labs/de-dollarization-gold" className="flex items-center gap-2">
                            <ArrowLeft size={18} /> Back to Lab
                        </a>
                    </Button>
                </div>
                <RelatedContent />
            </div>
        </>
    );
};
