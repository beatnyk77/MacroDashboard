// src/pages/labs/EnergyCommoditiesLab.tsx
import React, { Suspense, lazy } from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
    ChevronRight,
    ArrowLeft,
    Fuel,
    Activity,
    Globe,
    Ship,
    Clock,
    BarChart2,
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { CurrentEnergyRegimeCard } from '@/features/energy/components/CurrentEnergyRegimeCard';
import { EnergyLabNav } from '@/features/energy/components/EnergyLabNav';

const SovereignEnergySecuritySection = lazy(() => import('@/features/dashboard/components/sections/SovereignEnergySecuritySection').then(m => ({ default: m.SovereignEnergySecuritySection })));
const AsiaCommodityFlowsSection = lazy(() => import('@/features/dashboard/components/sections/AsiaCommodityFlowsSection').then(m => ({ default: m.AsiaCommodityFlowsSection })));
const GlobalRefiningMonitorSection = lazy(() => import('@/features/dashboard/components/refining/GlobalRefiningMonitorSection').then(m => ({ default: m.GlobalRefiningMonitorSection })));
const CommodityTerminalRow = lazy(() => import('@/features/commodities/CommodityTerminalRow').then(m => ({ default: m.CommodityTerminalRow })));
const FuelSecurityClockIndia = lazy(() => import('@/features/energy/components/FuelSecurityClockIndia'));
const WTICalendarSpread = lazy(() => import('@/features/energy/components/WTICalendarSpread').then(m => ({ default: m.WTICalendarSpread })));
const PriceTerminalCard = lazy(() => import('@/features/commodities/components/PriceTerminalCard').then(m => ({ default: m.PriceTerminalCard })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Energy Signal...</span>
    </div>
);

const SmallLoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
);

export const EnergyCommoditiesLab: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.BRENT_CRUDE_PRICE);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
            <EnergyLabNav />
            <SEOManager
                title="Energy Security Intelligence Lab | WTI Contango, SPR Depletion & Refining Capacity Telemetry — GraphiQuestor"
                description="Live WTI calendar spread, US SPR depletion tracker, global refining imbalance monitor, and India fuel security clock. Institutional-grade energy flow telemetry for macro strategists."
                keywords={[
                    'WTI contango backwardation',
                    'US strategic petroleum reserve SPR depletion',
                    'global refining capacity utilization',
                    'India oil import dependency',
                    'sovereign energy security score',
                    'Asia commodity flow dynamics',
                    'Brent crude India current account deficit',
                    'OPEC production cut impact',
                    'chokepoint risk Hormuz Malacca',
                    'energy market regime indicator',
                    'refinery utilization rate EIA',
                    'EU natural gas storage level',
                    'India fuel security coverage days',
                    'shadow fleet crude oil flows',
                    'refining margin arbitrage',
                ]}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        'name': 'Energy & Commodities Lab',
                        'url': 'https://graphiquestor.com/labs/energy-commodities',
                        'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
                        'breadcrumb': {
                            '@type': 'BreadcrumbList',
                            'itemListElement': [
                                { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                                { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                                { '@type': 'ListItem', 'position': 3, 'name': 'Energy & Commodities Lab' },
                            ],
                        },
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Dataset',
                        'name': 'Global Energy Security Data',
                        'description': 'Institutional energy security telemetry including WTI calendar spread regime classification, US SPR capacity utilization (EIA/FRED), global refinery utilization rates, Asia crude import origin flows (UN Comtrade), India fuel security coverage estimates (PPAC/EIA), and sovereign energy vulnerability scoring. Updated weekly via automated ingestion pipelines.',
                        'keywords': ['WTI calendar spread', 'SPR depletion', 'refining capacity', 'India energy security', 'Asia commodity flows', 'chokepoint risk', 'energy market regime'],
                        'url': 'https://graphiquestor.com/labs/energy-commodities',
                        'isAccessibleForFree': true,
                        'creator': {
                            '@type': 'Organization',
                            'name': 'GraphiQuestor'
                        },
                        'author': {
                            '@type': 'Organization',
                            'name': 'GraphiQuestor',
                            'url': 'https://graphiquestor.com'
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
                        <span className="text-blue-500">Energy & Commodities</span>
                    </nav>
                </div>

                {/* Lab Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-uppercase mb-6">
                        <Fuel size={12} /> Institutional Resource Security
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white">
                            Energy & <span className="text-blue-500">Commodities</span>
                        </h1>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </div>
                    <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide mb-8">
                        Analyzing global physical flow dynamics, refining capacity elasticity, and sovereign energy vulnerability.
                    </p>

                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 max-w-4xl">
                        <h2 className="text-xs font-black text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-4 inline-block">How to use this Lab</h2>
                        <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-wide">
                            Start with the <strong className="text-white">Energy Market Regime</strong> card to frame the current physical stress state, then drill into <strong className="text-white">WTI Calendar Spread</strong> for forward paper market structure. <strong className="text-white">Live Commodity Prices</strong> surfaces real-time cross-asset anchoring before <strong className="text-white">Sovereign Energy Security</strong> maps strategic reserve depletion and import exposure by country. <strong className="text-white">Asia Energy &amp; Commodity Flows</strong> and <strong className="text-white">Global Refining Imbalance</strong> reveal where molecular bottlenecks and refinery migration are reshaping inflation trajectories across emerging markets. Complete the picture with the <strong className="text-white">Fuel Security Clock</strong> for India-specific vulnerability thresholds and the <strong className="text-white">Physical Flows Terminal</strong> for raw warehouse-level inventory data on critical metals.
                        </p>
                    </div>
                </div>

                {/* 0. ENERGY MARKET REGIME — Executive Summary */}
                <div id="energy-regime" className="mb-16">
                    <SectionErrorBoundary name="Energy Market Regime">
                        <CurrentEnergyRegimeCard />
                    </SectionErrorBoundary>
                </div>

                {/* 1. WTI CALENDAR SPREAD */}
                <div id="wti-spread" className="mb-32">
                    <SectionErrorBoundary name="WTI Calendar Spread">
                        <Suspense fallback={<LoadingFallback />}>
                            <WTICalendarSpread />
                        </Suspense>
                    </SectionErrorBoundary>
                </div>

                <div className="space-y-32">
                    {/* 2. Live Commodity Prices — promoted from accordion */}
                    <section id="commodity-prices">
                        <div className="flex items-center gap-3 mb-10">
                            <BarChart2 className="text-amber-500" size={28} />
                            <h2 className="text-2xl font-black uppercase tracking-heading text-white">Live Commodity Prices</h2>
                        </div>
                        <SectionErrorBoundary name="Commodity Prices">
                            <Suspense fallback={<SmallLoadingFallback />}>
                                <PriceTerminalCard />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    {/* 3. Sovereign Energy Security */}
                    <section id="sovereign-security">
                        <div className="flex items-center gap-3 mb-10">
                            <Globe className="text-blue-500" size={28} />
                            <h2 className="text-2xl font-black uppercase tracking-heading text-white">Sovereign Energy Security</h2>
                        </div>
                        <div className="w-full">
                            <SectionErrorBoundary name="Sovereign Energy Security">
                                <Suspense fallback={<LoadingFallback />}>
                                    <SovereignEnergySecuritySection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <div className="mt-8 p-8 bg-blue-500/5 border-l-4 border-blue-500 rounded-r-[2rem] max-w-4xl">
                            <span className="text-xs font-black uppercase tracking-widest text-blue-400 block mb-4">So What? — Institutional Insight</span>
                            <p className="text-sm text-white/80 leading-relaxed font-medium uppercase tracking-wide">
                                National security is inextricably linked to refining elasticity. The depletion of the SPR combined with aging infrastructure leaves Western economies highly vulnerable to supply shocks. EU gas storage levels dictate winter industrial shutdown probabilities, actively altering core inflation forecasts.
                            </p>
                        </div>
                    </section>

                    {/* 4. Asia Energy & Commodity Flows */}
                    <section id="asia-flows">
                        <div className="flex items-center gap-3 mb-10">
                            <Ship className="text-emerald-500" size={28} />
                            <h2 className="text-2xl font-black uppercase tracking-heading text-white">Asia Energy & Commodity Flows</h2>
                        </div>
                        <div className="w-full">
                            <SectionErrorBoundary name="Asia Commodity Flows">
                                <Suspense fallback={<LoadingFallback />}>
                                    <AsiaCommodityFlowsSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <div className="mt-8 p-8 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-[2rem] max-w-4xl">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-4">So What? — Institutional Insight</span>
                            <p className="text-sm text-white/80 leading-relaxed font-medium uppercase tracking-wide">
                                The shadow fleet and redirection of sanctioned crude have created a structural cost advantage for Indian refiners and Chinese industrials. By tracking import pain points (FX vs. Brent correlation), we can identify early capitulation risks in emerging markets dependent on dollar-priced energy.
                            </p>
                        </div>
                    </section>

                    {/* 5. Global Refining Imbalance */}
                    <section id="refining-imbalance">
                        <div className="flex items-center gap-3 mb-10">
                            <Activity className="text-blue-500" size={28} />
                            <h2 className="text-2xl font-black uppercase tracking-heading text-white">Global Refining Imbalance</h2>
                        </div>
                        <div className="w-full">
                            <SectionErrorBoundary name="Global Refining Monitor">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GlobalRefiningMonitorSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <div className="mt-8 p-8 bg-blue-500/5 border-l-4 border-blue-500 rounded-r-[2rem] max-w-4xl">
                            <span className="text-xs font-black uppercase tracking-widest text-blue-400 block mb-4">So What? — Institutional Insight</span>
                            <p className="text-sm text-white/80 leading-relaxed font-medium uppercase tracking-wide">
                                Refining capacity is the ultimate bottleneck in the energy transition. The migration of complex refining clusters from West to East represents a fundamental shift in geopolitical leverage, as refined product arbitrage now dictates regional inflation trajectories more than crude price itself.
                            </p>
                        </div>
                    </section>

                    {/* 6. Fuel Security Clock – India */}
                    <section id="fuel-clock">
                        <div className="flex items-center gap-3 mb-10">
                            <Clock className="text-amber-500" size={28} />
                            <h2 className="text-2xl font-black uppercase tracking-heading text-white">Fuel Security Clock – India</h2>
                        </div>
                        <div className="w-full">
                            <SectionErrorBoundary name="Fuel Security Clock India">
                                <Suspense fallback={<LoadingFallback />}>
                                    <FuelSecurityClockIndia />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <div className="mt-8 p-8 bg-amber-500/5 border-l-4 border-amber-500 rounded-r-[2rem] max-w-4xl">
                            <span className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-4">So What? — Institutional Insight</span>
                            <p className="text-sm text-white/80 leading-relaxed font-medium uppercase tracking-wide">
                                India's ~85% maritime import dependency makes Hormuz closure the single highest-impact tail risk for sovereign fiscal stability — no overland substitution exists at scale. Track the INR/barrel cost metric against the INR 7,000+ threshold: sustained breach signals elevated current account deterioration and imported inflation pass-through into CPI. A geopolitical risk score above 70 combined with reserves coverage below 15 days constitutes the dual-trigger for immediate fiscal stress, requiring intervention in either foreign exchange reserves or domestic price controls. Monitor both simultaneously — each metric alone is insufficient for actionable positioning.
                            </p>
                        </div>
                    </section>

                    {/* 7. Physical Flows Terminal */}
                    <section id="flows-terminal">
                        <div className="flex items-center gap-3 mb-10">
                            <Activity className="text-amber-500" size={28} />
                            <h2 className="text-2xl font-black uppercase tracking-heading text-white">Physical Flows Terminal</h2>
                        </div>
                        <div className="w-full">
                            <SectionErrorBoundary name="Commodity Terminal">
                                <Suspense fallback={<LoadingFallback />}>
                                    <CommodityTerminalRow />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <div className="mt-8 p-8 bg-amber-500/5 border-l-4 border-amber-500 rounded-r-[2rem] max-w-4xl">
                            <span className="text-xs font-black uppercase tracking-widest text-amber-500 block mb-4">So What? — Institutional Insight</span>
                            <p className="text-sm text-white/80 leading-relaxed font-medium uppercase tracking-wide">
                                Copper inventory at LME/SHFE below 5-day consumption is the canonical leading indicator of Chinese industrial re-stocking cycles, signaling demand inflection 4–6 weeks ahead of futures price confirmation. REM supply concentration — China controls ~85% of global processing capacity — means any export restriction creates immediate aerospace and defense procurement risk with no short-run substitution available. For structural demand reads, the physical premium versus spot (the basis) is materially more informative than headline futures prices, as it reflects actual delivery urgency rather than financial positioning. Watch warehouse cancellations and load-out rates alongside inventory levels for the highest-conviction entry signals.
                            </p>
                        </div>
                    </section>
                </div>

                {/* SEO Article */}
                <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Structural Analysis of Global Energy Security">
                    <h2 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Structural Analysis: Global Energy Security & Physical Molecular Flows</h2>
                    <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                        <p>
                            The <strong>Energy & Commodities Lab</strong> tracks the re-materialization of the global economy. In a multipolar era, the control over physical molecular flows—crude oil, natural gas, and critical minerals—becomes the primary lever of sovereign power. Our telemetry focuses on the divergence between paper markets (futures/options) and physical reality (refining utilization, strategic stockpiles, and import origins).
                        </p>
                        <p>
                            One of the most critical metrics we track is <strong>Refining Capacity Elasticity</strong>. Since 2020, the global refining complex has operated at peak utilization, leaving no margin for geopolitical shocks. For a net-importer like India, this manifests as a structural inflation floor monitored through the <strong>WTI Calendar Spread</strong> and Brent-INR cost pressure.
                        </p>
                        <p>
                            Furthermore, the transition to clean-tech manufacturing is fundamentally a transformation of energy demand into mineral demand. The Energy Lab synthesizes these shifts, tracking Copper and Rare Earth Element inventories relative to structural averages, bypassing financial noise to reveal the underlying resource security of major manufacturing hubs.
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
            </div>
        </>
    );
};

export default EnergyCommoditiesLab;
