import React, { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import {
    ChevronRight,
    ArrowLeft,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Zap,
    BarChart3,
    Activity
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { Card, CardContent } from '@/components/ui/card';

// Components
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { USFiscalDominanceMeter } from '@/components/USFiscalDominanceMeter';
import { LazyRender } from '@/components/LazyRender';

// Lazy loaded components
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const TreasuryHoldersSection = lazy(() => import('@/features/dashboard/components/sections/TreasuryHoldersSection').then(m => ({ default: m.TreasuryHoldersSection })));
const OffshoreDollarStressCard = lazy(() => import('@/features/dashboard/components/sections/OffshoreDollarStressCard').then(m => ({ default: m.OffshoreDollarStressCard })));
const USMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/USMacroPulseSection').then(m => ({ default: m.USMacroPulseSection })));
const CorporateTreasuryHedgingSection = lazy(() => import('@/features/dashboard/components/sections/CorporateTreasuryHedgingSection').then(m => ({ default: m.CorporateTreasuryHedgingSection })));
const USFiscalComparisonChart = lazy(() => import('@/features/dashboard/components/rows/USFiscalComparisonChart'));
const PresidentialPolicyTracker = lazy(() => import('@/features/dashboard/components/sections/PresidentialPolicyTracker').then(m => ({ default: m.PresidentialPolicyTracker })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Signal...</span>
    </div>
);

export const USMacroFiscalLab: React.FC = () => {
    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <ChevronRight size={10} />
                    <a href="/macro-observatory" className="hover:text-white transition-colors">Observatory</a>
                    <ChevronRight size={10} />
                    <span className="text-blue-500">US Macro & Fiscal</span>
                </nav>
            </div>

            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <Zap size={12} /> Core Sovereign Telemetry
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    US Macro & Fiscal <span className="text-blue-500">Lab</span>
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-base md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    Tracking the structural debt dynamics, treasury demand vectors, and fiscal policy impact of the world's reserve currency issuer.
                </p>
            </div>

            <div className="space-y-32">
                {/* Section 1: Debt Maturity Wall */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">US Debt Maturity Wall</h2>
                    </div>
                    <SectionErrorBoundary name="US Debt Maturity Wall">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USDebtMaturityWall />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-debt-maturity" insight="The maturity wall tracks $9.2T in rolling securities. The 2025-2027 window represents a critical refinancing regime where low-coupon pandemic-era debt is re-priced at structurally higher market yields." />
                </section>

                {/* Section 2: US Fiscal Dominance Meter */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className="text-red-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">US Fiscal Dominance Meter</h2>
                    </div>
                    <SectionErrorBoundary name="US Fiscal Dominance Meter">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USFiscalDominanceMeter />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-fiscal-dominance" insight="Fiscal dominance occurs when mandatory spending (interest + entitlements) consumes over 100% of tax receipts, forcing the Treasury to issue additional debt for operations and structurally raising market dependency on central bank monetization. Historically unprecedented in peacetime — this signal defines the transition to a regime of monetary-fiscal fusion." />
                </section>

                {/* Section 3: Treasury Demand */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Zap className="text-amber-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Auction Demand</h2>
                    </div>
                    <SectionErrorBoundary name="Treasury Demand Gauge">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USTreasuryDemandGauge />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 2.5: Offshore Dollar Stress */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Zap className="text-rose-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Offshore Dollar Funding Stress</h2>
                    </div>
                    <SectionErrorBoundary name="Offshore Dollar Stress">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<LoadingFallback />}>
                                <OffshoreDollarStressCard />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 3: Foreign Holders */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldAlert className="text-emerald-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Foreign Holders</h2>
                    </div>
                    <SectionErrorBoundary name="Top Treasury Holders">
                        <LazyRender minHeight="700px">
                            <Suspense fallback={<LoadingFallback />}>
                                <TreasuryHoldersSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 4: US Fiscal Comparison */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-indigo-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Defense vs Interest</h2>
                    </div>
                    <SectionErrorBoundary name="US Fiscal Comparison">
                        <LazyRender minHeight="400px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USFiscalComparisonChart />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-fiscal-comp" insight="Net interest payments on US federal debt have risen from $250B to over $1T annually, now rivaling the total national defense budget – a structural shift with profound implications for fiscal policy flexibilty." />
                </section>

                {/* Section 5: US Macro Pulse (Sankey) */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-blue-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-heading text-white">Capital & Energy Liquidity Flows</h2>
                        </div>
                    </div>
                    <SectionErrorBoundary name="US Macro Pulse">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<LoadingFallback />}>
                                <USMacroPulseSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 6: Corporate Treasury Hedging */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldCheck className="text-emerald-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Hedging Opportunities</h2>
                    </div>
                    <SectionErrorBoundary name="Corporate Hedging monitor">
                        <LazyRender minHeight="400px">
                            <Suspense fallback={<LoadingFallback />}>
                                <CorporateTreasuryHedgingSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 7: Policy Tracker */}
                <section className="pt-12 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldAlert className="text-rose-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Trump Action Monitor</h2>
                    </div>
                    <SectionErrorBoundary name="Policy Tracker">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<LoadingFallback />}>
                                <PresidentialPolicyTracker />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 8: Equity Fundamental Pulse Card */}
                <section>
                    <Card variant="elevated" className="border-blue-500/10 bg-gradient-to-br from-blue-500/[0.05] to-transparent p-1">
                        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-12 p-8 md:p-12">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <BarChart3 className="text-blue-400" size={32} />
                                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-heading text-white">US Equity Fundamental Pulse</h2>
                                </div>
                                <p className="text-muted-foreground/60 text-base md:text-lg font-medium leading-relaxed mb-8 uppercase tracking-wide max-w-2xl">
                                    Deep macro-to-corporate correlation engine. Analyze how sovereign debt dynamics and policy shifts impact US corporate margins, valuation tiers, and institutional positioning through official SEC EDGAR telemetry.
                                </p>
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl px-6 py-2 shadow-[0_0_30px_rgba(37,99,235,0.2)]"
                                >
                                    <a href="/us-equities">Launch Equities Terminal</a>
                                </Button>
                            </div>
                            
                            <div className="w-full md:flex-1 grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Valuation Tiers', sub: 'P/E Heatmaps' },
                                    { label: 'Insider Ops', sub: 'Conviction Feed' },
                                    { label: 'Leverage Pulse', sub: 'Debt/Equity' },
                                    { label: 'Whale Tracking', sub: '13F Holdings' }
                                ].map((item, i) => (
                                    <Card key={i} variant="metric" className="p-4 bg-white/[0.02] border-white/5 group hover:border-blue-500/20 transition-colors">
                                        <span className="block text-[10px] font-black text-blue-400 uppercase tracking-uppercase mb-1">{item.label}</span>
                                        <span className="block text-xs font-bold text-white/40 group-hover:text-white/60 transition-colors uppercase">{item.sub}</span>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>

            {/* SEO Structural Analysis Text Block */}
            <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Structural Analysis of US Fiscal Trajectory">
                <h3 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Structural Analysis: The US Fiscal Trajectory & Sovereign Debt</h3>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>US Macro & Fiscal Lab</strong> provides high-frequency telemetry on the structural constraints facing the United States Treasury and the Federal Reserve. Over the past decade, the reliance on short-term debt issuance (Treasury Bills) has created a significant <em>maturity wall</em>, forcing the sovereign to constantly refinance obligations rather than lock in long-term capital.
                    </p>
                    <p>
                        Our predictive telemetry indicates that as interest expense on the national debt supersedes major discretionary categories (such as defense spending), the likelihood of <strong>fiscal dominance</strong> increases. Fiscal dominance occurs when the central bank is forced to subordinate its inflation target to maintain the solvency of the government, often leading to <a href="/glossary/stealth-qe" className="text-blue-400 hover:underline">Stealth QE</a> or Yield Curve Control (YCC). By tracking <em>Treasury Auction Demand Metrics</em> natively through GraphiQuestor, institutional participants can monitor the exact inflection point of buyer exhaustion.
                    </p>
                    <p>
                        Simultaneously, the <a href="/glossary/tga" className="text-blue-400 hover:underline">Treasury General Account (TGA)</a> and the Overnight Reverse Repo Facility (RRP) act as critical hydraulic valves for global liquidity. By synthesizing direct data feeds from the Federal Reserve Economic Data (FRED) API with our custom capital flow Sankey architectures, analysts can isolate the precise velocity at which liquidity is injected or drained from risk assets.
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
    );
};

export default USMacroFiscalLab;
