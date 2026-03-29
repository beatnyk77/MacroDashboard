import React, { Suspense, lazy } from 'react';
import { Container } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Components
import { LiveStatusIndicator } from '@/components/LiveStatusIndicator';
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { CorporateDebtMaturityWall } from '@/components/CorporateDebtMaturityWall';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import InstitutionalHoldingsWall from '@/components/InstitutionalHoldingsWall';


const TodaysBriefPanel = lazy(() => import('@/features/dashboard/components/sections/TodaysBriefPanel').then(m => ({ default: m.TodaysBriefPanel })));
const WeeklyNarrativeSection = lazy(() => import('@/features/dashboard/components/sections/WeeklyNarrativeSection').then(m => ({ default: m.WeeklyNarrativeSection })));

// 1. LIQUIDITY & FLOWS
const GlobalLiquidityMonitor = lazy(() => import('@/features/dashboard/components/sections/GlobalLiquidityMonitor').then(m => ({ default: m.GlobalLiquidityMonitor })));
const SmartMoneyFlowMonitor = lazy(() => import('@/features/dashboard/components/sections/SmartMoneyFlowMonitor').then(m => ({ default: m.SmartMoneyFlowMonitor })));
const CapitalFlowsTerminal = lazy(() => import('@/features/dashboard/components/rows/CapitalFlowsTerminal').then(m => ({ default: m.CapitalFlowsTerminal })));

// 2. SOVEREIGN STRESS
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const YieldCurveMonitor = lazy(() => import('@/features/dashboard/components/rows/YieldCurveMonitor').then(m => ({ default: m.YieldCurveMonitor })));
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const TreasurySnapshotSection = lazy(() => import('@/features/dashboard/components/sections/TreasurySnapshotSection').then(m => ({ default: m.TreasurySnapshotSection })));

// 3. REGIONAL & MACRO
const ChinaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const IndiaCreditCycleClock = lazy(() => import('@/features/dashboard/components/rows/IndiaCreditCycleClock').then(m => ({ default: m.IndiaCreditCycleClock })));
const CorporateTreasuryHedgingSection = lazy(() => import('@/features/dashboard/components/sections/CorporateTreasuryHedgingSection').then(m => ({ default: m.CorporateTreasuryHedgingSection })));
const GeopoliticalEventsRow = lazy(() => import('@/features/dashboard/components/rows/GeopoliticalEventsRow').then(m => ({ default: m.GeopoliticalEventsRow })));
const DeflationDebasementMonitor = lazy(() => import('@/features/dashboard/components/rows/DeflationDebasementMonitor').then(m => ({ default: m.DeflationDebasementMonitor })));
const CurrencyWarsMonitor = lazy(() => import('@/features/dashboard/components/rows/CurrencyWarsMonitor').then(m => ({ default: m.CurrencyWarsMonitor })));


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

            <main className="space-y-16 pb-32">
                {/* 0. FLAGSHIP: 13-F SMART MONEY TRACKER */}
                <div className="w-full">
                    <SectionErrorBoundary name="13-F Smart Money Tracker">
                        <Suspense fallback={<LoadingFallback />}>
                            <InstitutionalHoldingsWall />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* 1. STRATEGIC CONTEXT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8">
                        <SectionErrorBoundary name="Weekly Narrative">
                            <Suspense fallback={<LoadingFallback />}>
                                <WeeklyNarrativeSection />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                    <div className="lg:col-span-4">
                        <SectionErrorBoundary name="Today's Brief">
                            <Suspense fallback={<LoadingFallback />}>
                                <TodaysBriefPanel />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>

                {/* 2. LIQUIDITY PLUMBLINE (Core Macro Input) */}
                <div className="w-full space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-blue-400">Liquidity Plumbline</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <SectionErrorBoundary name="Global Liquidity Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <GlobalLiquidityMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-tighter">US Net Liquidity Proxy</h2>
                                <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Monetary Base & Treasury General Account Telemetry</p>
                            </div>
                            <LiveStatusIndicator source="FRED / Treasury" />
                        </div>
                        <SectionErrorBoundary name="Net Liquidity">
                            <NetLiquidityRow />
                        </SectionErrorBoundary>
                    </div>
                </div>

                {/* 3. SOVEREIGN STRESS (Risk Indicators) */}
                <div className="w-full space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-rose-400">Sovereign Stress</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <SectionErrorBoundary name="Sovereign Risk Matrix">
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignRiskMatrix />
                            </Suspense>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="US Debt Maturity Wall">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">US Debt Maturity Wall</h3>
                                        <LiveStatusIndicator source="Treasury" />
                                    </div>
                                    <USDebtMaturityWall />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="w-full">
                        <SectionErrorBoundary name="Corporate Debt Maturity Wall">
                            <Suspense fallback={<LoadingFallback />}>
                                <CorporateDebtMaturityWall />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <SectionErrorBoundary name="Yield Curve Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <YieldCurveMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="Auction Demand Gauge">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Auction Demand Gauge</h3>
                                        <LiveStatusIndicator source="Treasury" />
                                    </div>
                                    <USTreasuryDemandGauge />
                                    <div className="flex justify-end pt-2">
                                        <DataProvenanceBadge 
                                            source="FRED / Treasury" 
                                            methodology="B/S Aggregation"
                                            lastVerified={new Date()}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>

                {/* 4. INSTITUTIONAL POSITIONING */}
                <div className="w-full space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-emerald-400">Capital Positioning</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <SectionErrorBoundary name="Smart Money Flow Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <SmartMoneyFlowMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    
                    <SectionErrorBoundary name="Capital Flows">
                        <Suspense fallback={<LoadingFallback />}>
                            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter">Global Capital Flows</h2>
                                    <LiveStatusIndicator source="BIS / SWIFT" />
                                </div>
                                <CapitalFlowsTerminal hideHeader />
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* 5. REGIONAL INTELLIGENCE */}
                <div className="w-full space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-amber-400">Regional Intelligence</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <SectionErrorBoundary name="China Macro Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl h-full">
                                    <ChinaMacroPulseSection />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="India Credit Cycle">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaCreditCycleClock />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>

                <div className="w-full space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <h2 className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-cyan-400">Institutional Strategy</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <SectionErrorBoundary name="Treasury Snapshot">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl h-full">
                                    <TreasurySnapshotSection />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="Hedging Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl h-full">
                                    <CorporateTreasuryHedgingSection />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </div>

                {/* 6. SYSTEMIC RISK & MONITORING */}
                <div id="geopolitical-matrix" className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Geopolitical Risk Matrix</h2>
                            <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-widest mt-1">Hormuz Tanker Tracking & ADS-B Conflict Telemetry</p>
                        </div>
                        <LiveStatusIndicator source="GDELT / OpenSky" />
                    </div>
                    <SectionErrorBoundary name="Geopolitical Matrix">
                        <Suspense fallback={<LoadingFallback />}>
                            <GeopoliticalEventsRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SectionErrorBoundary name="Deflation Debasement">
                        <Suspense fallback={<LoadingFallback />}>
                            <DeflationDebasementMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    <SectionErrorBoundary name="Currency Wars">
                        <Suspense fallback={<LoadingFallback />}>
                            <CurrencyWarsMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>
            </main>
        </Container>
    );
};

export default Terminal;
