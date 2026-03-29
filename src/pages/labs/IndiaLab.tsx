import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
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
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading India Signal...</span>
    </div>
);

import { SEOManager } from '@/components/SEOManager';

export const IndiaLab: React.FC = () => {
    return (
        <Container maxWidth={false} sx={{ py: 6 }}>
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
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs
                    separator={<ChevronRight size={14} className="text-muted-foreground/50" />}
                    aria-label="breadcrumb"
                >
                    <Link underline="hover" color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', tracking: '0.1em' }}>
                        Home
                    </Link>
                    <Link underline="hover" color="inherit" href="/macro-observatory" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', tracking: '0.1em' }}>
                        Observatory
                    </Link>
                    <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', tracking: '0.1em' }}>
                        India Lab
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ mb: 8 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                    <MapPin size={12} /> Emerging Market Intelligence
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    India <span className="text-blue-500">Lab</span>
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.1rem', fontWeight: 500 }}>
                    Granular telemetry on MoSPI real-time data, RBI monetary policy stance, and state-level fiscal sustainability.
                </Typography>
            </Box>

            <div className="space-y-32">
                {/* 1. Market Pulse Analytics */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Market Pulse Terminal</h2>
                    </div>
                    <SectionErrorBoundary name="India Market Pulse">
                        <Suspense fallback={<LoadingFallback />}>
                            <div className="space-y-12">
                                <IndiaMarketPulseRow />
                                <div className="pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-3 mb-8">
                                        <ArrowRightLeft className="text-blue-500" size={24} />
                                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">FII / DII Flow Monitor</h2>
                                    </div>
                                    <FIIDIIMonitorSection />
                                </div>
                            </div>
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 2. Macro Pulse (Comprehensive) */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Macro Pulse & BOP Pressure</h2>
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
                <div className="space-y-24">
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Zap className="text-amber-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Credit Cycle Clock</h2>
                        </div>
                        <SectionErrorBoundary name="India Credit Cycle Clock">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaCreditCycleClock />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <BarChart3 className="text-emerald-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">RBI FX Defense</h2>
                        </div>
                        <SectionErrorBoundary name="RBI FX Defense">
                            <Suspense fallback={<LoadingFallback />}>
                                <RBIFXDefenseMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>
                </div>

                {/* 4. Fiscal Stress & Debt */}
                <div className="space-y-24">
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="text-rose-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Fiscal Stress Monitor</h2>
                        </div>
                        <SectionErrorBoundary name="India Fiscal Stress">
                            <Suspense fallback={<LoadingFallback />}>
                                <IndiaFiscalStressMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <BarChart3 className="text-blue-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">India Debt Maturity Wall</h2>
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
                    <div className="flex items-center gap-3 mb-8">
                        <MapPin className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">State Fiscal Heatmap</h2>
                    </div>
                    <SectionErrorBoundary name="State Fiscal Heatmap">
                        <LazyRender minHeight="600px">
                            <Suspense fallback={<LoadingFallback />}>
                                <div className="space-y-12">
                                    <IndiaFiscalAllocationTracker />
                                    <StateFiscalHeatmap />
                                </div>
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* 6. Liquidity & Inflation */}
                <div className="space-y-24">
                    <section id="liquidity-monitor">
                        <div className="flex items-center gap-3 mb-8">
                            <Landmark className="text-blue-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Daily Money Market Terminal</h2>
                        </div>
                        <SectionErrorBoundary name="India Money Market">
                            <Suspense fallback={<LoadingFallback />}>
                                <RBIMoneyMarketMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="text-emerald-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Inflation Pulse</h2>
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
                    <div className="flex items-center gap-3 mb-8">
                        <Zap className="text-blue-400" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Digitization Premium</h2>
                    </div>
                    <SectionErrorBoundary name="India Digitization Premium">
                        <Suspense fallback={<LoadingFallback />}>
                            <IndiaDigitizationPremiumMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>
            </div>

            {/* SEO Structural Analysis Text Block */}
            <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Structural Analysis of India Macro Telemetry">
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6">Structural Analysis: India's Macro Resilience & Fiscal Quality</h3>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>India Lab</strong> monitors highly granular, state-level macroeconomic indicators to evaluate the fundamental structural transition of the Indian economy. Unlike traditional emerging market (EM) trackers that rely on lagging, aggregated national data, GraphiQuestor connects directly to the <a href="/glossary/mospi" className="text-blue-400 hover:underline">Ministry of Statistics and Programme Implementation (MoSPI)</a>. This zero-lag integration enables real-time observation of the Index of Industrial Production (IIP), Consumer Price Index (CPI), and capital expenditure velocities across all 28 states.
                    </p>
                    <p>
                        A critical differentiator in India's sovereign health is the quality of its fiscal expenditure. The <em>State Fiscal Heatmap</em> tracks the ratio of productive capital expenditure (Capex) against recurring revenue expenditure (subsidies and freebies). States demonstrating high Capex velocity generally command a lower structural risk premium and drive the nation's broader industrial upgrading capacity.
                    </p>
                    <p>
                        Furthermore, the Lab actively monitors the Reserve Bank of India's (RBI) FX defense posture. By combining Balance of Payments (BOP) pressure gauges with <a href="/glossary/stealth-qe" className="text-blue-400 hover:underline">liquidity stress monitors</a>, institutional investors can pinpoint precise entry and exit windows for Indian equities and sovereign debt, insulated from short-term narrative noise.
                    </p>
                </div>
            </article>

            <Box sx={{ mt: 12, pt: 8, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <Button
                    variant="text"
                    startIcon={<ArrowLeft size={18} />}
                    href="/macro-observatory"
                    sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 900, '&:hover': { color: 'white' } }}
                >
                    Back to Observatory
                </Button>
            </Box>
        </Container>
    );
};

export default IndiaLab;
