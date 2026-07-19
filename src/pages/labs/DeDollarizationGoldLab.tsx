import React, { Suspense, lazy } from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
    ChevronRight,
    ArrowLeft,
    TrendingUp,
    Coins,
    Zap,
    Globe,
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { LazyRender } from '@/components/LazyRender';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';

// Lazy loaded components
const USDebtGoldBackingCard = lazy(() => import('@/features/dashboard/components/cards/USDebtGoldBackingCard').then(m => ({ default: m.USDebtGoldBackingCard })));
const GoldRatioRibbon = lazy(() => import('@/features/dashboard/components/sections/GoldRatioRibbon').then(m => ({ default: m.GoldRatioRibbon })));
const CentralBankGoldNet = lazy(() => import('@/features/dashboard/components/rows/CentralBankGoldNet').then(m => ({ default: m.CentralBankGoldNet })));
const GlobalReserveTracker = lazy(() => import('@/features/dashboard/components/sections/GlobalReserveTracker').then(m => ({ default: m.GlobalReserveTracker })));
const TradeFlowsCard = lazy(() => import('@/features/dashboard/components/cards/TradeFlowsCard').then(m => ({ default: m.TradeFlowsCard })));
const GoldPositioningMonitor = lazy(() => import('@/features/dashboard/components/sections/GoldPositioningMonitor').then(m => ({ default: m.GoldPositioningMonitor })));
const G20GoldDebtCoveragePanel = lazy(() => import('@/features/dashboard/components/sections/G20GoldDebtCoveragePanel').then(m => ({ default: m.G20GoldDebtCoveragePanel })));
const PetrodollarVsPetroyuan = lazy(() => import('@/features/dashboard/components/sections/PetrodollarVsPetroyuan').then(m => ({ default: m.PetrodollarVsPetroyuan })));
const ReserveSellerTracker = lazy(() => import('@/features/dashboard/components/rows/ReserveSellerTracker').then(m => ({ default: m.ReserveSellerTracker })));
const GoldOilRevaluationScenario = lazy(() => import('@/features/dashboard/components/sections/GoldOilRevaluationScenario').then(m => ({ default: m.GoldOilRevaluationScenario })));


const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Gold Signal...</span>
    </div>
);

export const DeDollarizationGoldLab: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.GOLD_PRICE_USD);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
        <SEOManager
            title="De-Dollarization & Gold Lab — Reserve Shifts, Gold Flows & Trade Settlement"
            description="Track the structural shift from fiat reserves to hard-asset anchors. Central bank gold purchases, COFER reserve composition, petrodollar vs petroyuan settlement, and G20 gold-debt coverage analysis."
            keywords={['de-dollarization', 'gold reserves', 'central bank gold purchases', 'BRICS', 'petrodollar', 'petroyuan', 'reserve currency', 'COFER']}
            jsonLd={[
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    'name': 'De-Dollarization & Gold Lab',
                    'url': 'https://graphiquestor.com/labs/de-dollarization-gold',
                    'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
                    'breadcrumb': {
                        '@type': 'BreadcrumbList',
                        'itemListElement': [
                            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                            { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                            { '@type': 'ListItem', 'position': 3, 'name': 'De-Dollarization & Gold Lab' }
                        ]
                    }
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'Dataset',
                    'name': 'De-Dollarization & Gold Data',
                    'description': 'Data on central bank gold purchases, COFER reserve composition, and petrodollar vs petroyuan settlement.',
                    'url': 'https://graphiquestor.com/labs/de-dollarization-gold',
                    'isAccessibleForFree': true,
                    'creator': {
                        '@type': 'Organization',
                        'name': 'GraphiQuestor'
                    }
                }
            ]}
        />
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <ChevronRight size={10} />
                    <a href="/macro-observatory" className="hover:text-white transition-colors">Observatory</a>
                    <ChevronRight size={10} />
                    <span className="text-amber-500">De-Dollarization & Gold</span>
                </nav>
            </div>

            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <Coins size={12} /> Hard Money Telemetry
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white">
                        De-Dollarization & <span className="text-amber-500">Gold</span>
                    </h1>
                    <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                </div>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide mb-8">
                    Monitoring the systemic shift from fiat-centric reserves to hard-asset anchors and the fragmentation of global settlement networks.
                </p>

                {/* Pillar Page Banner */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-amber-500 font-black uppercase tracking-widest text-lg mb-2">The Ultimate Guide to De-Dollarization</h3>
                        <p className="text-white/70 text-sm font-medium">Read our comprehensive institutional analysis of global reserve shifts, BRICS currency dynamics, and actionable macro scenarios for 2026.</p>
                    </div>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest shrink-0" asChild>
                        <a href="/methods/de-dollarization-guide">Read the Guide</a>
                    </Button>
                </div>
            </div>

            <div className="space-y-32">
                {/* 1. Gold Anchor Ratios */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Gold Anchor Ratios</h2>
                    </div>
                    <div className="space-y-16">
                        <SectionErrorBoundary name="US Debt Gold Backing">
                            <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                                <Suspense fallback={<LoadingFallback />}>
                                    <USDebtGoldBackingCard />
                                </Suspense>
                            </LazyRender>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="Gold Ratio Ribbon">
                            <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldRatioRibbon />
                                </Suspense>
                            </LazyRender>
                        </SectionErrorBoundary>
                        <div id="gold-oil-revaluation" />
                        <SectionErrorBoundary name="Gold Oil Revaluation Scenario">
                            <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldOilRevaluationScenario />
                                </Suspense>
                            </LazyRender>
                        </SectionErrorBoundary>
                    </div>

                    <div className="mt-16">
                        <SectionErrorBoundary name="G20 Gold Debt Coverage">
                            <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                                <Suspense fallback={<LoadingFallback />}>
                                    <G20GoldDebtCoveragePanel />
                                </Suspense>
                            </LazyRender>
                        </SectionErrorBoundary>
                    </div>

                    <ChartInsightSummary id="lab-gold-ratios" insight="The M2/Gold ratio tracks the relative debasement of the monetary supply against the hard asset anchor. Structurally rising ratios indicate a regime change in sovereign preference for physical liquidity." />
                </section>

                {/* 2. Global Reserve Composition */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Globe className="text-blue-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Global Reserve Composition</h2>
                    </div>
                    <SectionErrorBoundary name="Global Reserve Tracker">
                        <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                            <Suspense fallback={<LoadingFallback />}>
                                <GlobalReserveTracker />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>

                    <div className="mt-8">
                        <SectionErrorBoundary name="Reserve-Seller Tracker">
                            <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                                <Suspense fallback={<LoadingFallback />}>
                                    <ReserveSellerTracker />
                                </Suspense>
                            </LazyRender>
                        </SectionErrorBoundary>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button variant="outline" className="text-amber-500 border-amber-500/20 hover:bg-amber-500/10 uppercase tracking-widest text-xs font-black" asChild>
                            <a href="/labs/us-treasury-foreign-holdings">Deep Dive: US Treasury Selloff Risk <ChevronRight size={14} className="ml-2" /></a>
                        </Button>
                    </div>
                </section>

                {/* 3. Central Bank Gold Net Purchases */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Central Bank Gold Net Purchases</h2>
                    </div>
                    <SectionErrorBoundary name="Gold Net Purchases">
                        <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                            <Suspense fallback={<LoadingFallback />}>
                                <CentralBankGoldNet />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    
                    <div className="mt-6 flex justify-end">
                        <Button variant="outline" className="text-amber-500 border-amber-500/20 hover:bg-amber-500/10 uppercase tracking-widest text-xs font-black" asChild>
                            <a href="/labs/central-bank-gold-purchases">Deep Dive: Gold Purchases Tracker <ChevronRight size={14} className="ml-2" /></a>
                        </Button>
                    </div>
                </section>

                {/* 4. Trade Flows & Settlement */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-rose-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Trade Settlement & Misinvoicing</h2>
                    </div>
                    <div className="space-y-16">
                        <div className="space-y-6">
                            <SectionErrorBoundary name="Petrodollar vs Petroyuan">
                                <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                                    <Suspense fallback={<LoadingFallback />}>
                                        <PetrodollarVsPetroyuan />
                                    </Suspense>
                                </LazyRender>
                            </SectionErrorBoundary>
                            <div className="flex justify-end">
                                <Button variant="outline" className="text-amber-500 border-amber-500/20 hover:bg-amber-500/10 uppercase tracking-widest text-xs font-black" asChild>
                                    <a href="/labs/petrodollar-decay-indicators">Deep Dive: Petrodollar Decay <ChevronRight size={14} className="ml-2" /></a>
                                </Button>
                            </div>
                        </div>
                        <SectionErrorBoundary name="Trade Flows">
                            <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                                <Suspense fallback={<LoadingFallback />}>
                                    <TradeFlowsCard />
                                </Suspense>
                            </LazyRender>
                        </SectionErrorBoundary>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button variant="outline" className="text-amber-500 border-amber-500/20 hover:bg-amber-500/10 uppercase tracking-widest text-xs font-black" asChild>
                            <a href="/labs/brics-trade-settlement">Deep Dive: BRICS Trade Settlement <ChevronRight size={14} className="ml-2" /></a>
                        </Button>
                    </div>
                    <ChartInsightSummary id="lab-trade-flows" insight="Analyzing de-dollarization through the lens of trade settlement and illicit flow metrics reveals the true speed of the structural decoupling between G7 and BRICS+ networks." />
                </section>

                {/* 5. Gold Positioning & Manipulation Monitor */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Gold Derivatives & Physical Arbitrage Monitor</h2>
                    </div>
                    <SectionErrorBoundary name="Gold Positioning">
                        <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                            <Suspense fallback={<LoadingFallback />}>
                                <GoldPositioningMonitor />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-gold-positioning" insight="The divergence between paper gold positioning (futures/options) and physical demand is a primary indicator of institutional hedging velocity and sovereign 'price discovery' outside Western exchanges." />
                </section>
            </div>

            {/* SEO Structural Analysis Text Block */}
            <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Structural Analysis of De-Dollarization and Gold Accumulation">
                <h3 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Structural Analysis: The Shift to Hard Assets and Multipolar Settlement</h3>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>De-Dollarization & Gold Lab</strong> tracks the systemic migration of global reserve capital from fiat-centric ledgers to hard-asset anchors. Over the past decade, and accelerating post-2022, central banks outside the G7 have engaged in historic gold accumulation. This represents a fundamental shift in sovereign reserve management, prioritizing counterparty-risk-free assets over traditional US Treasuries.
                    </p>
                    <p>
                        Our predictive telemetry isolates the exact velocity of this transition by measuring the <em>M2 to Gold Ratio</em>, central bank net purchases, and the evolving composition of the IMF's Currency Composition of Official Foreign Exchange Reserves (COFER). When combined with our <strong>Petrodollar vs Petroyuan</strong> analysis, institutional observers can map the structural decoupling of global energy trade from the US Dollar hegemony.
                    </p>
                    <p>
                        Understanding the divergence between paper gold derivatives and physical gold arbitrage is critical for macro positioning. As the <a href="/glossary/de-dollarization" className="text-blue-400 hover:underline">De-dollarization</a> macro regime accelerates, the gravitational center of global trade is demonstrably shifting towards the BRICS+ block, fundamentally re-pricing geopolitical risk and necessitating a new framework for cross-border settlement.
                    </p>
                </div>
            </article>

            <div className="mt-24 pt-12 border-t border-white/5 text-center">
                <Button
                    variant="ghost"
                    className="text-muted-foreground/40 font-black uppercase tracking-uppercase hover:text-white transition-colors"
                    asChild
                >
                    <a href="/macro-observatory" className="flex items-center gap-2">
                        <ArrowLeft size={18} /> Back to Observatory
                    </a>
                </Button>
            </div>
            <RelatedContent />
            <RelatedMetrics />
        </div>
        </>
    );
};

export default DeDollarizationGoldLab;
