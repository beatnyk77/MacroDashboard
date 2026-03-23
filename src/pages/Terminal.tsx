import React, { Suspense, lazy } from 'react';
import { Container } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Components
import { LiveStatusIndicator } from '@/components/LiveStatusIndicator';
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';

const CockpitKPIGrid = lazy(() => import('@/features/dashboard/components/CockpitKPIGrid').then(m => ({ default: m.CockpitKPIGrid })));
const CapitalFlowsTerminal = lazy(() => import('@/features/dashboard/components/rows/CapitalFlowsTerminal').then(m => ({ default: m.CapitalFlowsTerminal })));
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const GritIndexMonitor = lazy(() => import('@/features/dashboard/components/sections/GritIndexMonitor').then(m => ({ default: m.GritIndexMonitor })));
const PredictionMarketTerminal = lazy(() => import('@/features/dashboard/components/widgets/PredictionMarketTerminal').then(m => ({ default: m.PredictionMarketTerminal })));
const PredictionMarketHeatmap = lazy(() => import('@/features/dashboard/components/widgets/PredictionMarketHeatmap').then(m => ({ default: m.PredictionMarketHeatmap })));
const ArbitrageScanner = lazy(() => import('@/features/dashboard/components/widgets/ArbitrageScanner').then(m => ({ default: m.ArbitrageScanner })));
const SmartMoneyFlowMonitor = lazy(() => import('@/features/dashboard/components/sections/SmartMoneyFlowMonitor').then(m => ({ default: m.SmartMoneyFlowMonitor })));
const GeopoliticalEventsRow = lazy(() => import('@/features/dashboard/components/rows/GeopoliticalEventsRow').then(m => ({ default: m.GeopoliticalEventsRow })));
const China15thFYPTeaserRow = lazy(() => import('@/features/dashboard/components/rows/China15thFYP/China15thFYPTeaserRow').then(m => ({ default: m.China15thFYPTeaserRow })));
const GlobalLiquidityMonitor = lazy(() => import('@/features/dashboard/components/sections/GlobalLiquidityMonitor').then(m => ({ default: m.GlobalLiquidityMonitor })));
const WhiteCollarDebtMonitor = lazy(() => import('@/features/dashboard/components/sections/WhiteCollarDebtMonitor').then(m => ({ default: m.WhiteCollarDebtMonitor })));
const PredictionMarketsSection = lazy(() => import('@/features/dashboard/components/sections/PredictionMarketsSection').then(m => ({ default: m.PredictionMarketsSection })));


const LoadingFallback = () => (
    <div className="w-full h-full min-h-[150px] bg-slate-900/50 border border-white/5 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-[0.55rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Connecting...</span>
    </div>
);

export const Terminal: React.FC = () => {
    return (
        <Container maxWidth={false} disableGutters className="py-6 px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto bg-slate-950 min-h-screen">
            <SEOManager title="GraphiQuestor Terminal" description="Live Institutional Macro Telemetry" isApp={true} />

            <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">
                        Macro Observatory
                    </h1>
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                        High-Frequency Liquidity & Sovereign Stress Telemetry
                    </p>
                </div>
            </header>

            <main className="space-y-12">

                {/* Row 0: Global Liquidity Direction Monitor (Primary Context) */}
                <div className="w-full">
                    <SectionErrorBoundary name="Global Liquidity Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <GlobalLiquidityMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 0.5: White-Collar Debt Distress Monitor (Labor + Debt Signal) */}
                <div className="w-full">
                    <SectionErrorBoundary name="White-Collar Debt Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <WhiteCollarDebtMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 0.75: Smart Money Flow Monitor (Institutional Positioning) */}
                <div className="w-full">
                    <SectionErrorBoundary name="Smart Money Flow Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <SmartMoneyFlowMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 1: KPI Grid (Strategic Visibility) */}
                <div className="w-full">
                    <SectionErrorBoundary name="Strategic KPIs">
                        <Suspense fallback={<LoadingFallback />}>
                            <CockpitKPIGrid />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 1.5: China 15th FYP Strategic Signal */}
                <div className="w-full">
                    <SectionErrorBoundary name="China 15th FYP Teaser">
                        <Suspense fallback={<LoadingFallback />}>
                            <China15thFYPTeaserRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 2: US Liquidity Plumbline (Core Market Driver) */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">US Liquidity Plumbline</h2>
                            <p className="text-[0.65rem] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Monetary Base & Treasury General Account Telemetry</p>
                        </div>
                        <LiveStatusIndicator source="FRED / Treasury" />
                    </div>
                    <SectionErrorBoundary name="Net Liquidity">
                        <NetLiquidityRow />
                    </SectionErrorBoundary>
                </div>

                {/* Row 3: Global Capital Flows (Shadow System Visibility) */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Global Capital Flows</h2>
                            <p className="text-[0.65rem] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Cross-Border Banking & Institutional Sentiment Hubs</p>
                        </div>
                        <LiveStatusIndicator source="BIS / SWIFT" />
                    </div>
                    <SectionErrorBoundary name="Capital Flows">
                        <Suspense fallback={<LoadingFallback />}>
                            <CapitalFlowsTerminal hideHeader />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 4: US Debt Maturity Wall (Sovereign Stress Strip 1) */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">US Debt Maturity Wall</h2>
                            <p className="text-[0.6rem] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">Cumulative Interest Expense Refinancing Risk</p>
                        </div>
                        <LiveStatusIndicator source="Treasury" />
                    </div>
                    <SectionErrorBoundary name="Maturity Wall">
                        <Suspense fallback={<LoadingFallback />}>
                            <div className="scale-95 origin-top">
                                <USDebtMaturityWall />
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 5: Auction Demand Gauge (Sovereign Stress Strip 2) */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Auction Demand Gauge</h2>
                            <p className="text-[0.6rem] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">Primary Dealer Bid-to-Cover Ratios</p>
                        </div>
                        <LiveStatusIndicator source="Treasury" />
                    </div>
                    <SectionErrorBoundary name="Treasury Demand">
                        <Suspense fallback={<LoadingFallback />}>
                            <USTreasuryDemandGauge />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 6: GRIT Index (Proprietary Risk Signal) */}
                <div id="grit-monitor" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter text-amber-500">GRIT Index Monitor</h2>
                            <p className="text-[0.65rem] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Global Regime Indicator & Transition Signal</p>
                        </div>
                        <LiveStatusIndicator source="GraphiQuestor Core" />
                    </div>
                    <SectionErrorBoundary name="GRIT Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <GritIndexMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 7: Geopolitical Risk Matrix (Tanker tracking fix) */}
                <div id="geopolitical-matrix" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Geopolitical Risk Matrix</h2>
                            <p className="text-[0.65rem] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Hormuz Tanker Tracking & ADS-B Conflict Telemetry</p>
                        </div>
                        <LiveStatusIndicator source="GDELT / OpenSky" />
                    </div>
                    <SectionErrorBoundary name="Geopolitical Matrix">
                        <Suspense fallback={<LoadingFallback />}>
                            <GeopoliticalEventsRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 8: Prediction Market Probability Core */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Prediction Market Core</h2>
                            <p className="text-[0.65rem] text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Aggregated Odds from Polymarket, Kalshi, & PredictIt</p>
                        </div>
                        <LiveStatusIndicator source="DomeAPI" />
                    </div>
                    <SectionErrorBoundary name="Prediction Markets">
                        <Suspense fallback={<LoadingFallback />}>
                            <div className="space-y-12">
                                <PredictionMarketTerminal />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                                    <ArbitrageScanner />
                                    <PredictionMarketHeatmap />
                                </div>
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 9: Prediction Markets Discovery (Research Synthesis) */}
                <div className="w-full">
                    <SectionErrorBoundary name="Prediction Markets Discovery">
                        <Suspense fallback={<LoadingFallback />}>
                            <PredictionMarketsSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

            </main>
        </Container>
    );
};

export default Terminal;
