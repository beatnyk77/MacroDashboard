import React, { Suspense, lazy } from 'react';
import {
    ChevronRight,
    ArrowLeft,
    TrendingUp,
    MapPin,
    Zap,
    Activity,
    BarChart3,
    Landmark,
    ArrowRightLeft
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { LazyRender } from '@/components/LazyRender';
import { SEOManager } from '@/components/SEOManager';
import { Button } from '@/components/ui/button';

// Lazy loaded components
const IndiaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/IndiaMacroPulseSection').then(m => ({ default: m.IndiaMacroPulseSection })));
const IndiaMarketPulseRow = lazy(() => import('@/features/dashboard/components/rows/IndiaMarketPulseRow').then(m => ({ default: m.IndiaMarketPulseRow })));
const FIIDIIMonitorSection = lazy(() => import('@/features/dashboard/components/sections/FIIDIIMonitorSection').then(m => ({ default: m.FIIDIIMonitorSection })));
const IndiaFiscalStressMonitor = lazy(() => import('@/features/dashboard/components/rows/IndiaFiscalStressMonitor').then(m => ({ default: m.IndiaFiscalStressMonitor })));
const IndiaDebtMaturityWall = lazy(() => import('@/features/dashboard/components/rows/IndiaDebtMaturityWall').then(m => ({ default: m.IndiaDebtMaturityWall })));
const IndiaCreditCycleClock = lazy(() => import('@/features/dashboard/components/rows/IndiaCreditCycleClock').then(m => ({ default: m.IndiaCreditCycleClock })));
const RBIFXDefenseMonitor = lazy(() => import('@/features/dashboard/components/rows/RBIFXDefenseMonitor').then(m => ({ default: m.RBIFXDefenseMonitor })));
const RBIMoneyMarketMonitor = lazy(() => import('@/features/dashboard/components/sections/RBIMoneyMarketMonitor').then(m => ({ default: m.RBIMoneyMarketMonitor })));
const IndiaInflationPulseMonitor = lazy(() => import('@/features/dashboard/components/rows/IndiaInflationPulseMonitor').then(m => ({ default: m.IndiaInflationPulseMonitor })));
const IndiaDigitizationPremiumMonitor = lazy(() => import('@/features/dashboard/components/rows/IndiaDigitizationPremiumMonitor').then(m => ({ default: m.IndiaDigitizationPremiumMonitor })));
const IndiaFiscalAllocationTracker = lazy(() => import('@/features/dashboard/components/rows/IndiaFiscalAllocationTracker').then(m => ({ default: m.IndiaFiscalAllocationTracker })));
const StateFiscalHeatmap = lazy(() => import('@/features/dashboard/components/rows/StateFiscalHeatmap').then(m => ({ default: m.StateFiscalHeatmap })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading India Signal...</span>
    </div>
);

export const IndiaLab: React.FC = () => {
    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
            <SEOManager
                title="India Macro Pulse | Institutional Economic Monitor"
                description="Comprehensive real-time monitoring of India's macroeconomic health, DPI integration, and state-capex resilience. High-frequency data for institutional investors."
                keywords={['India Macro', 'Nifty 500 Fundamentals', 'India Economy Pulse', 'India Data Dashboard', 'Structural India']}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Dataset",
                    "name": "India Macro Resilience Index",
                    "description": "High-frequency activity monitor for the Indian economy, tracking formalization and fiscal health.",
                    "publisher": {
                        "@type": "Organization",
                        "name": "GraphiQuestor"
                    }
                }}
            />
            {/* Breadcrumbs */}
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <ChevronRight size={10} />
                    <a href="/macro-observatory" className="hover:text-white transition-colors">Observatory</a>
                    <ChevronRight size={10} />
                    <span className="text-blue-500">India Lab</span>
                </nav>
            </div>

            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <MapPin size={12} /> Emerging Market Intelligence
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    India <span className="text-blue-500">Lab</span>
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    Granular telemetry on MoSPI real-time data, RBI monetary policy stance, and state-level fiscal sustainability.
                </p>
            </div>

            <div className="space-y-32">
                {/* 1. Market Pulse Analytics */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Market Pulse Terminal</h2>
                    </div>
                    <SectionErrorBoundary name="India Market Pulse">
                        <Suspense fallback={<LoadingFallback />}>
                            <div className="space-y-16">
                                <IndiaMarketPulseRow />
                                <div className="pt-12 border-t border-white/5">
                                    <div className="flex items-center gap-3 mb-10">
                                        <ArrowRightLeft className="text-blue-400" size={28} />
                                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">FII / DII Flow Monitor</h2>
                                    </div>
                                    <FIIDIIMonitorSection />
                                </div>
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 2. Macro Pulse (Comprehensive) */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Macro Pulse & BOP Pressure</h2>
                    </div>
                    <SectionErrorBoundary name="India Macro Pulse">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaMacroPulseSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-india-macro" insight="India's macro pulse integrates IIP, CPI, and capital account flows. Real-time BOP pressure metrics track the structural resilience of the 'India Stack' economy." />
                </section>

                {/* 3. Monetary & Credit Cycle */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <Zap className="text-amber-500" size={28} />
                            <h2 className="text-xl font-black uppercase tracking-heading text-white">Credit Cycle Clock</h2>
                        </div>
                        <SectionErrorBoundary name="India Credit Cycle Clock">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaCreditCycleClock />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <BarChart3 className="text-emerald-500" size={28} />
                            <h2 className="text-xl font-black uppercase tracking-heading text-white">RBI FX Defense</h2>
                        </div>
                        <SectionErrorBoundary name="RBI FX Defense">
                            <Suspense fallback={<LoadingFallback />}>
                                <RBIFXDefenseMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>
                </div>

                {/* 4. Fiscal Stress & Debt */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <Activity className="text-rose-500" size={28} />
                            <h2 className="text-xl font-black uppercase tracking-heading text-white">Fiscal Stress Monitor</h2>
                        </div>
                        <SectionErrorBoundary name="India Fiscal Stress">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaFiscalStressMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <BarChart3 className="text-blue-500" size={28} />
                            <h2 className="text-xl font-black uppercase tracking-heading text-white">India Debt Maturity Wall</h2>
                        </div>
                        <SectionErrorBoundary name="India Debt Maturity Wall">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaDebtMaturityWall />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>
                </div>

                {/* 5. State-Level Fiscal Health */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <MapPin className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">State Fiscal Heatmap</h2>
                    </div>
                    <SectionErrorBoundary name="State Fiscal Heatmap">
                        <LazyRender minHeight="600px">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="space-y-16">
                                    <IndiaFiscalAllocationTracker />
                                    <StateFiscalHeatmap />
                                </div>
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* 6. Liquidity & Inflation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <section id="liquidity-monitor">
                        <div className="flex items-center gap-3 mb-10">
                            <Landmark className="text-blue-500" size={28} />
                            <h2 className="text-xl font-black uppercase tracking-heading text-white">Daily Money Market Terminal</h2>
                        </div>
                        <SectionErrorBoundary name="India Money Market">
                            <Suspense fallback={<LoadingFallback />}>
                                <RBIMoneyMarketMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <Activity className="text-emerald-500" size={28} />
                            <h2 className="text-xl font-black uppercase tracking-heading text-white">Inflation Pulse</h2>
                        </div>
                        <SectionErrorBoundary name="India Inflation Pulse">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaInflationPulseMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>
                </div>

                {/* 7. Digitization Premium */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-blue-400" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Digitization Premium</h2>
                    </div>
                    <SectionErrorBoundary name="India Digitization Premium">
                        <Suspense fallback={<LoadingFallback />}>
                            <IndiaDigitizationPremiumMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>
            </div>

            {/* SEO Structural Analysis Text Block */}
            <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-[2.5rem]" aria-label="Structural Analysis of India Macro Telemetry">
                <h3 className="text-xl font-black text-white uppercase tracking-uppercase mb-8">Structural Analysis: India's Macro Resilience & Fiscal Quality</h3>
                <div className="space-y-6 text-sm text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-wide">
                    <p>
                        The <strong>India Lab</strong> monitors highly granular, state-level macroeconomic indicators to evaluate the fundamental structural transition of the Indian economy. Unlike traditional emerging market (EM) trackers that rely on lagging, aggregated national data, GraphiQuestor connects directly to the <a href="/glossary/mospi" className="text-blue-400 hover:underline transition-colors">Ministry of Statistics and Programme Implementation (MoSPI)</a>. This zero-lag integration enables real-time observation of the Index of Industrial Production (IIP), Consumer Price Index (CPI), and capital expenditure velocities across all 28 states.
                    </p>
                    <p>
                        A critical differentiator in India's sovereign health is the quality of its fiscal expenditure. The <em>State Fiscal Heatmap</em> tracks the ratio of productive capital expenditure (Capex) against recurring revenue expenditure (subsidies and freebies). States demonstrating high Capex velocity generally command a lower structural risk premium and drive the nation's broader industrial upgrading capacity.
                    </p>
                    <p>
                        Furthermore, the Lab actively monitors the Reserve Bank of India's (RBI) FX defense posture. By combining Balance of Payments (BOP) pressure gauges with <a href="/glossary/stealth-qe" className="text-blue-400 hover:underline transition-colors">liquidity stress monitors</a>, institutional investors can pinpoint precise entry and exit windows for Indian equities and sovereign debt, insulated from short-term narrative noise.
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

export default IndiaLab;
