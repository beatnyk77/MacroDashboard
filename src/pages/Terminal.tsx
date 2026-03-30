import React, { Suspense, lazy } from 'react';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-uppercase">Connecting...</span>
    </div>
);

export const Terminal: React.FC = () => {
    return (
        <div className="w-full max-w-[1920px] mx-auto bg-slate-950 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <SEOManager title="GraphiQuestor Terminal" description="Live Institutional Macro Telemetry" isApp={true} />

            <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-heading leading-tight mb-2">
                        Macro Observatory
                    </h1>
                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase">
                        High-Frequency Liquidity & Sovereign Stress Telemetry
                    </p>
                </div>
            </header>

            <main className="space-y-24 pb-32">
                {/* 0. FLAGSHIP: 13-F SMART MONEY TRACKER */}
                <section>
                    <SectionErrorBoundary name="13-F Smart Money Tracker">
                        <Suspense fallback={<LoadingFallback />}>
                            <InstitutionalHoldingsWall />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 1. STRATEGIC CONTEXT */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                </section>

                {/* 2. LIQUIDITY PLUMBLINE (Core Macro Input) */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/80">Liquidity Plumbline</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    
                    <SectionErrorBoundary name="Global Liquidity Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <GlobalLiquidityMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    
                    <Card variant="elevated">
                        <CardHeader className="flex flex-row justify-between items-center border-b border-white/5 pb-4 mb-6">
                            <div>
                                <CardTitle className="text-lg uppercase">US Net Liquidity Proxy</CardTitle>
                                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-uppercase mt-1">Monetary Base & Treasury General Account Telemetry</p>
                            </div>
                            <LiveStatusIndicator source="FRED / Treasury" />
                        </CardHeader>
                        <CardContent>
                            <SectionErrorBoundary name="Net Liquidity">
                                <NetLiquidityRow />
                            </SectionErrorBoundary>
                        </CardContent>
                    </Card>
                </section>

                {/* 3. SOVEREIGN STRESS (Risk Indicators) */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500/80">Sovereign Stress</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <SectionErrorBoundary name="Sovereign Risk Matrix">
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignRiskMatrix />
                            </Suspense>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="US Debt Maturity Wall">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated" className="h-full">
                                    <CardHeader className="flex flex-row justify-between items-center mb-6">
                                        <CardTitle className="text-sm uppercase">US Debt Maturity Wall</CardTitle>
                                        <LiveStatusIndicator source="Treasury" />
                                    </CardHeader>
                                    <CardContent>
                                        <USDebtMaturityWall />
                                    </CardContent>
                                </Card>
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
                                <Card variant="elevated" className="h-full">
                                    <CardHeader className="flex flex-row justify-between items-center mb-6">
                                        <CardTitle className="text-sm uppercase">Auction Demand Gauge</CardTitle>
                                        <LiveStatusIndicator source="Treasury" />
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <USTreasuryDemandGauge />
                                        <div className="flex justify-end pt-2">
                                            <DataProvenanceBadge 
                                                source="FRED / Treasury" 
                                                methodology="B/S Aggregation"
                                                lastVerified={new Date()}
                                                size="sm"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </section>

                {/* 4. INSTITUTIONAL POSITIONING */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80">Capital Positioning</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <SectionErrorBoundary name="Smart Money Flow Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <SmartMoneyFlowMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    
                    <SectionErrorBoundary name="Capital Flows">
                        <Suspense fallback={<LoadingFallback />}>
                            <Card variant="elevated">
                                <CardHeader className="flex flex-row justify-between items-center mb-8 border-b border-white/5 pb-4">
                                    <CardTitle className="text-lg uppercase">Global Capital Flows</CardTitle>
                                    <LiveStatusIndicator source="BIS / SWIFT" />
                                </CardHeader>
                                <CardContent>
                                    <CapitalFlowsTerminal hideHeader />
                                </CardContent>
                            </Card>
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 5. REGIONAL INTELLIGENCE */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80">Regional Intelligence</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <SectionErrorBoundary name="China Macro Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated" className="h-full">
                                    <CardContent>
                                        <ChinaMacroPulseSection />
                                    </CardContent>
                                </Card>
                            </Suspense>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="India Credit Cycle">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaCreditCycleClock />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/80">Institutional Strategy</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <SectionErrorBoundary name="Treasury Snapshot">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated" className="h-full">
                                    <CardContent>
                                        <TreasurySnapshotSection />
                                    </CardContent>
                                </Card>
                            </Suspense>
                        </SectionErrorBoundary>
                        <SectionErrorBoundary name="Hedging Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated" className="h-full">
                                    <CardContent>
                                        <CorporateTreasuryHedgingSection />
                                    </CardContent>
                                </Card>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </section>

                {/* 6. SYSTEMIC RISK & MONITORING */}
                <section>
                    <Card variant="elevated" id="geopolitical-matrix">
                        <CardHeader className="flex flex-row justify-between items-center mb-8 border-b border-white/5 pb-4">
                            <div>
                                <CardTitle className="text-lg uppercase">Geopolitical Risk Matrix</CardTitle>
                                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-uppercase mt-1">Hormuz Tanker Tracking & ADS-B Conflict Telemetry</p>
                            </div>
                            <LiveStatusIndicator source="GDELT / OpenSky" />
                        </CardHeader>
                        <CardContent>
                            <SectionErrorBoundary name="Geopolitical Matrix">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GeopoliticalEventsRow />
                                </Suspense>
                            </SectionErrorBoundary>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                </section>
            </main>
        </div>
    );
};

export default Terminal;
