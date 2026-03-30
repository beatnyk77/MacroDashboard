import React, { Suspense, lazy } from 'react';
import {
    ChevronRight,
    ArrowLeft,
    TrendingUp,
    Coins,
    Zap,
    Globe,
    Lock
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { Button } from '@/components/ui/button';

// Lazy loaded components
const USDebtGoldBackingCard = lazy(() => import('@/features/dashboard/components/cards/USDebtGoldBackingCard').then(m => ({ default: m.USDebtGoldBackingCard })));
const GoldRatioRibbon = lazy(() => import('@/features/dashboard/components/sections/GoldRatioRibbon').then(m => ({ default: m.GoldRatioRibbon })));
const CentralBankGoldNet = lazy(() => import('@/features/dashboard/components/rows/CentralBankGoldNet').then(m => ({ default: m.CentralBankGoldNet })));
const GlobalFinancialHubsGoldGateways = lazy(() => import('@/features/dashboard/components/rows/GlobalFinancialHubsGoldGateways').then(m => ({ default: m.GlobalFinancialHubsGoldGateways })));
const GlobalReserveTracker = lazy(() => import('@/features/dashboard/components/sections/GlobalReserveTracker').then(m => ({ default: m.GlobalReserveTracker })));
const TradeFlowsCard = lazy(() => import('@/features/dashboard/components/cards/TradeFlowsCard').then(m => ({ default: m.TradeFlowsCard })));
const GoldPositioningMonitor = lazy(() => import('@/features/dashboard/components/sections/GoldPositioningMonitor').then(m => ({ default: m.GoldPositioningMonitor })));
const G20GoldDebtCoveragePanel = lazy(() => import('@/features/dashboard/components/sections/G20GoldDebtCoveragePanel').then(m => ({ default: m.G20GoldDebtCoveragePanel })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Gold Signal...</span>
    </div>
);

export const DeDollarizationGoldLab: React.FC = () => {
    return (
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
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    De-Dollarization & <span className="text-amber-500">Gold</span>
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    Monitoring the systemic shift from fiat-centric reserves to hard-asset anchors and the fragmentation of global settlement networks.
                </p>
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
                            <Suspense fallback={<LoadingFallback />}>
                                <USDebtGoldBackingCard />
                            </Suspense>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="Gold Ratio Ribbon">
                            <Suspense fallback={<LoadingFallback />}>
                                <GoldRatioRibbon />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="mt-16">
                        <SectionErrorBoundary name="G20 Gold Debt Coverage">
                            <Suspense fallback={<LoadingFallback />}>
                                <G20GoldDebtCoveragePanel />
                            </Suspense>
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
                        <Suspense fallback={<LoadingFallback />}>
                            <GlobalReserveTracker />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 3. Central Bank Gold Net Purchases */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Central Bank Gold Net Purchases</h2>
                    </div>
                    <SectionErrorBoundary name="Gold Net Purchases">
                        <Suspense fallback={<LoadingFallback />}>
                            <CentralBankGoldNet />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 4. Global Financial Hubs & Gold Gateways */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Lock className="text-blue-400" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Global Financial Hubs & Gold Gateways</h2>
                    </div>
                    <SectionErrorBoundary name="Financial Hubs">
                        <Suspense fallback={<LoadingFallback />}>
                            <GlobalFinancialHubsGoldGateways />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 5. Trade Flows & Misinvoicing */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-rose-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Trade Settlement & Misinvoicing</h2>
                    </div>
                    <SectionErrorBoundary name="Trade Flows">
                        <Suspense fallback={<LoadingFallback />}>
                            <TradeFlowsCard />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-trade-flows" insight="Analyzing de-dollarization through the lens of trade settlement and illicit flow metrics reveals the true speed of the structural decoupling between G7 and BRICS+ networks." />
                </section>

                {/* 6. Gold Positioning & Manipulation Monitor */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-heading text-white">Futures & Manipulation Monitor</h2>
                    </div>
                    <SectionErrorBoundary name="Gold Positioning">
                        <Suspense fallback={<LoadingFallback />}>
                            <GoldPositioningMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-gold-positioning" insight="The divergence between paper gold positioning (futures/options) and physical demand is a primary indicator of institutional hedging velocity and sovereign 'price discovery' outside Western exchanges." />
                </section>
            </div>

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
        </div>
    );
};

export default DeDollarizationGoldLab;
