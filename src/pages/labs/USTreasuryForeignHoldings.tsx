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

const ReserveSellerTracker = lazy(() => import('@/features/dashboard/components/rows/ReserveSellerTracker').then(m => ({ default: m.ReserveSellerTracker })));
const GlobalReserveTracker = lazy(() => import('@/features/dashboard/components/sections/GlobalReserveTracker').then(m => ({ default: m.GlobalReserveTracker })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-border rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-[11px] font-semibold text-terminal-dim uppercase tracking-wider">Loading Telemetry...</span>
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
            <div className="page-shell">
                <LabPageHeader
                    trail={[{ label: 'Home', to: '/' }, { label: 'De-Dollarization Lab', to: '/labs/de-dollarization-gold/' }]}
                    current="US Treasury Holdings"
                    badge="Foreign Holdings Telemetry"
                    title={<>US Treasury Foreign Holdings & <span className="text-blue-400">Selloff Risk</span></>}
                    status={<FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />}
                    thesis="Tracking the transition of the US Treasury market from a globally absorbed asset to a domestically financed liability."
                />

                <div className="space-y-16">
                    <section>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">The Reserve-Seller Tracker: Who is Dumping USTs?</h2>
                        <div className="p-6 bg-white/[0.02] border border-border rounded-xl mb-6 max-w-4xl">
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
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">COFER Composition Shifts</h2>
                        <div className="p-6 bg-white/[0.02] border border-border rounded-xl mb-6">
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
