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

const CentralBankGoldNet = lazy(() => import('@/features/dashboard/components/rows/CentralBankGoldNet').then(m => ({ default: m.CentralBankGoldNet })));
const USDebtGoldBackingCard = lazy(() => import('@/features/dashboard/components/cards/USDebtGoldBackingCard').then(m => ({ default: m.USDebtGoldBackingCard })));
const GlobalFinancialHubsGoldGateways = lazy(() => import('@/features/dashboard/components/rows/GlobalFinancialHubsGoldGateways').then(m => ({ default: m.GlobalFinancialHubsGoldGateways })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Loading Telemetry...</span>
    </div>
);

export const CentralBankGoldPurchases: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.BRICS_GOLD_HOLDINGS_TONNES);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
            <SEOManager
                title="Global Central Bank Gold Purchases Tracker (Real-Time Data)"
                description="Track real-time global central bank gold purchases, PBoC accumulation, and RBI reserves. Essential data for macro tracking of de-dollarization."
                keywords={['central bank gold purchases', 'PBOC gold', 'RBI gold reserves', 'gold accumulation', 'sovereign gold']}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Dataset',
                        'name': 'Global Central Bank Gold Purchases Data',
                        'description': 'Real-time monitoring of sovereign gold purchases globally.',
                        'url': 'https://graphiquestor.com/labs/central-bank-gold-purchases'
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
                        <span className="text-amber-500">Gold Purchases Tracker</span>
                    </nav>
                </div>

                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
                            Global Central Bank <span className="text-amber-500">Gold Purchases</span>
                        </h1>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </div>
                    <p className="text-muted-foreground max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                        Real-time tracking of sovereign gold accumulation and the strategic pivot from Western ETFs to Eastern Central Banks.
                    </p>
                </div>

                <div className="space-y-24">
                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">Net Purchases by Sovereign Entities</h2>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
                            <SectionErrorBoundary name="Gold Net Purchases">
                                <Suspense fallback={<LoadingFallback />}>
                                    <CentralBankGoldNet />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            Since 2022, central bank net gold purchases have shattered historical records. This is a structural reconstitution of Tier 1 capital, heavily concentrated in the Global South (PBoC, RBI, and GCC entities) seeking sanction-proof reserve assets.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">The Debt/Gold Z-Score Framework</h2>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6 max-w-3xl">
                            <SectionErrorBoundary name="Debt/Gold Backing">
                                <Suspense fallback={<LoadingFallback />}>
                                    <USDebtGoldBackingCard />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            GraphiQuestor's proprietary Debt/Gold Z-Score metric contextualizes this accumulation. The rapid expansion of fiat M2 and sovereign debt necessitates corresponding physical gold accumulation for nations seeking to maintain the purchasing power of their reserves against Western debasement.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">Financial Hubs & Gold Arbitrage</h2>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
                            <SectionErrorBoundary name="Financial Hubs">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GlobalFinancialHubsGoldGateways />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            Observing the flow of physical gold from Western vaults (LBMA/COMEX) to Eastern hubs (Shanghai, Dubai). The arbitrage between paper derivatives and physical delivery is a primary indicator of sovereign stress.
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
