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
const GeopoliticalEventsRow = lazy(() => import('@/features/dashboard/components/rows/GeopoliticalEventsRow').then(m => ({ default: m.GeopoliticalEventsRow })));


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

            <main className="grid grid-cols-1 xl:grid-cols-12 gap-6 auto-rows-min">
                
                {/* Top Row: KPI Grid (Full Width) */}
                <div className="xl:col-span-12">
                    <SectionErrorBoundary name="KPI Grid">
                        <Suspense fallback={<LoadingFallback />}>
                            <CockpitKPIGrid />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Middle Row: Net Liquidity & Capital Flows */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">US Liquidity Plumbline</h2>
                            <LiveStatusIndicator source="FRED / Treasury" />
                        </div>
                        <SectionErrorBoundary name="Net Liquidity">
                            <NetLiquidityRow />
                        </SectionErrorBoundary>
                    </div>

                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Global Capital Flows</h2>
                            <LiveStatusIndicator source="BIS / SWIFT" />
                        </div>
                        <SectionErrorBoundary name="Capital Flows">
                            <Suspense fallback={<LoadingFallback />}>
                                <CapitalFlowsTerminal hideHeader />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>

                {/* Right Column: Maturity Wall & Treasury Demand */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex-1">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">US Maturity Wall</h2>
                            <LiveStatusIndicator source="Treasury" />
                        </div>
                        <SectionErrorBoundary name="Maturity Wall">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="scale-90 origin-top">
                                    <USDebtMaturityWall />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl h-fit">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Auction Demand</h2>
                            <LiveStatusIndicator source="Treasury" />
                        </div>
                        <SectionErrorBoundary name="Treasury Demand">
                            <Suspense fallback={<LoadingFallback />}>
                                <USTreasuryDemandGauge />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>

                {/* Bottom Row: GRIT & Geopolitical */}
                <div className="xl:col-span-12 space-y-6">
                    <div id="grit-monitor" className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                        <SectionErrorBoundary name="GRIT Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <GritIndexMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div id="geopolitical-matrix" className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Geopolitical Risk Matrix</h2>
                            <LiveStatusIndicator source="GDELT / Global News Array" />
                        </div>
                        <SectionErrorBoundary name="Geopolitical Matrix">
                            <Suspense fallback={<LoadingFallback />}>
                                <GeopoliticalEventsRow />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>

                {/* Prediction Row: Data Density Expansion */}
                <div className="xl:col-span-12 space-y-6">
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Prediction Market Probability Core</h2>
                            <LiveStatusIndicator source="Polymarket / Kalshi / PredictIt" />
                        </div>
                        <SectionErrorBoundary name="Prediction Markets">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="space-y-6">
                                    <PredictionMarketTerminal />
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <ArbitrageScanner />
                                        <PredictionMarketHeatmap />
                                    </div>
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>

            </main>
        </Container>
    );
};

export default Terminal;
