import React, { Suspense, lazy } from 'react';
import {
    ChevronRight,
    ArrowLeft,
    Fuel,
    Activity,
    Globe,
    Ship,
    Clock
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';

// Lazy loaded components
const SovereignEnergySecuritySection = lazy(() => import('@/features/dashboard/components/sections/SovereignEnergySecuritySection').then(m => ({ default: m.SovereignEnergySecuritySection })));
const AsiaCommodityFlowsSection = lazy(() => import('@/features/dashboard/components/sections/AsiaCommodityFlowsSection').then(m => ({ default: m.AsiaCommodityFlowsSection })));
const GlobalRefiningMonitorSection = lazy(() => import('@/features/dashboard/components/refining/GlobalRefiningMonitorSection').then(m => ({ default: m.GlobalRefiningMonitorSection })));
const CommodityTerminalRow = lazy(() => import('@/features/commodities/CommodityTerminalRow').then(m => ({ default: m.CommodityTerminalRow })));

const GeopoliticalRiskMap = lazy(() => import('@/features/dashboard/components/maps/GeopoliticalRiskMap').then(m => ({ default: m.GeopoliticalRiskMap })));
const FuelSecurityClockIndia = lazy(() => import('@/features/energy/components/FuelSecurityClockIndia'));
const WTICalendarSpread = lazy(() => import('@/features/energy/components/WTICalendarSpread').then(m => ({ default: m.WTICalendarSpread })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Energy Signal...</span>
    </div>
);

export const EnergyCommoditiesLab: React.FC = () => {
    return (
        <>
        <SEOManager
            title="Energy & Commodities Lab — Supply Chains, Refining Capacity & Resource Security"
            description="Analyze global physical flow dynamics, refining capacity elasticity, strategic oil reserves, tanker tracking, and fuel security metrics. Institutional resource security intelligence."
            keywords={['energy commodities', 'oil reserves', 'refining capacity', 'tanker tracking', 'commodity flows', 'fuel security', 'India energy']}
            jsonLd={{
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
                        { '@type': 'ListItem', 'position': 3, 'name': 'Energy & Commodities Lab' }
                    ]
                }
            }}
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

            {/* Intro / How to Use This Lab */}
            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <Fuel size={12} /> Institutional Resource Security
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    Energy & <span className="text-blue-500">Commodities</span>
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide mb-8">
                    Analyzing global physical flow dynamics, refining capacity elasticity, and the energy intensity of the AI compute supercycle.
                </p>

                <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 max-w-4xl">
                    <h2 className="text-xs font-black text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-4 inline-block">How to use this Lab</h2>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-wide">
                        This environment translates physical commodity constraints into sovereign vulnerability metrics.
                        <strong className="text-white"> Start by assessing the US strategic stockpile (SPR) and refining limits.</strong> Then, trace the molecular shift of Russian and Middle Eastern crude eastward to Asia to understand inflation divergence. Finally, monitor the physical bottlenecks of the AI revolution via power demand.
                    </p>
                </div>
            </div>

            {/* WTI CALENDAR SPREAD - FULL WIDTH SIGNAL */}
            <div className="mb-32">
                <SectionErrorBoundary name="WTI Calendar Spread">
                    <Suspense fallback={<LoadingFallback />}>
                        <WTICalendarSpread />
                    </Suspense>
                </SectionErrorBoundary>
            </div>

            <div className="space-y-32">
                {/* 1. Sovereign Energy Security */}
                <section>
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
                            National security is inextricably linked to refining elasticity. The depletion of the SPR combined with aging infrastructure leaves Western economies highly vulnerable to supply shocks. Concurrently, the EU gas storage levels dictate the winter industrial shutdown probabilities, actively altering core inflation forecasts.
                        </p>
                    </div>
                </section>

                {/* 2. Asia Energy & Commodity Flows */}
                <section>
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
                            The "shadow" fleet and redirection of heavily sanctioned crude have created a massive structural cost advantage for Indian refiners and Chinese industrials. By tracking import pain points (FX vs. Brent correlation), we can identify early capitulation risks in emerging markets dependent on dollar-priced energy imports.
                        </p>
                    </div>
                </section>

                {/* 2.2 Global Refining Imbalance Monitor */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Global Refining imbalance</h2>
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

                {/* 2.5 Geopolitical Risk: Hormuz Tanker Tracking */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Ship className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Hormuz Tanker Tracking</h2>
                    </div>

                    <div className="w-full">
                        <SectionErrorBoundary name="Hormuz Tracking">
                            <Suspense fallback={<LoadingFallback />}>
                                <GeopoliticalRiskMap />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="mt-8 p-8 bg-blue-500/5 border-l-4 border-blue-500 rounded-r-[2rem] max-w-4xl">
                        <span className="text-xs font-black uppercase tracking-widest text-blue-400 block mb-4">So What? — Institutional Insight</span>
                        <p className="text-sm text-white/80 leading-relaxed font-medium uppercase tracking-wide">
                            Monitoring the Strait of Hormuz in real-time allows for the detection of "grey zone" maritime activity. Significant deviations in tanker frequency or insurance risk premiums directly impact the Energy Intensity metrics of the global industrial base.
                        </p>
                    </div>
                </section>

                {/* 2.75 Fuel Security Clock – India */}
                <section>
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
                            India's import dependency creates structural inflation vulnerability. The countdown clock and tanker pipeline provide early warning for supply shocks. Track INR/barrel for currency pressure signals and geopolitical risk for black swan exposure.
                        </p>
                    </div>
                </section>

                {/* 3. Physical Flows Terminal */}
                <section>
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
                            This acts as the live ticker for physical stress. Instead of paper markets, tracking the physical delivery networks for critical metals (like Copper and REMs) explicitly fronts the demand impulses of clean tech and defense manufacturing, bypassing financialization noise.
                        </p>
                    </div>
                </section>


            </div>

            {/* SEO Structural Analysis Text Block */}
            <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Structural Analysis of Global Energy Security">
                <h2 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Structural Analysis: Global Energy Security & Physical Molecular Flows</h2>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>Energy & Commodities Lab</strong> tracks the re-materialization of the global economy. In a multipolar era, the control over physical molecular flows—crude oil, natural gas, and critical minerals—becomes the primary lever of sovereign power. Our telemetry focuses on the divergence between "paper markets" (futures/options) and "physical reality" (tanker tracking, refining utilization, and strategic stockpiles).
                    </p>
                    <p>
                        One of the most critical metrics we track is <strong>Refining Capacity Elasticity</strong>. Since 2020, the global refining complex has operated at peak utilization, leaving no margin for geopolitical shocks. For a net-importer like India, this manifests as a structural inflation floor. By monitoring the <a href="/glossary/hormuz-velocity" className="text-blue-400 hover:underline">Hormuz Tanker Velocity</a> natively through GraphiQuestor, analysts can anticipate supply-side shocks before they manifest in regional CPI data.
                    </p>
                    <p>
                        Furthermore, the transition to clean-tech manufacturing (semiconductors and EVs) is fundamentally a transformation of energy demand into mineral demand. The Energy Lab synthesizes these shifts, tracking the inventory levels of Copper and Rare Earth Elements (REMs) relative to 10-year structural averages. This <em>Physical Flows Terminal</em> bypasses financial noise to reveal the underlying resource security of major manufacturing hubs like India and the BRICS+ network.
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
