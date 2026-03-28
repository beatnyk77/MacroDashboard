import React, { Suspense, lazy } from 'react';
import { Container } from '@mui/material';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Components
import { LiveStatusIndicator } from '@/components/LiveStatusIndicator';
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';


const CapitalFlowsTerminal = lazy(() => import('@/features/dashboard/components/rows/CapitalFlowsTerminal').then(m => ({ default: m.CapitalFlowsTerminal })));
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));

const SmartMoneyFlowMonitor = lazy(() => import('@/features/dashboard/components/sections/SmartMoneyFlowMonitor').then(m => ({ default: m.SmartMoneyFlowMonitor })));
const GeopoliticalEventsRow = lazy(() => import('@/features/dashboard/components/rows/GeopoliticalEventsRow').then(m => ({ default: m.GeopoliticalEventsRow })));
const China15thFYPTeaserRow = lazy(() => import('@/features/dashboard/components/rows/China15thFYP/China15thFYPTeaserRow').then(m => ({ default: m.China15thFYPTeaserRow })));
const GlobalLiquidityMonitor = lazy(() => import('@/features/dashboard/components/sections/GlobalLiquidityMonitor').then(m => ({ default: m.GlobalLiquidityMonitor })));

const USEquitiesTeaserRow = lazy(() => import('@/features/dashboard/components/rows/USEquitiesTeaserRow').then(m => ({ default: m.USEquitiesTeaserRow })));

const TodaysBriefPanel = lazy(() => import('@/features/dashboard/components/sections/TodaysBriefPanel').then(m => ({ default: m.TodaysBriefPanel })));
const TreasurySnapshotSection = lazy(() => import('@/features/dashboard/components/sections/TreasurySnapshotSection').then(m => ({ default: m.TreasurySnapshotSection })));
const DeflationDebasementMonitor = lazy(() => import('@/features/dashboard/components/rows/DeflationDebasementMonitor').then(m => ({ default: m.DeflationDebasementMonitor })));
const CurrencyWarsMonitor = lazy(() => import('@/features/dashboard/components/rows/CurrencyWarsMonitor').then(m => ({ default: m.CurrencyWarsMonitor })));
const TradeGravityCard = lazy(() => import('@/features/dashboard/components/rows/TradeGravityCard').then(m => ({ default: m.TradeGravityCard })));
const CompactIndiaCard = lazy(() => import('@/features/dashboard/components/cards/CompactIndiaCard').then(m => ({ default: m.CompactIndiaCard })));
const CompactChinaCard = lazy(() => import('@/features/dashboard/components/cards/CompactChinaCard').then(m => ({ default: m.CompactChinaCard })));
const WeeklyNarrativeSection = lazy(() => import('@/features/dashboard/components/sections/WeeklyNarrativeSection').then(m => ({ default: m.WeeklyNarrativeSection })));
const IndiaMarketPulseRow = lazy(() => import('@/features/dashboard/components/rows/IndiaMarketPulseRow').then(m => ({ default: m.IndiaMarketPulseRow })));
const CorporateTreasuryHedgingSection = lazy(() => import('@/features/dashboard/components/sections/CorporateTreasuryHedgingSection').then(m => ({ default: m.CorporateTreasuryHedgingSection })));


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

                <div className="w-full">
                    <SectionErrorBoundary name="Weekly Narrative">
                        <Suspense fallback={<LoadingFallback />}>
                            <WeeklyNarrativeSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                <div className="w-full">
                    <SectionErrorBoundary name="Today's Brief">
                        <Suspense fallback={<LoadingFallback />}>
                            <TodaysBriefPanel />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                {/* Row 0: Global Liquidity Direction Monitor (Primary Context) */}
                <div className="w-full">
                    <SectionErrorBoundary name="Global Liquidity Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <GlobalLiquidityMonitor />
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

                {/* Row 2.5: US Equity Fundamental Pulse (New Entry Point) */}
                <div className="w-full">
                    <SectionErrorBoundary name="US Equities Teaser">
                        <Suspense fallback={<LoadingFallback />}>
                            <USEquitiesTeaserRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                <div className="w-full">
                    <SectionErrorBoundary name="Treasury Snapshot">
                        <Suspense fallback={<LoadingFallback />}>
                            <TreasurySnapshotSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                <div className="w-full">
                    <SectionErrorBoundary name="Corporate Treasury Hedging">
                        <Suspense fallback={<LoadingFallback />}>
                            <CorporateTreasuryHedgingSection />
                        </Suspense>
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

                <div className="w-full">
                    <SectionErrorBoundary name="Deflation & Debasement Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <DeflationDebasementMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                <div className="w-full">
                    <SectionErrorBoundary name="Currency Wars Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <CurrencyWarsMonitor />
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

                <div className="w-full">
                    <SectionErrorBoundary name="Trade Gravity Card">
                        <Suspense fallback={<LoadingFallback />}>
                            <TradeGravityCard />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    <SectionErrorBoundary name="Compact India Card">
                        <Suspense fallback={<LoadingFallback />}>
                            <CompactIndiaCard />
                        </Suspense>
                    </SectionErrorBoundary>
                    <SectionErrorBoundary name="Compact China Card">
                        <Suspense fallback={<LoadingFallback />}>
                            <CompactChinaCard />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>
                <div className="w-full">
                    <SectionErrorBoundary name="India Market Pulse (FII/DII)">
                        <Suspense fallback={<LoadingFallback />}>
                            <IndiaMarketPulseRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>



            </main>
        </Container>
    );
};

export default Terminal;
