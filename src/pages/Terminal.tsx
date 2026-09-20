import React, { Suspense, lazy, useRef } from 'react';
import { SEOManager } from '@/components/SEOManager';
import { BrandConfig, PublisherOrganizationSchema } from '@/config/brandConfig';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrailLink as Link } from '@/components/TrailLink';
// Components — above-fold, always eager
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';
import { SectionLoadingFallback } from '@/components/SectionLoadingFallback';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { useMetricsBatch } from '@/hooks/useMetricsBatch';

import { DailyMacroPanel } from '@/features/daily-macro/components/DailyMacroPanel';
import { TodaysBriefPanel } from '@/features/dashboard/components/sections/TodaysBriefPanel';
import { ModuleRow } from '@/components/layout/ModuleRow';
import { GQSignalBadge } from '@/components/GQSignalBadge';
import { LazyRender } from '@/components/LazyRender';
import { ShareButton } from '@/components/ShareButton';


import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { SubscribeCard } from '@/components/SubscribeCard';
import { TerminalHero } from '@/features/dashboard/components/TerminalHero';
import { TerminalSnapshotStrip } from '@/features/dashboard/components/TerminalSnapshotStrip';
import { MacroTransmissionHUD } from '@/features/dashboard/components/MacroTransmissionHUD';
import { ScenarioShockSimulator } from '@/features/dashboard/components/ScenarioShockSimulator';
import { DeskContextStrip } from '@/features/dashboard/components/DeskContextStrip';

import { PremiumActionBar } from '@/components/engagement/PremiumActionBar';
import { ValueProgressionPath } from '@/components/engagement/ValueProgressionPath';
import { InstitutionalAccessStrip } from '@/components/growth/InstitutionalAccessStrip';
import { ChinaLocaleHint } from '@/components/growth/ChinaLocaleHint';

const M2GoldRatioExplorer = lazy(() =>
    import('@/components/engagement/M2GoldRatioExplorer').then((m) => ({ default: m.M2GoldRatioExplorer }))
);

const RegimeAnchor = lazy(() =>
    import('@/features/dashboard/components/RegimeAnchor').then(m => ({ default: m.RegimeAnchor }))
);

// Components — below-fold, lazy-loaded
const MarketTransmissionModule = lazy(() =>
    import('@/features/market-transmission/components/MarketTransmissionModule').then(m => ({ default: m.MarketTransmissionModule }))
);
const NetLiquidityRow = lazy(() => import('@/features/dashboard/components/rows/NetLiquidityRow').then(m => ({ default: m.NetLiquidityRow })));
const USDebtMaturityWall = lazy(() => import('@/components/USDebtMaturityWall').then(m => ({ default: m.USDebtMaturityWall })));
const CorporateDebtMaturityWall = lazy(() => import('@/components/CorporateDebtMaturityWall').then(m => ({ default: m.CorporateDebtMaturityWall })));
const FedMonetizationMonitor = lazy(() => import('@/features/dashboard/components/rows/FedMonetizationMonitor').then(m => ({ default: m.FedMonetizationMonitor })));
const EnergySection = lazy(() => import('@/features/dashboard/components/sections/EnergySection').then(m => ({ default: m.EnergySection })));
// 1. LIQUIDITY & FLOWS
const GlobalLiquidityMonitor = lazy(() => import('@/features/dashboard/components/sections/GlobalLiquidityMonitor').then(m => ({ default: m.GlobalLiquidityMonitor })));

// 2. SOVEREIGN STRESS
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const TreasurySnapshotSection = lazy(() => import('@/features/dashboard/components/sections/TreasurySnapshotSection').then(m => ({ default: m.TreasurySnapshotSection })));

// 3. REGIONAL & MACRO
const ChinaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const IndiaCreditCycleClock = lazy(() => import('@/features/dashboard/components/rows/IndiaCreditCycleClock').then(m => ({ default: m.IndiaCreditCycleClock })));
// IndiaMacroDashboard removed — fabricated snapshot producer (credibility sprint)
const AfricaMacroSnapshot = lazy(() => import('@/features/dashboard/components/sections/AfricaMacroSnapshot').then(m => ({ default: m.AfricaMacroSnapshot })));
const COTSqueezeRadarCard = lazy(() => import('@/components/COTSqueezeRadarCard').then(m => ({ default: m.COTSqueezeRadarCard })));
const CrossAssetRadarCard = lazy(() => import('@/components/CrossAssetRadarCard').then(m => ({ default: m.CrossAssetRadarCard })));
const FinancialConditionsCard = lazy(() => import('@/features/financial-conditions/components/FinancialConditionsCard').then(m => ({ default: m.FinancialConditionsCard })));
const InfiniteFAQ = lazy(() => import('@/components/faq/InfiniteFAQ').then(m => ({ default: m.InfiniteFAQ })));


export const Terminal: React.FC = () => {
    const netLiquidityRef = useRef<HTMLDivElement>(null);
    const fedMonetizationRef = useRef<HTMLDivElement>(null);
    const usDebtRef = useRef<HTMLDivElement>(null);

    // Prefetch the above-fold metric chips in 2 bulk queries instead of 2N individual ones.
    // This seeds the TanStack Query cache so MetricFreshnessChip / useLatestMetric calls
    // return instantly without additional network round-trips.
    useMetricsBatch([
        MID.FED_BALANCE_SHEET,
        MID.TGA_BALANCE,
        MID.PRIMARY_DEALER_TREASURY_HOLDINGS_BN,
    ]);

    return (
        <div className="w-full min-h-screen py-6">
            <SEOManager
                title="Global Macro Intelligence Terminal"
                description={BrandConfig.seo.defaultDescription}
                keywords={['macro intelligence', 'global liquidity', 'sovereign stress', 'india macro', 'china macro', 'financial terminal']}
                isApp={true}
                jsonLd={[
                    {
                        "@context": "https://schema.org",
                        "@id": `${BrandConfig.baseUrl}/#organization`,
                        ...PublisherOrganizationSchema,
                        "description": "Macro intelligence terminal tracking global liquidity, sovereign stress, and India/China macro."
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": BrandConfig.name,
                        "url": BrandConfig.baseUrl,
                        "description": "Macro Observatory for the Multipolar Era",
                        "publisher": {
                            "@id": `${BrandConfig.baseUrl}/#organization`
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "DataCatalog",
                        "@id": `${BrandConfig.baseUrl}/#datacatalog`,
                        "name": `${BrandConfig.name} Macro Intelligence Data Catalog`,
                        "url": BrandConfig.baseUrl,
                        "description": "Institutional repository of real-time macroeconomic time-series, sovereign solvency indicators, and central bank balance sheet telemetry.",
                        "publisher": { "@id": `${BrandConfig.baseUrl}/#organization` },
                        "dataset": [
                            {
                                "@type": "Dataset",
                                "name": "US Net Liquidity Proxy",
                                "description": "Federal Reserve Balance Sheet (WALCL) minus Treasury General Account (TGA) and Overnight Reverse Repo (RRP) facility.",
                                "url": `${BrandConfig.baseUrl}/methods/net-liquidity-z-score/`,
                                "isAccessibleForFree": true,
                                "variableMeasured": ["WALCL", "WTREGEN", "RRPONTSYD", "Net Liquidity Proxy"]
                            },
                            {
                                "@type": "Dataset",
                                "name": "US Debt Maturity Wall & Treasury Auction Absorption",
                                "description": "Schedule of marketable US Treasury maturities by tenor and primary dealer auction absorption scores.",
                                "url": `${BrandConfig.baseUrl}/labs/us-macro-fiscal`,
                                "isAccessibleForFree": true,
                                "variableMeasured": ["Treasury Debt Maturities", "Bid-to-Cover Ratio", "Dealer Absorption"]
                            },
                            {
                                "@type": "Dataset",
                                "name": "Global M2 to Gold Valuation Model",
                                "description": "Cross-border broad money supply vs. physical gold stock valuation and monetary dilution ratios.",
                                "url": `${BrandConfig.baseUrl}/methods/m2-gold-ratio/`,
                                "isAccessibleForFree": true,
                                "variableMeasured": ["Global M2", "Gold Spot Price", "M2/Gold Ratio"]
                            },
                            {
                                "@type": "Dataset",
                                "name": "India Credit Cycle & Banking CD Ratio",
                                "description": "Bank credit growth YoY, aggregate deposit growth YoY, and system credit-to-deposit ratio telemetry.",
                                "url": `${BrandConfig.baseUrl}/intel/india/`,
                                "isAccessibleForFree": true,
                                "variableMeasured": ["Bank Credit Growth", "Deposit Growth", "CD Ratio", "RBI Liquidity"]
                            },
                            {
                                "@type": "Dataset",
                                "name": "China Macro Pulse & PBOC Telemetry",
                                "description": "High-frequency real economy indicators, credit impulse, 1Y LPR, and foreign exchange reserves.",
                                "url": `${BrandConfig.baseUrl}/intel/china/`,
                                "isAccessibleForFree": true,
                                "variableMeasured": ["China GDP", "Credit Impulse", "1Y LPR", "FX Reserves"]
                            }
                        ]
                    }
                ]}
            />

            <TerminalHero />

            {/* E4: build-time key telemetry for crawlers + live hydrate */}
            <TerminalSnapshotStrip />

            {/* ── ALADDIN 4-PILLAR MACRO TRANSMISSION SWITCHBOARD ── */}
            <MacroTransmissionHUD />

            {/* ── MARKET TRANSMISSION & BREADTH (FINVIZFINANCE ENGINE) ── */}
            <Suspense fallback={<SectionLoadingFallback label="Market Transmission & Breadth" />}>
                <MarketTransmissionModule className="mb-8" />
            </Suspense>

            {/* ── FACTOR SENSITIVITY & SCENARIO SHOCK SIMULATOR ── */}
            <ScenarioShockSimulator />

            <DeskContextStrip />

            {/* ── FEATURED RESEARCH SILO ── */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-4 bg-card border-y border-border mb-6 shadow-sm">
                <Link to="/methods/m2-gold-ratio" className="text-sm font-semibold text-amber-500 hover:underline">
                    Featured: Global M2 to Gold Ratio Tracker
                </Link>
                <span className="text-border">|</span>
                <Link to="/labs/central-bank-gold-purchases" className="text-sm font-semibold text-amber-500 hover:underline">
                    Central Bank Gold Purchases
                </Link>
                <span className="text-border">|</span>
                <Link to="/labs/macro-precedents" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Macro Precedents & Benchmarks
                </Link>
            </div>

            {/* ── REGIME ANCHOR — position 1, first data above-fold ── */}
            {/* Full-bleed: uses negative margins to break out of px-4 sm:px-6 lg:px-8 */}
            <div className="w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] -mx-4 sm:-mx-6 lg:-mx-8 mb-0">
                <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                    <RegimeAnchor />
                </Suspense>
            </div>

            <div className="flex flex-col pb-32">
                {/* Row 0: CROSS-ASSET MACRO RADAR & REGIME PLAYBOOK */}
                <ModuleRow id="cross-asset-radar" label="MACRO RADAR" labelColor="text-cyan-400">
                    <LazyRender minHeight="450px" fallback={<SectionLoadingFallback minHeight={450} />}>
                    <SectionErrorBoundary name="Cross-Asset Macro Radar">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <CrossAssetRadarCard />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 1: DAILY REGIME SIGNAL */}
                <ModuleRow label="REGIME SIGNAL" href="/regime-digest/" alternateBg>
                    <SectionErrorBoundary name="Daily Macro Layer">
                        <DailyMacroPanel />
                    </SectionErrorBoundary>
                </ModuleRow>


                {/* Row 2: LIVE INTELLIGENCE FEED */}
                <ModuleRow label="LIVE BRIEF" href="/regime-digest/" alternateBg>
                    <SectionErrorBoundary name="Intelligence Feed">
                        <TodaysBriefPanel />
                    </SectionErrorBoundary>
                </ModuleRow>

                {/* ── GROWTH STRIP — after first 2 data rows so users get value first ── */}
                <div className="px-1 pb-2 pt-6 space-y-4">
                    <ChinaLocaleHint className="" />
                    <InstitutionalAccessStrip className="" />
                    <PremiumActionBar className="" />
                </div>


                {/* Row 3: GLOBAL LIQUIDITY COMPOSITE */}
                <ModuleRow
                    label="GLOBAL LIQUIDITY"
                    badge={<GQSignalBadge href="/methods/net-liquidity-z-score/" />}
                >
                    <SectionErrorBoundary name="Global Liquidity Monitor">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <GlobalLiquidityMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </ModuleRow>

                {/* Row 4: US NET LIQUIDITY PROXY */}
                <ModuleRow
                    id="net-liquidity"
                    label="NET LIQUIDITY PROXY"
                    badge={<GQSignalBadge href="/methods/net-liquidity-z-score/" />}
                    alternateBg
                >
                    <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} />}>
                    <SectionErrorBoundary name="Net Liquidity">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <div ref={netLiquidityRef} className="relative group">
                                <ShareButton targetRef={netLiquidityRef} title="US Net Liquidity Proxy" dataSource="FRED / Treasury" href="/labs/us-macro-fiscal/" />
                                <Card variant="elevated">
                                    <CardHeader className="flex flex-row justify-between items-center border-b border-border pb-4 mb-6">
                                        <div>
                                            <CardTitle className="text-base font-semibold tracking-heading">US Net Liquidity Proxy</CardTitle>
                                            <p className="section-label mt-1">Monetary Base & Treasury General Account Telemetry</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Link to="/methods/net-liquidity-z-score" className="text-xs text-amber-700 dark:text-amber-400 hover:underline transition-colors">Methodology →</Link>
                                            <MetricFreshnessChip metricId={MID.FED_BALANCE_SHEET} sourceLabel="FRED / Treasury" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <NetLiquidityRow />
                                    </CardContent>
                                </Card>
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 5: FED MONETIZATION MONITOR */}
                <ModuleRow id="fed-monetization" label="FED MONETIZATION" href="/labs/us-macro-fiscal/" labelColor="text-rose-500/80">
                    <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} />}>
                    <SectionErrorBoundary name="Fed Monetization Monitor">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <div ref={fedMonetizationRef} className="relative group">
                                <ShareButton targetRef={fedMonetizationRef} title="Fed Monetization Monitor" dataSource="FRED" href="/labs/us-macro-fiscal/" />
                                <FedMonetizationMonitor />
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 6: TREASURY AUCTION DEMAND */}
                <ModuleRow id="auction-demand" label="AUCTION DEMAND" href="/labs/us-macro-fiscal/" labelColor="text-rose-500/80" alternateBg>
                    <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} />}>
                    <SectionErrorBoundary name="Auction Demand Gauge">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <USTreasuryDemandGauge />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 7: US DEBT MATURITY WALL */}
                <ModuleRow label="US DEBT WALL" href="/labs/us-macro-fiscal/" labelColor="text-rose-500/80">
                    <LazyRender minHeight="250px" fallback={<SectionLoadingFallback minHeight={250} />}>
                    <SectionErrorBoundary name="US Debt Maturity Wall">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <div ref={usDebtRef} className="relative group">
                                <ShareButton targetRef={usDebtRef} title="US Debt Maturity Wall" dataSource="Treasury" href="/labs/us-macro-fiscal/" />
                                <USDebtMaturityWall />
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 8: CORPORATE DEBT MATURITY WALL */}
                <ModuleRow label="CORP DEBT WALL" href="/labs/us-macro-fiscal/" labelColor="text-rose-500/80" alternateBg>
                    <LazyRender minHeight="250px" fallback={<SectionLoadingFallback minHeight={250} />}>
                    <SectionErrorBoundary name="Corporate Debt Maturity Wall">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <CorporateDebtMaturityWall />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 9: TREASURY YIELD SNAPSHOT */}
                <ModuleRow id="treasury-yield" label="TREASURY YIELD" href="/labs/us-macro-fiscal/" labelColor="text-rose-500/80">
                    <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} />}>
                    <SectionErrorBoundary name="Treasury Snapshot">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <Card variant="elevated">
                                <CardContent>
                                    <TreasurySnapshotSection />
                                </CardContent>
                            </Card>
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 10: ENERGY MARKETS */}
                <ModuleRow id="energy-markets" label="ENERGY MARKETS" href="/labs/energy-commodities/" labelColor="text-orange-500/80" alternateBg>
                    <LazyRender minHeight="400px" fallback={<SectionLoadingFallback minHeight={400} />}>
                    <SectionErrorBoundary name="Energy & Commodities">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <EnergySection />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 10b: CFTC COT POSITIONING & SQUEEZE RADAR */}
                <ModuleRow id="cot-positioning" label="COT POSITIONING" labelColor="text-cyan-700 dark:text-cyan-400">
                    <LazyRender minHeight="350px" fallback={<SectionLoadingFallback minHeight={350} />}>
                    <SectionErrorBoundary name="COT Positioning Radar">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <COTSqueezeRadarCard />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 11: INDIA CREDIT CYCLE */}
                <ModuleRow id="credit-cycle"
                    label="CREDIT CYCLE"
                    href="/intel/india/"
                    badge={<GQSignalBadge href="/methods/india-credit-cycle-clock/" />}

                    labelColor="text-amber-500/80"
                    alternateBg
                >
                    <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} />}>
                    <SectionErrorBoundary name="India Credit Cycle">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <IndiaCreditCycleClock />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 14: CHINA MACRO PULSE */}
                <ModuleRow id="china-pulse" label="CHINA PULSE" href="/intel/china/" labelColor="text-red-500/80" alternateBg>
                    <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} />}>
                    <SectionErrorBoundary name="China Macro Pulse">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <Card variant="elevated">
                                <CardContent>
                                    <ChinaMacroPulseSection />
                                </CardContent>
                            </Card>
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 15: AFRICA MACRO */}
                <ModuleRow label="AFRICA MACRO" href="/labs/africa-macro/" labelColor="text-amber-500/80">
                    <LazyRender minHeight="250px" fallback={<SectionLoadingFallback minHeight={250} />}>
                    <SectionErrorBoundary name="Africa Macro Snapshot">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <AfricaMacroSnapshot />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 16: SOVEREIGN RISK MATRIX */}
                <ModuleRow id="sovereign-risk" label="SOVEREIGN RISK" href="/labs/sovereign-stress" labelColor="text-blue-500/80" alternateBg>
                    <LazyRender minHeight="400px" fallback={<SectionLoadingFallback minHeight={400} />}>
                    <SectionErrorBoundary name="Sovereign Risk Matrix">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <SovereignRiskMatrix />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 16.5: FINANCIAL CONDITIONS */}
                <ModuleRow id="financial-conditions" label="FINANCIAL CONDITIONS" href="/labs/financial-conditions" labelColor="text-orange-500/80">
                    <LazyRender minHeight="300px" fallback={<SectionLoadingFallback minHeight={300} />}>
                    <SectionErrorBoundary name="Financial Conditions Lab">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <FinancialConditionsCard />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 17: REGIONAL HUBS */}
                <ModuleRow label="REGIONAL HUBS" href="/labs" labelColor="text-blue-500/80">
                    <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} />}>
                    <SectionErrorBoundary name="Regional Intelligence">
                        <Card variant="elevated" className="relative overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-lg uppercase font-black">Regional Intelligence Hubs</CardTitle>
                                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-uppercase mt-1">Deep-dive macroeconomic telemetry & sovereign stress labs</p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {[
                                        { label: 'United States', flag: '🇺🇸', href: '/labs/us-macro-fiscal' },
                                        { label: 'China Macro', flag: '🇨🇳', href: '/intel/china' },
                                        { label: 'India Macro', flag: '🇮🇳', href: '/intel/india' },
                                        { label: 'Africa Pulse', flag: '🌍', href: '/labs/africa-macro' },
                                        { label: 'Sovereign Stress', flag: '🛡️', href: '/labs/sovereign-stress' },
                                    ].map(item => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className="group p-4 rounded-lg bg-card border border-border hover:bg-muted/50 hover:border-primary/40 transition-all duration-200 shadow-sm"
                                        >
                                            <div className="text-2xl mb-2">{item.flag}</div>
                                            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {item.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground/60 mt-1">
                                                Explore Hub →
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-10">
                <LazyRender minHeight="500px" fallback={<SectionLoadingFallback minHeight={500} />}>
                    <SectionErrorBoundary name="Infinite FAQ">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <InfiniteFAQ 
                                title="Institutional RAG Terminal"
                                subtitle="Ask domain-specific questions against our live macro datasets and methodology documentation."
                            />
                        </Suspense>
                    </SectionErrorBoundary>
                </LazyRender>
            </div>

            <div className="mb-10 mt-8">
                <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                    <div className="mb-6">
                        <M2GoldRatioExplorer />
                    </div>
                </Suspense>
                <ValueProgressionPath className="mb-6" />

                {/* Pre-footer subscribe — id keeps header Subscribe button scroll-anchor working */}
                <div id="weekly-narrative">
                    <SubscribeCard source="homepage-prefooter" />
                </div>
            </div>

            <RelatedMetrics minLinks={2} />

            <RelatedContent variant="grid" className="mt-8" />
        </div>
    );
};

export default Terminal;
