import React, { Suspense, lazy } from 'react';
import { Container } from '@mui/material';
import {
    Coins,
    Globe2,
    Building2,
    Fuel,
    TrendingUp,
    MapPin
} from 'lucide-react';
import { SPASection, SPAAccordion } from '@/components/spa';
import { SectionHeader } from '@/components/SectionHeader';
import { DataHealthTicker } from '@/components/DataHealthTicker';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Lazy load heavy sections
const CockpitKPIGrid = lazy(() => import('@/features/dashboard/components/CockpitKPIGrid').then(m => ({ default: m.CockpitKPIGrid })));
const NetLiquidityCard = lazy(() => import('@/features/dashboard/components/cards/NetLiquidityCard').then(m => ({ default: m.NetLiquidityCard })));
const MacroOrientationSection = lazy(() => import('@/features/dashboard/components/sections/MacroOrientationSection').then(m => ({ default: m.MacroOrientationSection })));
const GlobalLiquiditySection = lazy(() => import('@/features/dashboard/components/sections/GlobalLiquiditySection').then(m => ({ default: m.GlobalLiquiditySection })));

// Thematic Labs
const HardAssetValuationSection = lazy(() => import('@/features/dashboard/components/sections/HardAssetValuationSection').then(m => ({ default: m.HardAssetValuationSection })));
const GoldValuationStrip = lazy(() => import('@/features/dashboard/components/sections/GoldValuationStrip').then(m => ({ default: m.GoldValuationStrip })));
const GoldReturnsSection = lazy(() => import('@/features/dashboard/components/sections/GoldReturnsSection'));
const BRICSTrackerSection = lazy(() => import('@/features/dashboard/components/sections/BRICSTrackerSection').then(m => ({ default: m.BRICSTrackerSection })));
const DeDollarizationSection = lazy(() => import('@/features/dashboard/components/sections/DeDollarizationSection').then(m => ({ default: m.DeDollarizationSection })));
const InstitutionalInfluenceSection = lazy(() => import('@/features/dashboard/components/sections/InstitutionalInfluenceSection').then(m => ({ default: m.InstitutionalInfluenceSection })));
const TradeFlowsCard = lazy(() => import('@/features/dashboard/components/cards/TradeFlowsCard').then(m => ({ default: m.TradeFlowsCard })));
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const EnergySecuritySection = lazy(() => import('@/features/dashboard/components/sections/EnergySecuritySection').then(m => ({ default: m.EnergySecuritySection })));

// Country Pulses
const IndiaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/IndiaMacroPulseSection').then(m => ({ default: m.IndiaMacroPulseSection })));
const ChinaMacroPulseSection = lazy(() => import('@/components/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const ScenarioStudio = lazy(() => import('@/features/dashboard/components/sections/ScenarioStudio').then(m => ({ default: m.ScenarioStudio })));

const LoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading...</span>
    </div>
);

/**
 * GraphiQuestorSPA - Unified single-page dashboard combining Dashboard, Thematic Labs, and Country Pulses.
 * Desktop-first design with full-width stacked cards and scroll-triggered animations.
 */
export const GraphiQuestorSPA: React.FC = () => {
    return (
        <Container maxWidth={false} disableGutters sx={{ py: 4 }}>
            <div className="space-y-16 lg:space-y-24">

                {/* ═══════════════════════════════════════════════════════════════════
                    HERO SECTION: MACRO HEARTBEAT
                ═══════════════════════════════════════════════════════════════════ */}
                <SPASection id="macro-heartbeat" variant="hero" disableAnimation>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <SectionHeader
                            title="Macro Heartbeat"
                            subtitle="High-frequency liquidity and regime signals"
                            sectionId="heartbeat"
                        />
                        <DataHealthTicker />
                    </div>

                    {/* Hero Row: Net Liquidity + KPI Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Net Liquidity - Primary Signal */}
                        <div className="xl:col-span-1">
                            <SectionErrorBoundary name="Net Liquidity">
                                <Suspense fallback={<LoadingFallback />}>
                                    <NetLiquidityCard />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>

                        {/* KPI Grid - Full Width */}
                        <div className="xl:col-span-2">
                            <SectionErrorBoundary name="System Heartbeat">
                                <Suspense fallback={<LoadingFallback />}>
                                    <CockpitKPIGrid />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>

                    {/* Institutional Note */}
                    <div className="mt-8 p-6 rounded-xl bg-blue-500/[0.03] border border-blue-500/10">
                        <p className="italic text-sm text-muted-foreground/70 leading-relaxed">
                            <span className="font-semibold text-blue-400 not-italic">Institutional Note:</span>{' '}
                            The Heartbeat suite monitors 48+ data points across G7 and EM markets to detect regime shifts in real-time.
                        </p>
                    </div>
                </SPASection>

                {/* Regime Context Band */}
                <SPASection id="regime-context" variant="band">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <SectionErrorBoundary name="Macro Orientation">
                            <Suspense fallback={<LoadingFallback />}>
                                <MacroOrientationSection />
                            </Suspense>
                        </SectionErrorBoundary>

                        <SectionErrorBoundary name="Global Liquidity">
                            <Suspense fallback={<LoadingFallback />}>
                                <GlobalLiquiditySection />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* ═══════════════════════════════════════════════════════════════════
                    THEMATIC LABS
                ═══════════════════════════════════════════════════════════════════ */}
                <SPASection id="thematic-labs">
                    <SectionHeader
                        title="Thematic Labs"
                        subtitle="Deep-dive signals for Gold, BRICS, and Global Sovereign Stress"
                    />

                    <div className="mt-8 space-y-6">
                        {/* Gold Anchor */}
                        <SPAAccordion
                            id="gold-anchor"
                            title="Gold Anchor"
                            subtitle="Debt/Gold ratios, M2/Gold σ, Real Rates divergence"
                            icon={<Coins />}
                            accentColor="gold"
                            defaultOpen={true}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <SectionErrorBoundary name="Hard Assets">
                                    <Suspense fallback={<LoadingFallback />}>
                                        <HardAssetValuationSection />
                                    </Suspense>
                                </SectionErrorBoundary>

                                <SectionErrorBoundary name="Gold Returns">
                                    <Suspense fallback={<LoadingFallback />}>
                                        <GoldReturnsSection />
                                    </Suspense>
                                </SectionErrorBoundary>
                            </div>

                            <SectionErrorBoundary name="Gold Ribbon">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldValuationStrip />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>

                        {/* BRICS & De-Dollarization */}
                        <SPAAccordion
                            id="brics-dedollarization"
                            title="BRICS & De-Dollarization"
                            subtitle="USD share decline, gold accumulation, East vs West influence"
                            icon={<Globe2 />}
                            accentColor="rose"
                            defaultOpen={true}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <SectionErrorBoundary name="De-Dollarization">
                                    <Suspense fallback={<LoadingFallback />}>
                                        <DeDollarizationSection />
                                    </Suspense>
                                </SectionErrorBoundary>

                                <SectionErrorBoundary name="BRICS Tracker">
                                    <Suspense fallback={<LoadingFallback />}>
                                        <BRICSTrackerSection />
                                    </Suspense>
                                </SectionErrorBoundary>
                            </div>

                            <SectionErrorBoundary name="Institutional Influence">
                                <Suspense fallback={<LoadingFallback />}>
                                    <InstitutionalInfluenceSection />
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Trade Flows">
                                <Suspense fallback={<LoadingFallback />}>
                                    <TradeFlowsCard />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>

                        {/* BoJ & Yen Pivot */}
                        <SPAAccordion
                            id="boj-yen-pivot"
                            title="BoJ & Yen Pivot"
                            subtitle="Yield curve control, carry trade unwind risk"
                            icon={<TrendingUp />}
                            accentColor="blue"
                            defaultOpen={true}
                        >
                            <div className="h-[400px] bg-white/[0.01] border border-white/5 rounded-xl flex flex-col items-center justify-center">
                                <span className="text-muted-foreground/30 text-sm tracking-[0.4em] uppercase font-black mb-4">
                                    BoJ Pivot Tracker Terminal
                                </span>
                                <span className="text-muted-foreground/20 text-xs italic">
                                    Monitoring YCC band adjustments and intervention signals...
                                </span>
                            </div>
                        </SPAAccordion>

                        {/* Sovereign Debt Stress */}
                        <SPAAccordion
                            id="sovereign-debt-stress"
                            title="Sovereign Debt Stress"
                            subtitle="G20 debt sustainability, credit spreads matrix"
                            icon={<Building2 />}
                            accentColor="purple"
                            defaultOpen={true}
                        >
                            <SectionErrorBoundary name="Sovereign Risk">
                                <Suspense fallback={<LoadingFallback />}>
                                    <SovereignRiskMatrix />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>

                        {/* Energy Security */}
                        <SPAAccordion
                            id="energy-security"
                            title="Energy Security"
                            subtitle="Refining capacity, crude sourcing, supply chain vulnerability"
                            icon={<Fuel />}
                            accentColor="emerald"
                            defaultOpen={true}
                        >
                            <SectionErrorBoundary name="Energy Security">
                                <Suspense fallback={<LoadingFallback />}>
                                    <EnergySecuritySection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>
                    </div>
                </SPASection>

                {/* ═══════════════════════════════════════════════════════════════════
                    COUNTRY PULSES
                ═══════════════════════════════════════════════════════════════════ */}
                <SPASection id="country-pulses">
                    <SectionHeader
                        title="Country Pulses"
                        subtitle="Institutional coverage of India and China regional macro"
                    />

                    <div className="mt-8 space-y-6">
                        {/* India Pulse */}
                        <SPAAccordion
                            id="india-pulse"
                            title="India Pulse"
                            subtitle="MoSPI real-time data, credit creation, BOP pressure"
                            icon={<MapPin />}
                            accentColor="blue"
                            defaultOpen={true}
                        >
                            <SectionErrorBoundary name="India Macro">
                                <Suspense fallback={<LoadingFallback />}>
                                    <IndiaMacroPulseSection />
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Scenario Studio">
                                <Suspense fallback={<LoadingFallback />}>
                                    <ScenarioStudio />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>

                        {/* China Pulse */}
                        <SPAAccordion
                            id="china-pulse"
                            title="China Pulse"
                            subtitle="GDP, CPI, credit impulse, PBoC intervention"
                            icon={<MapPin />}
                            accentColor="rose"
                            defaultOpen={true}
                        >
                            <SectionErrorBoundary name="China Macro">
                                <Suspense fallback={<LoadingFallback />}>
                                    <ChinaMacroPulseSection />
                                </Suspense>
                            </SectionErrorBoundary>

                            {/* PBoC Liquidity Tracker Placeholder */}
                            <div className="h-[300px] bg-white/[0.01] border border-white/5 rounded-xl flex flex-col items-center justify-center">
                                <span className="text-rose-500/30 text-sm tracking-[0.4em] uppercase font-black mb-4">
                                    PBoC Liquidity Tracker
                                </span>
                                <span className="text-rose-500/15 text-xs italic">
                                    Tracking capital flight and intervention signals...
                                </span>
                            </div>
                        </SPAAccordion>
                    </div>
                </SPASection>

            </div>
        </Container>
    );
};

export default GraphiQuestorSPA;
