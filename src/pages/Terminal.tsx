import React, { Suspense, lazy } from 'react';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { LiveStatusIndicator } from '@/components/LiveStatusIndicator';
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { CorporateDebtMaturityWall } from '@/components/CorporateDebtMaturityWall';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { FeedbackSection } from '@/features/dashboard/components/sections/FeedbackSection';
import { FedMonetizationMonitor } from '@/features/dashboard/components/rows/FedMonetizationMonitor';
import { DailyMacroPanel } from '@/features/daily-macro/components/DailyMacroPanel';
import { TodaysBriefPanel } from '@/features/dashboard/components/sections/TodaysBriefPanel';
import { EnergySection } from '@/features/dashboard/components/sections/EnergySection';
import { TradeEntryBanner } from '@/features/trade/components/TradeEntryBanner';

const WeeklyRegimeDigest = lazy(() => import('@/features/dashboard/components/sections/WeeklyRegimeDigest').then(m => ({ default: m.WeeklyRegimeDigest })));
const RegimeDigestSection = lazy(() => import('@/features/dashboard/components/sections/RegimeDigestSection').then(m => ({ default: m.RegimeDigestSection })));

// 1. LIQUIDITY & FLOWS
const GlobalLiquidityMonitor = lazy(() => import('@/features/dashboard/components/sections/GlobalLiquidityMonitor').then(m => ({ default: m.GlobalLiquidityMonitor })));

// 2. SOVEREIGN STRESS
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const G20GdpPerCapitaConvergence = lazy(() => import('@/features/dashboard/components/rows/G20GdpPerCapitaConvergence').then(m => ({ default: m.G20GdpPerCapitaConvergence })));
const YieldCurveMonitor = lazy(() => import('@/features/dashboard/components/rows/YieldCurveMonitor').then(m => ({ default: m.YieldCurveMonitor })));
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const TreasurySnapshotSection = lazy(() => import('@/features/dashboard/components/sections/TreasurySnapshotSection').then(m => ({ default: m.TreasurySnapshotSection })));

// 3. REGIONAL & MACRO
const ChinaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const IndiaCreditCycleClock = lazy(() => import('@/features/dashboard/components/rows/IndiaCreditCycleClock').then(m => ({ default: m.IndiaCreditCycleClock })));
const IndiaMacroDashboard = lazy(() => import('@/features/dashboard/components/sections/IndiaMacroDashboard').then(m => ({ default: m.IndiaMacroDashboard })));
const AfricaMacroSnapshot = lazy(() => import('@/features/dashboard/components/sections/AfricaMacroSnapshot').then(m => ({ default: m.AfricaMacroSnapshot })));
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
            <SEOManager
                title="Macro Observatory | Live Institutional Telemetry"
                description="Real-time macro intelligence terminal tracking US net liquidity, sovereign stress, yield curves, and Fed balance sheet. Institutional-grade data for PMs, CIOs, and macro researchers."
                keywords={[
                    'Institutional Macro Dashboard', 'US Net Liquidity Monitor', 'Fed Balance Sheet Tracker',
                    'Sovereign Risk Terminal', 'Yield Curve Inversion',
                    'Treasury Auction Demand', 'Macro Liquidity Analysis', 'India Macro Data',
                    'China Economic Pulse', 'Debt Maturity Wall',
                    'Monetary Policy Tracker', 'Macro Research Terminal', 'GraphiQuestor'
                ]}
                isApp={true}
            />

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
                {/* DAILY MACRO LAYER — pinned to top */}
                <section id="daily-macro-layer" className="space-y-8">
                    <SectionErrorBoundary name="Daily Macro Layer">
                        <DailyMacroPanel />
                        <div className="mt-8">
                            <TodaysBriefPanel />
                        </div>
                    </SectionErrorBoundary>
                </section>

                {/* 0. SOVEREIGN COMPASS - COUNTRY INTELLIGENCE */}
                <section>
                    <SectionErrorBoundary name="Sovereign Compass">
                        <Card variant="elevated" className="relative overflow-hidden">
                            {/* Background accent */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                            <CardHeader className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <Globe className="w-6 h-6 text-blue-400" />
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/80">
                                                Sovereign Compass
                                            </h2>
                                        </div>
                                        <CardTitle className="text-2xl md:text-3xl font-black mb-3">
                                            Country Intelligence Terminals
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground/70 max-w-2xl">
                                            Deep-dive macro profiles for 40+ sovereigns. Real-time GDP, inflation, debt ratios,
                                            FX reserves, yield curves, and sovereign stress indicators — all updated via live APIs.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button asChild size="lg" className="gap-2">
                                            <Link to="/countries">
                                                <MapPin className="w-4 h-4" />
                                                Explore All Countries
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="relative z-10 pt-6">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {[
                                        { code: 'US', name: 'United States', flag: '🇺🇸' },
                                        { code: 'CN', name: 'China', flag: '🇨🇳' },
                                        { code: 'IN', name: 'India', flag: '🇮🇳' },
                                        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
                                        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
                                    ].map(country => (
                                        <Link
                                            key={country.code}
                                            to={`/countries/${country.code}`}
                                            className="group p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-200"
                                        >
                                            <div className="text-2xl mb-2">{country.flag}</div>
                                            <div className="font-bold text-sm group-hover:text-blue-400 transition-colors">
                                                {country.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground/50 mt-1">
                                                Full Profile →
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </SectionErrorBoundary>
                </section>


                {/* 1. STRATEGIC CONTEXT - UNIFIED WEEKLY DIGEST */}
                <section>
                    <SectionErrorBoundary name="Weekly Regime Digest">
                        <Suspense fallback={<LoadingFallback />}>
                            <WeeklyRegimeDigest />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 1.5. MONTHLY STRATEGY */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/80">Monthly Strategy</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <SectionErrorBoundary name="Regime Digest Section">
                        <Suspense fallback={<LoadingFallback />}>
                            <RegimeDigestSection />
                        </Suspense>
                    </SectionErrorBoundary>
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

                    <div className="space-y-8">
                        <SectionErrorBoundary name="Sovereign Risk Matrix">
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignRiskMatrix />
                            </Suspense>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="G20 Convergence">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated">
                                    <CardHeader className="flex flex-row justify-between items-center mb-6 border-b border-white/5 pb-4">
                                        <CardTitle className="text-sm uppercase italic text-blue-400">Proprietary Signal: G20 GDP Per Capita Convergence</CardTitle>
                                        <LiveStatusIndicator source="World Bank / IMF" />
                                    </CardHeader>
                                    <CardContent>
                                        <G20GdpPerCapitaConvergence />
                                    </CardContent>
                                </Card>
                            </Suspense>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="US Debt Maturity Wall">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated">
                                    <CardHeader className="flex flex-row justify-between items-center mb-6 border-b border-white/5 pb-4">
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

                    {/* Divider between US Debt & Fed Monetization */}
                    <div className="border-t border-slate-700/30 my-8" />
                    <p className="text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Federal Reserve Policy Impact
                        </span>
                    </p>

                    <div className="w-full">
                        <SectionErrorBoundary name="Fed Monetization Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated">
                                    <CardHeader className="flex flex-row justify-between items-center mb-6 border-b border-white/5 pb-4">
                                        <CardTitle className="text-sm uppercase">Fed Monetization Monitor</CardTitle>
                                        <LiveStatusIndicator source="FRED" />
                                    </CardHeader>
                                    <CardContent>
                                        <FedMonetizationMonitor />
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

                    <div className="space-y-8">
                        <SectionErrorBoundary name="Yield Curve Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <YieldCurveMonitor />
                            </Suspense>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="Auction Demand Gauge">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated">
                                    <CardHeader className="flex flex-row justify-between items-center mb-6 border-b border-white/5 pb-4">
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

                {/* 3.5 TRADE INTELLIGENCE */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80">Trade Intelligence</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <SectionErrorBoundary name="Trade Intelligence">
                        <Suspense fallback={<LoadingFallback />}>
                            <TradeEntryBanner />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 4. REGIONAL INTELLIGENCE */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80">Regional Intelligence</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="space-y-12">
                        <SectionErrorBoundary name="India Macro Snapshot">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaMacroDashboard />
                            </Suspense>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="Africa Macro Snapshot">
                            <Suspense fallback={<LoadingFallback />}>
                                <AfricaMacroSnapshot />
                            </Suspense>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="China Macro Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <Card variant="elevated">
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

                {/* 4.5 ENERGY & COMMODITIES */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500/80">Energy & Commodities</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <SectionErrorBoundary name="Energy & Commodities">
                        <Suspense fallback={<LoadingFallback />}>
                            <EnergySection />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 5. INSTITUTIONAL STRATEGY */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/80">Institutional Strategy</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <SectionErrorBoundary name="Treasury Snapshot">
                        <Suspense fallback={<LoadingFallback />}>
                            <Card variant="elevated">
                                <CardContent>
                                    <TreasurySnapshotSection />
                                </CardContent>
                            </Card>
                        </Suspense>
                    </SectionErrorBoundary>
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

                <section className="space-y-8">
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

                {/* User Feedback Section */}
                <section className="py-12">
                    <SectionErrorBoundary name="User Feedback">
                        <Suspense fallback={<LoadingFallback />}>
                            <FeedbackSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>
            </main>
        </div>
    );
};

export default Terminal;
