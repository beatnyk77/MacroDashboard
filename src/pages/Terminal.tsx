import React, { Suspense, lazy, useRef } from 'react';
import { SEOManager } from '@/components/SEOManager';
import { BrandConfig } from '@/config/brandConfig';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

// Components — above-fold, always eager
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';
import { SectionLoadingFallback } from '@/components/SectionLoadingFallback';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
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
import { StartExploringSection } from '@/features/dashboard/components/StartExploringSection';
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

export const Terminal: React.FC = () => {
    const netLiquidityRef = useRef<HTMLDivElement>(null);
    const fedMonetizationRef = useRef<HTMLDivElement>(null);
    const usDebtRef = useRef<HTMLDivElement>(null);

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
                        "@type": "Organization",
                        "name": BrandConfig.name,
                        "@id": `${BrandConfig.baseUrl}/#organization`,
                        "url": BrandConfig.baseUrl,
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
                    }
                ]}
            />

            <TerminalHero />

            <InstitutionalAccessStrip className="mb-8" />

            <ChinaLocaleHint className="mb-8" />

            <StartExploringSection />

            <PremiumActionBar className="mb-8" />

            <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                <M2GoldRatioExplorer className="mb-8" />
            </Suspense>

            <ValueProgressionPath className="mb-10" />

            <div id="weekly-narrative" className="mb-10">
                <SubscribeCard source="homepage-hero" />
            </div>

            {/* ── REGIME ANCHOR — position 0, above-fold interpretive frame ── */}
            {/* Full-bleed: uses negative margins to break out of px-4 sm:px-6 lg:px-8 */}
            <div className="w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] -mx-4 sm:-mx-6 lg:-mx-8 mb-0">
                <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                    <RegimeAnchor />
                </Suspense>
            </div>

            <div className="flex flex-col pb-32">
                {/* Row 1: DAILY REGIME SIGNAL */}
                <ModuleRow label="REGIME SIGNAL" href="/regime-digest">
                    <SectionErrorBoundary name="Daily Macro Layer">
                        <DailyMacroPanel />
                    </SectionErrorBoundary>
                </ModuleRow>

                {/* Row 2: LIVE INTELLIGENCE FEED */}
                <ModuleRow label="LIVE BRIEF" href="/regime-digest" alternateBg>
                    <SectionErrorBoundary name="Intelligence Feed">
                        <TodaysBriefPanel />
                    </SectionErrorBoundary>
                </ModuleRow>

                <div className="mb-8 px-1">
                    <SubscribeCard source="homepage-midfold" />
                </div>

                {/* Row 3: GLOBAL LIQUIDITY COMPOSITE */}
                <ModuleRow
                    label="GLOBAL LIQUIDITY"
                    badge={<GQSignalBadge href="/methods/net-liquidity-z-score" />}
                >
                    <SectionErrorBoundary name="Global Liquidity Monitor">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <GlobalLiquidityMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </ModuleRow>

                {/* Row 4: US NET LIQUIDITY PROXY */}
                <ModuleRow
                    label="NET LIQUIDITY PROXY"
                    badge={<GQSignalBadge href="/methods/net-liquidity-z-score" />}
                    alternateBg
                >
                    <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} />}>
                    <SectionErrorBoundary name="Net Liquidity">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <div ref={netLiquidityRef} className="relative group">
                                <ShareButton targetRef={netLiquidityRef} title="US Net Liquidity Proxy" dataSource="FRED / Treasury" href="/labs/us-macro-fiscal" />
                                <Card variant="elevated">
                                    <CardHeader className="flex flex-row justify-between items-center border-b border-white/5 pb-4 mb-6">
                                        <div>
                                            <CardTitle className="text-base font-semibold tracking-heading">US Net Liquidity Proxy</CardTitle>
                                            <p className="section-label mt-1">Monetary Base & Treasury General Account Telemetry</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Link to="/methods/net-liquidity-z-score" className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">Methodology →</Link>
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
                <ModuleRow label="FED MONETIZATION" href="/labs/us-macro-fiscal" labelColor="text-rose-500/80">
                    <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} />}>
                    <SectionErrorBoundary name="Fed Monetization Monitor">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <div ref={fedMonetizationRef} className="relative group">
                                <ShareButton targetRef={fedMonetizationRef} title="Fed Monetization Monitor" dataSource="FRED" href="/labs/us-macro-fiscal" />
                                <Card variant="elevated">
                                    <CardHeader className="flex flex-row justify-between items-center mb-6 border-b border-white/5 pb-4">
                                        <CardTitle className="text-base font-semibold tracking-heading">Fed Monetization Monitor</CardTitle>
                                        <div className="flex items-center gap-4">
                                            <Link to="/methods/fiscal-dominance-meter" className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">Methodology →</Link>
                                            <MetricFreshnessChip metricId={MID.FED_BALANCE_SHEET} sourceLabel="FRED" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <FedMonetizationMonitor />
                                    </CardContent>
                                </Card>
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 6: TREASURY AUCTION DEMAND */}
                <ModuleRow label="AUCTION DEMAND" href="/labs/us-macro-fiscal" labelColor="text-rose-500/80" alternateBg>
                    <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} />}>
                    <SectionErrorBoundary name="Auction Demand Gauge">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <Card variant="elevated">
                                <CardHeader className="flex flex-row justify-between items-center mb-6 border-b border-white/5 pb-4">
                                    <CardTitle className="text-base font-semibold tracking-heading">Auction Demand Gauge</CardTitle>
                                    <MetricFreshnessChip metricId={MID.PRIMARY_DEALER_TREASURY_HOLDINGS_BN} sourceLabel="Treasury" />
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
                    </LazyRender>
                </ModuleRow>

                {/* Row 7: US DEBT MATURITY WALL */}
                <ModuleRow label="US DEBT WALL" href="/labs/us-macro-fiscal" labelColor="text-rose-500/80">
                    <LazyRender minHeight="250px" fallback={<SectionLoadingFallback minHeight={250} />}>
                    <SectionErrorBoundary name="US Debt Maturity Wall">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <div ref={usDebtRef} className="relative group">
                                <ShareButton targetRef={usDebtRef} title="US Debt Maturity Wall" dataSource="Treasury" href="/labs/us-macro-fiscal" />
                                <USDebtMaturityWall />
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 8: CORPORATE DEBT MATURITY WALL */}
                <ModuleRow label="CORP DEBT WALL" href="/labs/us-macro-fiscal" labelColor="text-rose-500/80" alternateBg>
                    <LazyRender minHeight="250px" fallback={<SectionLoadingFallback minHeight={250} />}>
                    <SectionErrorBoundary name="Corporate Debt Maturity Wall">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <CorporateDebtMaturityWall />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 9: TREASURY YIELD SNAPSHOT */}
                <ModuleRow label="TREASURY YIELD" href="/labs/us-macro-fiscal" labelColor="text-rose-500/80">
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
                <ModuleRow label="ENERGY MARKETS" href="/labs/energy-commodities" labelColor="text-orange-500/80" alternateBg>
                    <LazyRender minHeight="400px" fallback={<SectionLoadingFallback minHeight={400} />}>
                    <SectionErrorBoundary name="Energy & Commodities">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <EnergySection />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 11: INDIA CREDIT CYCLE */}
                <ModuleRow
                    label="CREDIT CYCLE"
                    href="/intel/india"
                    badge={<GQSignalBadge href="/methods/india-credit-cycle-clock" />}
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
                <ModuleRow label="CHINA PULSE" href="/intel/china" labelColor="text-red-500/80" alternateBg>
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
                <ModuleRow label="AFRICA MACRO" href="/labs/africa-macro" labelColor="text-amber-500/80">
                    <LazyRender minHeight="250px" fallback={<SectionLoadingFallback minHeight={250} />}>
                    <SectionErrorBoundary name="Africa Macro Snapshot">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <AfricaMacroSnapshot />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 16: SOVEREIGN RISK MATRIX */}
                <ModuleRow label="SOVEREIGN RISK" href="/countries" labelColor="text-blue-500/80" alternateBg>
                    <LazyRender minHeight="400px" fallback={<SectionLoadingFallback minHeight={400} />}>
                    <SectionErrorBoundary name="Sovereign Risk Matrix">
                        <Suspense fallback={<SectionLoadingFallback minHeight={200} />}>
                            <SovereignRiskMatrix />
                        </Suspense>
                    </SectionErrorBoundary>
                    </LazyRender>
                </ModuleRow>

                {/* Row 17: COUNTRY PORTALS */}
                <ModuleRow label="COUNTRY PORTALS" href="/countries" labelColor="text-blue-500/80">
                    <LazyRender minHeight="200px" fallback={<SectionLoadingFallback minHeight={200} />}>
                    <SectionErrorBoundary name="Country Intelligence">
                        <Card variant="elevated" className="relative overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-lg uppercase font-black">Country Intelligence Terminals</CardTitle>
                                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-uppercase mt-1">Deep-dive macro profiles for 40+ sovereigns</p>
                            </CardHeader>
                            <CardContent>
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
                    </LazyRender>
                </ModuleRow>
            </div>
            <div className="mb-10">
                <SubscribeCard source="homepage-prefooter" />
            </div>

            <RelatedMetrics minLinks={2} />

            <RelatedContent variant="grid" className="mt-8" />
        </div>
    );
};

export default Terminal;
