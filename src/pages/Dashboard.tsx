import React, { Suspense, lazy } from 'react';
import { Container } from '@mui/material';
import {
    Coins,
    Globe2,
    Building2,
    MapPin,
    ShieldAlert,
    Briefcase,
    Fuel
} from 'lucide-react';
import { SPASection, SPAAccordion } from '@/components/spa';
import { SectionHeader } from '@/components/SectionHeader';
import { DataHealthTicker } from '@/components/DataHealthTicker';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { trackSectionView } from '@/lib/analytics';
import { FeedbackSection } from '@/features/dashboard/components/sections/FeedbackSection';

// Row Components
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';

// Lazy load feature components
const CockpitKPIGrid = lazy(() => import('@/features/dashboard/components/CockpitKPIGrid').then(m => ({ default: m.CockpitKPIGrid })));
const SankeyFlowCard = lazy(() => import('@/features/dashboard/components/sections/SankeyFlowCard').then(m => ({ default: m.SankeyFlowCard })));
const PresidentialPolicyTracker = lazy(() => import('@/features/dashboard/components/sections/PresidentialPolicyTracker').then(m => ({ default: m.PresidentialPolicyTracker })));
const GeopoliticalRiskPulseCard = lazy(() => import('@/features/dashboard/components/sections/GeopoliticalRiskPulseCard').then(m => ({ default: m.GeopoliticalRiskPulseCard })));
const MacroEconomicCalendar = lazy(() => import('@/features/dashboard/components/sections/MacroEconomicCalendar').then(m => ({ default: m.MacroEconomicCalendar })));

// Thematic Labs
const HardAssetValuationSection = lazy(() => import('@/features/dashboard/components/sections/HardAssetValuationSection').then(m => ({ default: m.HardAssetValuationSection })));
const GoldRatioRibbon = lazy(() => import('@/features/dashboard/components/sections/GoldRatioRibbon').then(m => ({ default: m.GoldRatioRibbon })));
const GlobalReserveTracker = lazy(() => import('@/features/dashboard/components/sections/GlobalReserveTracker').then(m => ({ default: m.GlobalReserveTracker })));
const TradeFlowsCard = lazy(() => import('@/features/dashboard/components/cards/TradeFlowsCard').then(m => ({ default: m.TradeFlowsCard })));
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const EnergySecuritySection = lazy(() => import('@/features/dashboard/components/sections/EnergySecuritySection').then(m => ({ default: m.EnergySecuritySection })));

// Country Pulses
const IndiaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/IndiaMacroPulseSection').then(m => ({ default: m.IndiaMacroPulseSection })));
const ChinaMacroPulseSection = lazy(() => import('@/components/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const InstitutionalInfluenceSection = lazy(() => import('@/features/dashboard/components/sections/InstitutionalInfluenceSection').then(m => ({ default: m.InstitutionalInfluenceSection })));

const LoadingFallback = () => (
    <div className="w-full h-48 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Signal...</span>
    </div>
);

export const Dashboard: React.FC = () => {
    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    trackSectionView(entry.target.id);
                }
            });
        }, { threshold: 0.1 });

        const sections = document.querySelectorAll('section[id]');
        sections.forEach(s => observer.observe(s));

        return () => observer.disconnect();
    }, []);

    return (
        <Container maxWidth={false} disableGutters sx={{ py: 4 }}>
            <div className="space-y-24">

                {/* ROW 1: CORE LIQUIDITY SIGNAL */}
                <SPASection id="liquidity-hero" variant="hero" disableAnimation>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                        <SectionHeader
                            title="Macro Heartbeat"
                            subtitle="High-frequency liquidity and regime signals"
                            sectionId="heartbeat"
                        />
                        <DataHealthTicker />
                    </div>

                    <SectionErrorBoundary name="Net Liquidity Row">
                        <Suspense fallback={<LoadingFallback />}>
                            <NetLiquidityRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 2: MARKET TERMINAL GRID */}
                <SPASection id="market-pulse" disableAnimation>
                    <SectionErrorBoundary name="System Heartbeat">
                        <Suspense fallback={<LoadingFallback />}>
                            <CockpitKPIGrid />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 3: MACRO FLOWS (SANKEY) */}
                <SPASection id="macro-flows" variant="band" disableAnimation>
                    <SectionHeader
                        title="Macro Flow Map"
                        subtitle="Interstate capital and energy liquidity flow visualization"
                    />
                    <div className="mt-12">
                        <SectionErrorBoundary name="Flow Map">
                            <Suspense fallback={<LoadingFallback />}>
                                <SankeyFlowCard />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* ROW 4: POLICY & GEOPOLITICS */}
                <SPASection id="policy-geopolitics" disableAnimation>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <SPAAccordion
                            title="Trump Action Monitor"
                            subtitle="Presidential policy tracking & economic impact"
                            icon={<ShieldAlert className="text-rose-500" />}
                            accentColor="rose"
                        >
                            <SectionErrorBoundary name="Policy Tracker">
                                <Suspense fallback={<LoadingFallback />}>
                                    <PresidentialPolicyTracker />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>

                        <SPAAccordion
                            title="Geopolitical Pulse"
                            subtitle="Global conflict risk and institutional sentiment"
                            icon={<Globe2 className="text-blue-500" />}
                            accentColor="blue"
                        >
                            <SectionErrorBoundary name="Geopolitics Card">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GeopoliticalRiskPulseCard />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>
                    </div>

                    <div className="mt-12">
                        <SectionErrorBoundary name="Economic Calendar">
                            <Suspense fallback={<LoadingFallback />}>
                                <MacroEconomicCalendar />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>

                {/* ROW 5: THEMATIC LABS */}
                <SPASection id="thematic-labs" variant="band" className="py-24" disableAnimation>
                    <SectionHeader
                        title="Thematic Deep Dives"
                        subtitle="Detailed signal intelligence for Hard Assets, De-Dollarization, and Sovereign Sustainability"
                    />

                    <div className="mt-16 space-y-12">
                        <SPAAccordion
                            id="gold-anchor"
                            title="Gold Anchor"
                            subtitle="Debt/Gold ratios, M2/Gold σ, Shanghai Divergence"
                            icon={<Coins />}
                            accentColor="gold"
                            interpretations={[
                                "Shanghai/London Divergence: Wide",
                                "M2/Gold Ratio: +1.2σ Expansion",
                                "Physical Premium: Rising"
                            ]}
                        >
                            <SectionErrorBoundary name="Gold Ratio Ribbon">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldRatioRibbon />
                                </Suspense>
                            </SectionErrorBoundary>
                            <SectionErrorBoundary name="Hard Assets">
                                <Suspense fallback={<LoadingFallback />}>
                                    <HardAssetValuationSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>

                        {/* ... BRICS & De-Dollarization (already updated) ... */}
                        <SPAAccordion
                            id="brics-dedollarization"
                            title="BRICS & De-Dollarization"
                            subtitle="USD share decline, gold accumulation, East vs West influence"
                            icon={<Briefcase />}
                            accentColor="rose"
                            interpretations={[
                                "USD Share at 25-Year Low",
                                "NDB Local Currency Loans Up",
                                "Gold Reserves at ATH"
                            ]}
                        >
                            <div className="space-y-8">
                                <SectionErrorBoundary name="Global Reserve Tracker">
                                    <Suspense fallback={<LoadingFallback />}>
                                        <GlobalReserveTracker />
                                    </Suspense>
                                </SectionErrorBoundary>
                                <SectionErrorBoundary name="Trade Flows">
                                    <Suspense fallback={<LoadingFallback />}>
                                        <TradeFlowsCard />
                                    </Suspense>
                                </SectionErrorBoundary>
                            </div>
                        </SPAAccordion>

                        <SPAAccordion
                            id="energy-security"
                            title="Energy Security"
                            subtitle="US Refining Capacity, Crude Sourcing, and Supplier Vulnerability"
                            icon={<Fuel />}
                            accentColor="gold"
                            interpretations={[
                                "Oil Import Diversification: Moderate",
                                "SPR Level: Critical Watch",
                                "Refining Capacity: Stable"
                            ]}
                        >
                            <SectionErrorBoundary name="Energy Security">
                                <Suspense fallback={<LoadingFallback />}>
                                    <EnergySecuritySection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>

                        <SPAAccordion
                            id="sovereign-debt-stress"
                            title="Sovereign Debt Stress"
                            subtitle="G20 debt sustainability, credit spreads matrix"
                            icon={<Building2 />}
                            accentColor="purple"
                            interpretations={[
                                "G20 Debt/GDP: Polarizing",
                                "CDS Spreads: Narrowing",
                                "Refinancing Risk: Neutral"
                            ]}
                        >
                            <SectionErrorBoundary name="Sovereign Risk">
                                <Suspense fallback={<LoadingFallback />}>
                                    <SovereignRiskMatrix />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>
                    </div>
                </SPASection>

                {/* ROW 5.5: SPHERES OF INFLUENCE */}
                <SPASection id="spheres-of-influence" disableAnimation>
                    <SectionErrorBoundary name="Spheres of Influence">
                        <Suspense fallback={<LoadingFallback />}>
                            <InstitutionalInfluenceSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 6: COUNTRY PULSES */}
                <SPASection id="country-pulses" className="py-24" disableAnimation>
                    {/* ... existing content ... */}
                    <div className="mt-16 space-y-12">
                        {/* India Pulse */}
                        <SPAAccordion
                            id="india-pulse"
                            title="India Macro Pulse"
                            subtitle="MoSPI real-time data, credit creation, BOP pressure"
                            icon={<MapPin />}
                            accentColor="blue"
                            interpretations={[
                                "Robust Domestic Credit",
                                "BOP Pressure: Low",
                                "Inflation: Cooling"
                            ]}
                        >
                            <SectionErrorBoundary name="India Macro">
                                <Suspense fallback={<LoadingFallback />}>
                                    <IndiaMacroPulseSection />
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
                        >
                            <SectionErrorBoundary name="China Macro">
                                <Suspense fallback={<LoadingFallback />}>
                                    <ChinaMacroPulseSection />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>
                    </div>
                </SPASection>

                {/* FINAL ROW: FEEDBACK & COMMUNITY */}
                <SPASection id="feedback" className="pb-32" disableAnimation>
                    <FeedbackSection />
                </SPASection>

            </div >
        </Container >
    );
};

export default Dashboard;
