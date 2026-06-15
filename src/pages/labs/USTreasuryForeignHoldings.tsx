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

const ReserveSellerTracker = lazy(() => import('@/features/dashboard/components/rows/ReserveSellerTracker').then(m => ({ default: m.ReserveSellerTracker })));
const GlobalReserveTracker = lazy(() => import('@/features/dashboard/components/sections/GlobalReserveTracker').then(m => ({ default: m.GlobalReserveTracker })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Loading Telemetry...</span>
    </div>
);

export const USTreasuryForeignHoldings: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.FED_TREASURY_HOLDINGS);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
            <SEOManager
                title="US Treasury Foreign Holdings Deep Dive & Selloff Risk"
                description="Analyze the transition of the US Treasury market, foreign central bank selloffs, and the implications of fiscal dominance on global liquidity."
                keywords={['US treasury foreign holdings', 'foreign central bank treasuries', 'US debt selloff', 'fiscal dominance', 'reserve seller tracker']}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Dataset',
                        'name': 'US Treasury Foreign Holdings Data',
                        'description': 'Tracking the net buying and selling of US Treasuries by foreign central banks.',
                        'url': 'https://graphiquestor.com/labs/us-treasury-foreign-holdings'
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
                        <span className="text-amber-500">US Treasury Holdings</span>
                    </nav>
                </div>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
                            US Treasury Foreign Holdings & <span className="text-amber-500">Selloff Risk</span>
                        </h1>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </div>
                    <p className="text-muted-foreground max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                        Tracking the transition of the US Treasury market from a globally absorbed asset to a domestically financed liability.
                    </p>
                </div>

                <div className="space-y-24">
                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">The Reserve-Seller Tracker: Who is Dumping USTs?</h2>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6 max-w-4xl">
                            <SectionErrorBoundary name="Reserve Sellers">
                                <Suspense fallback={<LoadingFallback />}>
                                    <ReserveSellerTracker />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            Specific data on PBoC and Bank of Japan (BoJ) Treasury liquidation. We distinguish between active strategic selling (China reducing USD exposure) and tactical FX defense selling (Japan defending the Yen).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">COFER Composition Shifts</h2>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
                            <SectionErrorBoundary name="Global Reserves">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GlobalReserveTracker />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            Connecting the Treasury selloff directly to the IMF's COFER data. As foreign central banks balk at the US fiscal trajectory, capital rotates into non-traditional reserve currencies and physical gold.
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
