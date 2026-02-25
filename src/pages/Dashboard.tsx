import React, { Suspense, lazy } from 'react';
import { Container } from '@mui/material';
import {
    Coins,
    Globe,
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
import { BlogSection } from '@/features/dashboard/components/sections/BlogSection';
import { SEOFAQSection } from '@/features/dashboard/components/sections/SEOFAQSection';
import { SEOManager } from '@/components/SEOManager';
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Row Components
import { NetLiquidityRow } from '@/features/dashboard/components/rows/NetLiquidityRow';
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const TopTreasuryHoldersTable = lazy(() => import('@/features/dashboard/components/tables/TopTreasuryHoldersTable').then(m => ({ default: m.TopTreasuryHoldersTable })));

// Lazy load feature components
const CockpitKPIGrid = lazy(() => import('@/features/dashboard/components/CockpitKPIGrid').then(m => ({ default: m.CockpitKPIGrid })));
const USMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/USMacroPulseSection').then(m => ({ default: m.USMacroPulseSection })));
const PresidentialPolicyTracker = lazy(() => import('@/features/dashboard/components/sections/PresidentialPolicyTracker').then(m => ({ default: m.PresidentialPolicyTracker })));
const GeopoliticalRiskPulseCard = lazy(() => import('../features/dashboard/components/sections/GeopoliticalRiskPulseCard').then(m => ({ default: m.GeopoliticalRiskPulseCard })));
const GeopoliticalEventsRow = lazy(() => import('../features/dashboard/components/rows/GeopoliticalEventsRow').then(m => ({ default: m.GeopoliticalEventsRow })));
const MacroEconomicCalendar = lazy(() => import('../features/dashboard/components/sections/MacroEconomicCalendar').then(m => ({ default: m.MacroEconomicCalendar })));

// Thematic Labs
const HardAssetValuationSection = lazy(() => import('@/features/dashboard/components/sections/HardAssetValuationSection').then(m => ({ default: m.HardAssetValuationSection })));
const GoldRatioRibbon = lazy(() => import('@/features/dashboard/components/sections/GoldRatioRibbon').then(m => ({ default: m.GoldRatioRibbon })));
const GlobalReserveTracker = lazy(() => import('@/features/dashboard/components/sections/GlobalReserveTracker').then(m => ({ default: m.GlobalReserveTracker })));
const TradeFlowsCard = lazy(() => import('@/features/dashboard/components/cards/TradeFlowsCard').then(m => ({ default: m.TradeFlowsCard })));
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const EnergySecuritySection = lazy(() => import('@/features/dashboard/components/sections/EnergySecuritySection').then(m => ({ default: m.EnergySecuritySection })));
const USDebtGoldBackingCard = lazy(() => import('@/features/dashboard/components/cards/USDebtGoldBackingCard').then(m => ({ default: m.USDebtGoldBackingCard })));

// Country Pulses
const IndiaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/IndiaMacroPulseSection').then(m => ({ default: m.IndiaMacroPulseSection })));
const ChinaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const InstitutionalInfluenceSection = lazy(() => import('@/features/dashboard/components/sections/InstitutionalInfluenceSection').then(m => ({ default: m.InstitutionalInfluenceSection })));
const CommodityTerminalRow = lazy(() => import('@/features/commodities/CommodityTerminalRow').then(m => ({ default: m.CommodityTerminalRow })));
const IndiaMarketPulseRow = lazy(() => import('@/features/dashboard/components/rows/IndiaMarketPulseRow').then(m => ({ default: m.IndiaMarketPulseRow })));
const CurrencyWarsMonitor = lazy(() => import('@/features/dashboard/components/rows/CurrencyWarsMonitor').then(m => ({ default: m.CurrencyWarsMonitor })));
const DeflationDebasementMonitor = lazy(() => import('@/features/dashboard/components/rows/DeflationDebasementMonitor').then(m => ({ default: m.DeflationDebasementMonitor })));
const IndiaFiscalStressMonitor = lazy(() => import('@/features/dashboard/components/rows/IndiaFiscalStressMonitor').then(m => ({ default: m.IndiaFiscalStressMonitor })));
const IndiaDebtMaturityWall = lazy(() => import('@/features/dashboard/components/rows/IndiaDebtMaturityWall').then(m => ({ default: m.IndiaDebtMaturityWall })));
const IndiaCreditCycleClock = lazy(() => import('@/features/dashboard/components/rows/IndiaCreditCycleClock').then(m => ({ default: m.IndiaCreditCycleClock })));
const RBIFXDefenseMonitor = lazy(() => import('@/features/dashboard/components/rows/RBIFXDefenseMonitor').then(m => ({ default: m.RBIFXDefenseMonitor })));
const IndiaLiquidityStressMonitor = lazy(() => import('@/features/dashboard/components/rows/IndiaLiquidityStressMonitor').then(m => ({ default: m.IndiaLiquidityStressMonitor })));
const IndiaInflationPulseMonitor = lazy(() => import('@/features/dashboard/components/rows/IndiaInflationPulseMonitor').then(m => ({ default: m.IndiaInflationPulseMonitor })));
const StateFiscalHeatmap = lazy(() => import('@/features/dashboard/components/rows/StateFiscalHeatmap').then(m => ({ default: m.StateFiscalHeatmap })));
const IndiaDigitizationPremiumMonitor = lazy(() => import('@/features/dashboard/components/rows/IndiaDigitizationPremiumMonitor').then(m => ({ default: m.IndiaDigitizationPremiumMonitor })));
const IndiaFiscalAllocationTracker = lazy(() => import('@/features/dashboard/components/rows/IndiaFiscalAllocationTracker').then(m => ({ default: m.IndiaFiscalAllocationTracker })));
const CentralBankGoldNet = lazy(() => import('@/features/dashboard/components/rows/CentralBankGoldNet').then(m => ({ default: m.CentralBankGoldNet })));
const GlobalFinancialHubsGoldGateways = lazy(() => import('@/features/dashboard/components/rows/GlobalFinancialHubsGoldGateways').then(m => ({ default: m.GlobalFinancialHubsGoldGateways })));
const YieldCurveMonitor = lazy(() => import('@/features/dashboard/components/rows/YieldCurveMonitor').then(m => ({ default: m.YieldCurveMonitor })));
const CriticalChokepointsCard = lazy(() => import('@/features/dashboard/components/rows/CriticalChokepointsCard').then(m => ({ default: m.CriticalChokepointsCard })));
const ShadowTradeCard = lazy(() => import('@/features/dashboard/components/rows/ShadowTradeCard').then(m => ({ default: m.ShadowTradeCard })));
const TradeGravityCard = lazy(() => import('@/features/dashboard/components/rows/TradeGravityCard').then(m => ({ default: m.TradeGravityCard })));
const AIComputeEnergyMonitor = lazy(() => import('@/features/dashboard/components/rows/AIComputeEnergyMonitor').then(m => ({ default: m.AIComputeEnergyMonitor })));
const EliteWealthFlightIndex = lazy(() => import('@/features/dashboard/components/rows/EliteWealthFlightIndex').then(m => ({ default: m.EliteWealthFlightIndex })));
const IllicitFlowsTracker = lazy(() => import('@/features/dashboard/components/rows/IllicitFlowsTracker').then(m => ({ default: m.IllicitFlowsTracker })));
const G20GdpPerCapitaConvergence = lazy(() => import('@/features/dashboard/components/rows/G20GdpPerCapitaConvergence').then(m => ({ default: m.G20GdpPerCapitaConvergence })));
const CorporateProfitCapture = lazy(() => import('@/features/dashboard/components/rows/CorporateProfitCapture').then(m => ({ default: m.CorporateProfitCapture })));

const LoadingFallback = () => (
    <div className="w-full min-h-[400px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
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
            <SEOManager
                title="Sovereign Intelligence Console"
                description="Institutional-grade macro dashboard tracking Debt/Gold ratios, De-Dollarization, Energy Security, and India/China Pulse. 25-year historical pipeline."
                keywords={[
                    'India Macro Pulse', 'MoSPI telemetry India', 'RBI Monetary Policy Analysis',
                    'BRICS De-Dollarization', 'Sovereign Risk Matrix', 'Global Net Liquidity',
                    'Central Bank Gold Buying', 'Yuan Internationalization', 'US Treasury Demand',
                    'Sticky Inflation Monitor', 'AI Supercycle Macro', 'Fiscal Sustainability',
                    'Currency Debasement Hedge', 'Hard Asset Valuation', 'Institutional Macro Intelligence'
                ]}
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "@id": "https://graphiquestor.com/#website",
                        "name": "GraphiQuestor",
                        "url": "https://graphiquestor.com/",
                        "description": "Institutional-grade macro intelligence dashboard.",
                        "publisher": {
                            "@type": "Organization",
                            "name": "GraphiQuestor",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://graphiquestor.com/logo.png"
                            }
                        },
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": "https://graphiquestor.com/?q={search_term_string}",
                            "query-input": "required name=search_term_string"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "Dataset",
                        "name": "Global Net Liquidity & Sovereign Debt Telemetry",
                        "description": "High-frequency macro dataset tracking G7/EM net liquidity, US Treasury maturity walls, and gold anchor ratios. 25-year historical coverage.",
                        "url": "https://graphiquestor.com/",
                        "creator": {
                            "@type": "Organization",
                            "name": "GraphiQuestor Intelligence"
                        },
                        "distribution": {
                            "@type": "DataDownload",
                            "encodingFormat": "application/json",
                            "contentUrl": "https://graphiquestor.com/api-access"
                        },
                        "keywords": ["Liquidity", "Gold", "Debt", "Macroeconomics", "India", "China"]
                    }
                ]}
                isApp={true}
            />
            <div className="space-y-24">

                {/* Per-Section JSON-LD for Crawlability — signals each hash section as a distinct WebPage */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        { "@context": "https://schema.org", "@type": "WebPage", "name": "US Debt Maturity Wall", "url": "https://graphiquestor.com/#debt-maturity-hero", "description": "Real-time visualization of US Treasury debt maturity schedule, rollover risk, and coupon rate distribution.", "isPartOf": { "@type": "WebSite", "name": "GraphiQuestor" } },
                        { "@context": "https://schema.org", "@type": "WebPage", "name": "Global Net Liquidity Signal", "url": "https://graphiquestor.com/#liquidity-hero", "description": "Fed balance sheet minus TGA and RRP — institutional net liquidity regime tracking with Z-score alerts.", "isPartOf": { "@type": "WebSite", "name": "GraphiQuestor" } },
                        { "@context": "https://schema.org", "@type": "WebPage", "name": "India Macro Pulse", "url": "https://graphiquestor.com/#india-pulse", "description": "MoSPI real-time data, India credit creation, BOP pressure, RBI FX defense, fiscal stress, and inflation pulse.", "isPartOf": { "@type": "WebSite", "name": "GraphiQuestor" } },
                        { "@context": "https://schema.org", "@type": "WebPage", "name": "Thematic Deep Dives", "url": "https://graphiquestor.com/#thematic-labs", "description": "Gold Anchor ratios, BRICS de-dollarization tracker, energy security, sovereign debt stress matrix.", "isPartOf": { "@type": "WebSite", "name": "GraphiQuestor" } },
                        { "@context": "https://schema.org", "@type": "WebPage", "name": "Sovereign Debt Stress", "url": "https://graphiquestor.com/#sovereign-debt-stress", "description": "G20 debt sustainability, credit spreads, rollover risk, and GDP per capita convergence analysis.", "isPartOf": { "@type": "WebSite", "name": "GraphiQuestor" } }
                    ])
                }} />

                {/* ROW 1: US DEBT MATURITY WALL - HERO SECTION */}
                <SPASection id="debt-maturity-hero" variant="hero" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#debt-maturity-hero" />
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none mb-4">
                            Sovereign Intelligence<br />
                            <span className="text-blue-500">Console</span>
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-2xl uppercase font-bold tracking-widest opacity-60">
                            Institutional-grade macro telemetry tracking Debt/Gold ratios, De-Dollarization, and Global Net Liquidity.
                        </p>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-6">US Debt Maturity Wall</h2>
                    <SectionErrorBoundary name="US Debt Maturity Wall">
                        <Suspense fallback={<LoadingFallback />}>
                            <USDebtMaturityWall />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="insight-debt-maturity" insight="The US Debt Maturity Wall tracks $9.2 trillion in Treasury securities rolling over within 12 months at weighted average coupon rates near 4.5%. This is the largest refinancing cycle in US history — higher-for-longer rates translate directly into accelerating interest expense, now exceeding $1 trillion annually. The coupon distribution shows a dangerous concentration of low-rate debt from 2020-2021 being repriced at current market yields." />
                </SPASection>

                {/* ROW 1.5: US TREASURY AUCTION DEMAND GAUGE */}
                <SPASection id="treasury-demand" variant="hero" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#treasury-demand" />
                    <h2 className="text-2xl font-bold text-white mb-6">Treasury Auction Demand</h2>
                    <SectionErrorBoundary name="Treasury Demand Gauge">
                        <Suspense fallback={<LoadingFallback />}>
                            <USTreasuryDemandGauge />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 1.6: TOP FOREIGN HOLDERS OF US TREASURIES */}
                <SPASection id="treasury-holders" variant="hero" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#treasury-holders" />
                    <h2 className="text-2xl font-bold text-white mb-6">Top Foreign Treasury Holders</h2>
                    <SectionErrorBoundary name="Top Treasury Holders">
                        <Suspense fallback={<LoadingFallback />}>
                            <TopTreasuryHoldersTable />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 2: GLOBAL NET LIQUIDITY SIGNAL */}
                <SPASection id="liquidity-hero" variant="hero" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#liquidity-hero" />
                    <h2 className="text-2xl font-bold text-white mb-6">Global Net Liquidity Pulse</h2>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                        <SectionHeader
                            title="Macro Heartbeat"
                            subtitle="High-frequency liquidity and regime signals"
                            sectionId="heartbeat"
                            level="h1"
                            lastUpdated={new Date().toISOString()}
                        />
                        <DataHealthTicker />
                    </div>

                    <SectionErrorBoundary name="Net Liquidity Row">
                        <Suspense fallback={<LoadingFallback />}>
                            <NetLiquidityRow />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="insight-net-liquidity" insight="Global Net Liquidity = Fed Balance Sheet − TGA − RRP. This institutional-grade formula strips out sterilized reserves to reveal the true liquidity available to risk assets. A Z-score above +1σ signals regime expansion (risk-on), while below −1σ warns of contraction. The current reading integrates daily FRED data to give a real-time pulse of the monetary plumbing that drives equity, bond, and commodity markets globally." />
                </SPASection>

                {/* ROW 3: MARKET TERMINAL GRID */}
                <SPASection id="market-pulse" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#market-pulse" />
                    <h2 className="text-2xl font-bold text-white mb-6">Market Pulse Terminal</h2>
                    <SectionErrorBoundary name="System Heartbeat">
                        <Suspense fallback={<LoadingFallback />}>
                            <CockpitKPIGrid />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 3: MACRO FLOWS (SANKEY) */}
                <SPASection id="us-macro-pulse" variant="band" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#us-macro-pulse" />
                    <h2 className="text-2xl font-bold text-white mb-6">US Macro Pulse</h2>
                    <SectionHeader
                        title="US Macro Pulse"
                        subtitle="Interstate capital and energy liquidity flow visualization"
                    />
                    <div className="mt-12">
                        <SectionErrorBoundary name="Macro Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <USMacroPulseSection />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>
                </SPASection>


                {/* ROW 3.5: INDIA MARKET MICROSTRUCTURE */}
                <SPASection id="india-market-pulse-terminal" className="bg-white/[0.01]" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#india-market-pulse-terminal" />
                    <h2 className="text-2xl font-bold text-white mb-6">India Market Pulse Terminal</h2>
                    <SectionErrorBoundary name="India Market Pulse">
                        <Suspense fallback={<LoadingFallback />}>
                            <IndiaMarketPulseRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>


                {/* ROW 4: POLICY & GEOPOLITICS */}
                <SPASection id="policy-geopolitics" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#policy-geopolitics" />
                    <h2 className="text-2xl font-bold text-white mb-6">Policy & Geopolitics</h2>
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
                            icon={<Globe className="text-blue-500" />}
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

                {/* ROW 4.5: GEOPOLITICAL MATRIX */}
                <SPASection id="geopolitical-matrix" variant="band" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#geopolitical-matrix" />
                    <h2 className="text-2xl font-bold text-white mb-6">Geopolitical Matrix</h2>
                    <SectionErrorBoundary name="Geopolitical Map">
                        <Suspense fallback={<LoadingFallback />}>
                            <GeopoliticalEventsRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 5: THEMATIC LABS */}
                <SPASection id="thematic-labs" variant="band" className="py-24" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#thematic-labs" />
                    <h2 className="text-2xl font-bold text-white mb-6">Thematic Labs</h2>
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
                            <SectionErrorBoundary name="US Debt Gold Backing">
                                <Suspense fallback={<LoadingFallback />}>
                                    <USDebtGoldBackingCard />
                                </Suspense>
                            </SectionErrorBoundary>
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

                        {/* ROW 5.1: CENTRAL BANK GOLD NET PURCHASES */}
                        <SectionErrorBoundary name="Central Bank Gold Net">
                            <Suspense fallback={<LoadingFallback />}>
                                <CentralBankGoldNet />
                            </Suspense>
                        </SectionErrorBoundary>

                        {/* ROW 5.2: GLOBAL FINANCIAL HUBS & GOLD GATEWAYS */}
                        <SectionErrorBoundary name="Global Financial Hubs">
                            <Suspense fallback={<LoadingFallback />}>
                                <GlobalFinancialHubsGoldGateways />
                            </Suspense>
                        </SectionErrorBoundary>

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
                            <link rel="canonical" href="https://graphiquestor.com/#brics-dedollarization" />
                            <h2 className="text-2xl font-bold text-white mb-6">BRICS & De-Dollarization</h2>
                            <ChartInsightSummary id="insight-brics-dedollarization" insight="This monitor tracks the structural shift in global reserves and trade settlement. It visualizes the gradual decline of USD share in global FX reserves against the systemic rise in central bank gold accumulation, specifically by BRICS+ nations. Trade misinvoicing and local currency settlement volumes provide real-time telemetry on de-dollarization momentum among emerging market 'swing states'." />
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
                            <ChartInsightSummary id="insight-energy-security" insight="The Energy Security monitor analyzes refining capacity, crude sourcing diversity, and strategic petroleum reserve (SPR) levels. High scores indicate high dependence on critical chokepoints or limited refining elasticity. The tool tracks supplier concentration risk across the G20, highlighting vulnerabilities in the global energy supply chain and institutional stockpiling behaviors." />
                        </SPAAccordion>

                        <SectionErrorBoundary name="Commodity Terminal">
                            <Suspense fallback={<LoadingFallback />}>
                                <CommodityTerminalRow />
                            </Suspense>
                        </SectionErrorBoundary>
                        <ChartInsightSummary id="insight-commodity-terminal" insight="The Commodity Terminal provides a cross-asset view of physical flow dynamics, tracking real-time price signals for major commodity baskets including Energy, Metals, and Agriculture. It integrates supply-side indicators with global shipping telemetry to identify arbitrage opportunities and inflation pass-through risks across the G20 trade network." />

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
                            <link rel="canonical" href="https://graphiquestor.com/#sovereign-debt-stress" />
                            <h2 className="text-2xl font-bold text-white mb-6">Sovereign Debt Stress Matrix</h2>
                            <ChartInsightSummary id="insight-sovereign-risk" insight="The Sovereign Risk Matrix scores G20 nations across debt/GDP, CDS spreads, and refinancing risk. Italy, Japan, and the US occupy elevated risk zones with debt/GDP above 110%. Emerging markets show a bifurcating trend — India and Indonesia demonstrate fiscal discipline, while frontier economies face widening CDS spreads. The heatmap integrates IMF fiscal monitor data with real-time credit default swap pricing." />

                            <SectionErrorBoundary name="G20 GDP Convergence">
                                <Suspense fallback={<LoadingFallback />}>
                                    <G20GdpPerCapitaConvergence />
                                </Suspense>
                            </SectionErrorBoundary>

                            <SectionErrorBoundary name="Corporate Profit Capture">
                                <Suspense fallback={<LoadingFallback />}>
                                    <CorporateProfitCapture />
                                </Suspense>
                            </SectionErrorBoundary>
                        </SPAAccordion>
                    </div>
                </SPASection>

                {/* ROW 4.5: YIELD CURVE MONITOR */}
                <SPASection id="yield-curve-monitor" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#yield-curve-monitor" />
                    <h2 className="text-2xl font-bold text-white mb-6">Yield Curve Monitor</h2>
                    <SectionErrorBoundary name="Yield Curve Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <YieldCurveMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 5.5: SPHERES OF INFLUENCE */}
                <SPASection id="spheres-of-influence" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#spheres-of-influence" />
                    <h2 className="text-2xl font-bold text-white mb-6">Spheres of Institutional Influence</h2>
                    <SectionErrorBoundary name="Spheres of Influence">
                        <Suspense fallback={<LoadingFallback />}>
                            <InstitutionalInfluenceSection />
                        </Suspense>
                    </SectionErrorBoundary>
                </SPASection>

                {/* ROW 5.6: BRICS+ vs G7 TRADE GRAVITY */}
                <SectionErrorBoundary name="Trade Gravity Shift">
                    <Suspense fallback={<LoadingFallback />}>
                        <TradeGravityCard />
                    </Suspense>
                </SectionErrorBoundary>

                {/* ROW 6: CURRENCY WARS MONITOR */}
                <SectionErrorBoundary name="Currency Wars Monitor">
                    <Suspense fallback={<LoadingFallback />}>
                        <CurrencyWarsMonitor />
                    </Suspense>
                </SectionErrorBoundary>

                {/* ROW 6.5: DEFLATION / DEBASEMENT MONITOR */}
                <SectionErrorBoundary name="Deflation Debasement Monitor">
                    <Suspense fallback={<LoadingFallback />}>
                        <DeflationDebasementMonitor />
                    </Suspense>
                </SectionErrorBoundary>

                {/* ROW 6.7: CRITICAL CHOKEPOINTS MONITOR */}
                <SectionErrorBoundary name="Critical Chokepoints Monitor">
                    <Suspense fallback={<LoadingFallback />}>
                        <CriticalChokepointsCard />
                    </Suspense>
                </SectionErrorBoundary>

                {/* ROW 6.8: SHADOW TRADE MONITOR */}
                <SectionErrorBoundary name="Shadow Trade Monitor">
                    <Suspense fallback={<LoadingFallback />}>
                        <ShadowTradeCard />
                    </Suspense>
                </SectionErrorBoundary>

                {/* ROW 6.85: ELITE OFFSHORE WEALTH FLIGHT */}
                <SectionErrorBoundary name="Elite Offshore Wealth Flight">
                    <Suspense fallback={<LoadingFallback />}>
                        <EliteWealthFlightIndex />
                    </Suspense>
                </SectionErrorBoundary>

                {/* ROW 6.87: ILLICIT FLOWS VIA TRADE MISINVOICING */}
                <SectionErrorBoundary name="Illicit Flows Tracker">
                    <Suspense fallback={<LoadingFallback />}>
                        <IllicitFlowsTracker />
                    </Suspense>
                </SectionErrorBoundary>

                {/* ROW 6.9: AI COMPUTE & ENERGY CAPEX MONITOR */}
                <SectionErrorBoundary name="AI Compute & Energy Monitor">
                    <Suspense fallback={<LoadingFallback />}>
                        <AIComputeEnergyMonitor />
                    </Suspense>
                </SectionErrorBoundary>

                {/* ROW 7: COUNTRY PULSES */}
                <SPASection id="country-pulses" className="py-24" disableAnimation>
                    <link rel="canonical" href="https://graphiquestor.com/#country-pulses" />
                    <h2 className="text-2xl font-bold text-white mb-6">Global Country Pulses</h2>
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
                            <link rel="canonical" href="https://graphiquestor.com/#india-pulse" />
                            <h2 className="text-2xl font-bold text-white mb-6">India Macro Pulse</h2>
                            <ChartInsightSummary id="insight-india-pulse" insight="India's macro pulse integrates MoSPI Industrial Production (IIP), CPI inflation tracking, credit creation velocity, and BOP pressure indicators in real-time. With domestic credit growth running above trend and inflation cooling below 4.5%, the RBI's policy stance remains pivotal. These signals capture India's unique macro position — simultaneously managing capital account liberalization, fiscal consolidation, and growth acceleration." />
                        </SPAAccordion>

                        {/* ROW 7.5: INDIA FISCAL STRESS MONITOR */}
                        <SectionErrorBoundary name="India Fiscal Stress Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaFiscalStressMonitor />
                            </Suspense>
                            <ChartInsightSummary id="insight-india-fiscal" insight="India's fiscal stress monitor tracks the interest payments-to-revenue ratio, the primary fiscal barometer for sovereign sustainability. States with high capex commitments show elevated stress readings, while the Centre's fiscal glide path targets 4.5% deficit/GDP. The interest burden at current levels consumes a rising share of gross tax revenue, making the trajectory of G-Sec yields and rollover management by RBI critically important." />
                        </SectionErrorBoundary>

                        {/* ROW 7.6: INDIA DEBT MATURITY WALL */}
                        <SectionErrorBoundary name="India Debt Maturity Wall">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaDebtMaturityWall />
                            </Suspense>
                        </SectionErrorBoundary>

                        {/* ROW 7.7: INDIA CREDIT CYCLE CLOCK */}
                        <SectionErrorBoundary name="India Credit Cycle Clock">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaCreditCycleClock />
                            </Suspense>
                        </SectionErrorBoundary>

                        {/* ROW 7.8: RBI FX DEFENSE MONITOR */}
                        <SectionErrorBoundary name="RBI FX Defense Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <RBIFXDefenseMonitor />
                            </Suspense>
                        </SectionErrorBoundary>

                        {/* ROW 7.9: INDIA LIQUIDITY STRESS MONITOR */}
                        <SectionErrorBoundary name="India Liquidity Stress Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaLiquidityStressMonitor />
                            </Suspense>
                        </SectionErrorBoundary>

                        {/* ROW 7.10: INDIA INFLATION PULSE MONITOR */}
                        <SectionErrorBoundary name="India Inflation Pulse Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaInflationPulseMonitor />
                            </Suspense>
                        </SectionErrorBoundary>

                        {/* ROW 7.11: INDIA DIGITIZATION PREMIUM MONITOR */}
                        <SectionErrorBoundary name="India Digitization Premium Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaDigitizationPremiumMonitor />
                            </Suspense>
                        </SectionErrorBoundary>

                        {/* ROW 7.12: INDIA FISCAL ALLOCATION & STATE HEATMAP */}
                        <SectionErrorBoundary name="India Fiscal Health & Allocation">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="space-y-12">
                                    <IndiaFiscalAllocationTracker />
                                    <div className="px-4 lg:px-12">
                                        <StateFiscalHeatmap />
                                    </div>
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>

                        {/* China Pulse */}
                        <SPAAccordion
                            id="china-pulse"
                            title="China Pulse"
                            subtitle="GDP, CPI, credit impulse, PBoC intervention"
                            icon={<MapPin />}
                            accentColor="rose"
                            interpretations={[
                                "PBoC Liquidity: High",
                                "Credit Impulse: Expanding",
                                "Growth Focus: Tech/Green"
                            ]}
                        >
                            <SectionErrorBoundary name="China Macro">
                                <Suspense fallback={<LoadingFallback />}>
                                    <ChinaMacroPulseSection />
                                </Suspense>
                            </SectionErrorBoundary>
                            <link rel="canonical" href="https://graphiquestor.com/#china-pulse" />
                            <h2 className="text-2xl font-bold text-white mb-6">China Macro Pulse</h2>
                        </SPAAccordion>
                    </div>
                </SPASection>

                {/* FINAL ROW: FEEDBACK & COMMUNITY */}
                <SPASection id="feedback" className="pb-12" disableAnimation>
                    <BlogSection />
                    <FeedbackSection />
                </SPASection>

                <SectionErrorBoundary name="SEO FAQ">
                    <SEOFAQSection />
                </SectionErrorBoundary>
            </div >
        </Container >
    );
};

export default Dashboard;
