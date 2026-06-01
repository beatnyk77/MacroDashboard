import React, { Suspense, lazy } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Lazy loaded components for heavy charts
const USDebtGoldBackingCard = lazy(() => import('@/features/dashboard/components/cards/USDebtGoldBackingCard').then(m => ({ default: m.USDebtGoldBackingCard })));
const CentralBankGoldNet = lazy(() => import('@/features/dashboard/components/rows/CentralBankGoldNet').then(m => ({ default: m.CentralBankGoldNet })));
const GlobalReserveTracker = lazy(() => import('@/features/dashboard/components/sections/GlobalReserveTracker').then(m => ({ default: m.GlobalReserveTracker })));
const PetrodollarVsPetroyuan = lazy(() => import('@/features/dashboard/components/sections/PetrodollarVsPetroyuan').then(m => ({ default: m.PetrodollarVsPetroyuan })));
const GoldOilRevaluationScenario = lazy(() => import('@/features/dashboard/components/sections/GoldOilRevaluationScenario').then(m => ({ default: m.GoldOilRevaluationScenario })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Loading Telemetry...</span>
    </div>
);

export const DeDollarizationGuide: React.FC = () => {
    return (
        <>
            <SEOManager
                title="The Ultimate Guide to Global De-Dollarization & BRICS Currencies (2026)"
                description="An institutional-grade analysis of global de-dollarization, central bank gold purchases, petrodollar decay, and the structural fragmentation of settlement networks."
                keywords={['de-dollarization', 'BRICS currency', 'reserve currency shift', 'central bank gold', 'petrodollar', 'US fiscal dominance']}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        'headline': 'The Ultimate Guide to Global De-Dollarization & BRICS Currency Dynamics 2026',
                        'author': {
                            '@type': 'Organization',
                            'name': 'GraphiQuestor Macro Intelligence Unit'
                        },
                        'publisher': {
                            '@type': 'Organization',
                            'name': 'GraphiQuestor'
                        },
                        'url': 'https://graphiquestor.com/methods/de-dollarization-guide'
                    }
                ]}
            />

            <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
                {/* Breadcrumbs */}
                <div className="mb-8">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <a href="/" className="hover:text-white transition-colors">Home</a>
                        <ChevronRight size={10} />
                        <a href="/labs/de-dollarization-gold" className="hover:text-white transition-colors">De-Dollarization Lab</a>
                        <ChevronRight size={10} />
                        <span className="text-amber-500">Methodology Guide</span>
                    </nav>
                </div>

                {/* Header */}
                <div className="mb-16 border-b border-white/10 pb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-6">
                        Institutional Macro Strategy
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6 leading-none">
                        The Ultimate Guide to Global <span className="text-amber-500">De-Dollarization</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-3xl">
                        Tracking the structural fragmentation of global settlement networks, the pricing of sovereign counterparty risk, and the rotation toward hard-asset liquidity.
                    </p>
                </div>

                {/* Content Body */}
                <article className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-amber-500 hover:prose-a:text-amber-400">
                    
                    <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-12">
                        <h3 className="text-amber-500 mt-0">Executive Summary & Key Takeaways</h3>
                        <p className="text-sm">The structural decoupling of the global financial system is no longer a theoretical tail risk; it is an active, measurable regime shift. "De-dollarization" does not imply the immediate collapse of the US Dollar as the primary global reserve currency. Rather, it represents the fragmentation of settlement networks and a sovereign rotation toward hard-asset liquidity.</p>
                        <ul className="text-sm font-medium">
                            <li><strong>The Geopolitical Risk Premium is Permanent:</strong> The 2022 freezing of Russian FX reserves irrevocably altered sovereign risk calculus.</li>
                            <li><strong>Gold as the Sovereign Anchor:</strong> Central bank gold accumulation is a structural reconstitution of Tier 1 capital, driven by aggressive fiat debasement (indicated by the Debt/Gold Z-Score).</li>
                            <li><strong>Fiscal Dominance Accelerates the Shift:</strong> US interest expense is structurally impeding the Federal Reserve's ability to supply non-inflationary global liquidity.</li>
                            <li><strong>Commodity Pricing Bifurcation:</strong> The expiration of historical Petrodollar agreements is disrupting the Eurodollar's monopoly on energy trade.</li>
                        </ul>
                    </div>

                    <h2>1. The Anatomy of a Reserve Regime Shift</h2>
                    <p>
                        For seven decades, the US Dollar maintained hegemony through a self-reinforcing flywheel: global commodities were priced in USD, necessitating deep offshore dollar liquidity (Eurodollars), which in turn created structural demand for US Treasuries as the ultimate risk-free collateral to clear trades.
                    </p>
                    <p>
                        This architecture is currently fracturing along two fault lines: <strong>Weaponized Interdependence</strong> and <strong>Fiscal Dominance</strong>.
                    </p>

                    <h3>1.1 Weaponized Interdependence and the Hard-Asset Pivot</h3>
                    <p>
                        When financial infrastructure is utilized to enact geopolitical objectives, neutral nations must inherently diversify. The response from the Global South—led by the PBoC and RBI—has been a historic pivot to physical gold.
                    </p>
                    <p>
                        We monitor this via the <strong>Debt/Gold Z-Score</strong>, which normalizes sovereign debt issuance against physical gold reserves. A rising Z-Score indicates aggressive fiat debasement, prompting central banks to aggressively buy gold to maintain the purchasing power of their reserve portfolios.
                    </p>

                    <div className="my-12 not-prose p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                        <SectionErrorBoundary name="Debt/Gold Context">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <USDebtGoldBackingCard />
                                    <CentralBankGoldNet />
                                </div>
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <h3>1.2 US Fiscal Dominance & Net Liquidity Constraints</h3>
                    <p>
                        A reserve currency requires a sovereign balance sheet capable of absorbing global trade surpluses. However, the US is entering a regime of "Fiscal Dominance"—where massive, structural fiscal deficits overwhelm monetary policy. As foreign buyers retreat, domestic institutions must absorb the debt, forcing the Federal Reserve to inject liquidity to prevent yield curve dislocation.
                    </p>

                    <div className="my-12 not-prose p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                        <SectionErrorBoundary name="Global Reserves">
                            <Suspense fallback={<LoadingFallback />}>
                                <GlobalReserveTracker />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <h2>2. The Energy-Settlement Bifurcation</h2>
                    <p>
                        The true test of a reserve currency is its utility in settling critical, inelastic commodities. The rise of the Petroyuan—driven by China's status as the marginal buyer of global energy—is the most significant structural threat to the Eurodollar system.
                    </p>

                    <h3>2.1 The Petrodollar vs. Petroyuan Shift</h3>
                    <p>
                        The structural decay of the Petrodollar system is accelerating as major energy exporters increasingly accept bilateral local currency trades. We track the divergence between USD-priced crude and physical energy flows settling outside the SWIFT network. Furthermore, the <strong>Gold/Oil Ratio</strong> reveals profound arbitrage opportunities emerging as BRICS nations implicitly price energy in ounces of gold rather than dollars.
                    </p>

                    <div className="my-12 not-prose space-y-8">
                        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                            <SectionErrorBoundary name="Petrodollar Tracker">
                                <Suspense fallback={<LoadingFallback />}>
                                    <PetrodollarVsPetroyuan />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                            <SectionErrorBoundary name="Gold Oil Ratio">
                                <Suspense fallback={<LoadingFallback />}>
                                    <GoldOilRevaluationScenario />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                    </div>

                    <h2>3. Investment Implications & Macro Scenarios</h2>
                    <p>
                        For institutional allocators, navigating this regime shift requires abandoning the assumption of a unipolar financial system.
                    </p>
                    
                    <h4>Scenario A: Managed Fragmentation (Base Case - 65% Probability)</h4>
                    <ul>
                        <li><strong>Dynamics:</strong> A multi-polar currency system emerges gradually. The USD remains dominant for financial asset pricing, but commodity trade increasingly settles in local currencies.</li>
                        <li><strong>Allocation:</strong> Overweight physical gold and real assets. Reduce duration on US Treasuries; shift sovereign debt allocation toward fiscally sound emerging markets.</li>
                    </ul>

                    <h4>Scenario B: Accelerated Decoupling (Tail Risk - 25% Probability)</h4>
                    <ul>
                        <li><strong>Dynamics:</strong> A severe geopolitical shock forces an immediate, hard fork of the global financial system. BRICS+ nations default to a gold-backed settlement unit.</li>
                        <li><strong>Allocation:</strong> Maximum allocation to hard commodities and energy infrastructure. Extreme volatility in US Treasury yields necessitates aggressive Yield Curve Control (YCC).</li>
                    </ul>

                    <h2>4. How to Use GraphiQuestor for Telemetry</h2>
                    <p>
                        GraphiQuestor provides the raw intelligence required to front-run these macroeconomic shifts. We do not forecast; we observe structural reality.
                    </p>
                    <ul>
                        <li><a href="/labs/de-dollarization-gold">De-Dollarization & Gold Lab</a>: Monitor real-time changes in the Debt/Gold Z-Score and central bank accumulation.</li>
                        <li><a href="/labs/central-bank-gold-purchases">Gold Purchases Tracker</a>: Deep dive into sovereign gold flows.</li>
                        <li><a href="/labs/us-treasury-foreign-holdings">US Treasury Foreign Holdings</a>: Track the shifting buyer base for US sovereign debt.</li>
                    </ul>
                </article>

                <div className="mt-24 pt-12 border-t border-white/10 text-center">
                    <Button
                        variant="outline"
                        className="font-black uppercase tracking-widest text-amber-500 border-amber-500/20 hover:bg-amber-500/10"
                        asChild
                    >
                        <a href="/labs/de-dollarization-gold" className="flex items-center gap-2">
                            <ArrowLeft size={16} /> Explore the De-Dollarization Lab
                        </a>
                    </Button>
                </div>
            </div>
        </>
    );
};
