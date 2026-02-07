import React from 'react';
import { MacroOrientationSection } from '@/features/dashboard/components/sections/MacroOrientationSection';
import { HardAssetValuationSection } from '@/features/dashboard/components/sections/HardAssetValuationSection';
import { GlobalLiquiditySection } from '@/features/dashboard/components/sections/GlobalLiquiditySection';
import { DeDollarizationSection } from '@/features/dashboard/components/sections/DeDollarizationSection';
import { BRICSTrackerSection } from '@/features/dashboard/components/sections/BRICSTrackerSection';
import { IndiaMacroPulseSection } from '@/features/dashboard/components/sections/IndiaMacroPulseSection';
import { ChinaMacroPulseSection } from '@/components/ChinaMacroPulseSection';
import { TreasurySnapshotSection } from '@/features/dashboard/components/sections/TreasurySnapshotSection';
import { GoldValuationStrip } from '@/features/dashboard/components/sections/GoldValuationStrip';
import { MajorEconomiesTable } from '@/features/dashboard/components/sections/MajorEconomiesTable';
import { SovereignRiskMatrix } from '@/features/dashboard/components/sections/SovereignRiskMatrix';
import { TradeSettlementFlows } from '@/features/dashboard/components/sections/TradeSettlementFlows';
import { ScenarioStudio } from '@/features/dashboard/components/sections/ScenarioStudio';
import { SovereignHealthRadar } from '@/features/dashboard/components/sections/SovereignHealthRadar';
import GoldReturnsSection from '@/features/dashboard/components/sections/GoldReturnsSection';
import { TodaysBriefPanel } from '@/features/dashboard/components/sections/TodaysBriefPanel';
import { LatestMacroHeadlinesCard } from '@/features/dashboard/components/cards/LatestMacroHeadlinesCard';
import { CockpitKPIGrid } from '@/features/dashboard/components/CockpitKPIGrid';
import { SEOFAQSection } from '@/features/dashboard/components/sections/SEOFAQSection';

// Lazy load non-critical bottom sections
const TreasuryHoldersSection = React.lazy(() => import('@/features/dashboard/components/sections/TreasuryHoldersSection').then(m => ({ default: m.TreasuryHoldersSection })));
const HowToUseCard = React.lazy(() => import('@/features/dashboard/components/sections/HowToUseCard').then(m => ({ default: m.HowToUseCard })));

export const Dashboard: React.FC = () => {
    return (
        <div className="pb-32 pt-0 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

            {/* Top Anchor */}
            <div id="top" />

            {/* SEO H1 - Visually Hidden for Screen Readers & Crawlers */}
            <h1 className="sr-only">
                Macro Liquidity Dashboard & Global Macro Observatory
            </h1>

            {/* SEO Intro Paragraph */}
            <div className="mb-8 px-6 py-5 rounded-lg bg-background/5 border border-border/40">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    GraphiQuestor is an institutional-grade <strong>macro liquidity dashboard</strong> and <strong>global macro observatory</strong> designed for professional researchers and portfolio managers. Our platform provides real-time <strong>macro regime analysis</strong> by tracking the <strong>global liquidity cycle</strong>, <strong>gold valuation vs real rates</strong>, and <strong>sovereign bond stress indicators</strong>. By monitoring critical signals such as <strong>BRICS de-dollarization</strong>, <strong>BRICS gold accumulation</strong>, and <strong>foreign holders of US Treasuries</strong>, GraphiQuestor offers a comprehensive <strong>macro risk dashboard</strong> to navigate complex market cycles. Our <strong>global liquidity monitor</strong> utilizes 25-year historical z-scores to provide deep institutional memory, helping users identify shifts in the <strong>sovereign risk monitor</strong> and evaluate <strong>gold macro valuation</strong> in a shifting multi-polar world. Whether managing a global macro portfolio or tracking systemic stress, GraphiQuestor is the definitive <strong>macroeconomic dashboard</strong> for modern institutional macro research.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-8">
                {/* LEFT COLUMN (Main Content) - Occupies 8/12 on large desktops */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-12">

                    {/* 2. System Heartbeat (Hero Section - Sacred, breathing room preserved) */}
                    <div id="cockpit-section">
                        <CockpitKPIGrid />
                    </div>

                    <div className="space-y-12">
                        {/* 3. Macro Orientation (Sacred - preserving existing layout) */}
                        <div id="macro-orientation-section">
                            <MacroOrientationSection />
                        </div>

                        {/* Hard Assets + Global Liquidity - 2-column breathing room */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div id="hard-asset-valuation-section" className="h-full">
                                <HardAssetValuationSection />
                            </div>
                            <div id="global-liquidity-section" className="h-full">
                                <GlobalLiquiditySection />
                            </div>
                        </div>

                        {/* 6. De-Dollarization Tracker */}
                        <div id="de-dollarization-section">
                            <DeDollarizationSection />
                        </div>

                        {/* 6.1 Trade Settlement & BRICS+ Momentum */}
                        <div id="trade-settlement-section">
                            <TradeSettlementFlows />
                        </div>

                        {/* Gold Returns + BRICS Tracker - 2-column with matched heights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div id="gold-returns-section" className="h-full">
                                <GoldReturnsSection />
                            </div>
                            <div id="brics-tracker-section" className="h-full">
                                <BRICSTrackerSection />
                            </div>
                        </div>

                        {/* Country Pulse Sections - 2-column matched heights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div id="china-macro-section" className="h-full">
                                <ChinaMacroPulseSection />
                            </div>
                            <div id="india-macro-section" className="h-full">
                                <IndiaMacroPulseSection />
                            </div>
                        </div>

                        {/* Large Data Tables - Full width for breathing room*/}
                        <div id="major-economies-section">
                            <MajorEconomiesTable />
                        </div>

                        <div id="sovereign-risk-matrix">
                            <SovereignRiskMatrix />
                        </div>

                        {/* Sovereign & Treasury Stress */}
                        <div id="treasury-snapshot-section">
                            <TreasurySnapshotSection />
                        </div>

                        <div id="sovereign-health-radar">
                            <SovereignHealthRadar />
                        </div>

                        {/* Major Foreign Holders */}
                        <div id="treasury-holders-section">
                            <React.Suspense fallback={<div className="h-48 bg-white/5 rounded-lg animate-pulse" />}>
                                <TreasuryHoldersSection />
                            </React.Suspense>
                        </div>

                        <ScenarioStudio />

                        {/* Paper vs Hard Currency (Special focus - sacred) */}
                        <div id="gold-valuation-strip" className="pt-8">
                            <GoldValuationStrip />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (Intel Sidebar) - Occupies 4/12 or 3/12 on large screens */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="sticky top-24 flex flex-col gap-6">
                        <div id="todays-brief">
                            <TodaysBriefPanel className="mb-0" />
                        </div>
                        <LatestMacroHeadlinesCard />

                        {/* Navigation Context Card */}
                        <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                Navigation Context
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Use the left sidebar to jump between macroeconomic themes. This sidebar follows your focus.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 15. FAQ Section for SEO/GEO */}
            <SEOFAQSection />

            {/* 16. How to Use GraphiQuestor (Relocated to bottom) */}
            <div id="how-to-use" className="mt-24">
                <React.Suspense fallback={null}>
                    <HowToUseCard />
                </React.Suspense>
            </div>
        </div >
    );
};

