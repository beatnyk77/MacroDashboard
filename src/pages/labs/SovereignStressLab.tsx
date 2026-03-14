import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    ShieldAlert,
    TrendingUp,
    Zap,
    Activity
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Lazy loaded components
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const YieldCurveMonitor = lazy(() => import('@/features/dashboard/components/rows/YieldCurveMonitor').then(m => ({ default: m.YieldCurveMonitor })));
const CorporateProfitCapture = lazy(() => import('@/features/dashboard/components/rows/CorporateProfitCapture').then(m => ({ default: m.CorporateProfitCapture })));
const GritIndexMonitor = lazy(() => import('@/features/dashboard/components/sections/GritIndexMonitor').then(m => ({ default: m.GritIndexMonitor })));
const Distress401kMonitor = lazy(() => import('@/features/dashboard/components/rows/Distress401kMonitor').then(m => ({ default: m.Distress401kMonitor })));
const USLaborMarketMonitor = lazy(() => import('@/features/dashboard/components/rows/USLaborMarketMonitor').then(m => ({ default: m.USLaborMarketMonitor })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Stress Signal...</span>
    </div>
);

export const SovereignStressLab: React.FC = () => {
    return (
        <Container maxWidth={false} sx={{ py: 6 }}>
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
                        Sovereign Stress
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ mb: 8 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                    <ShieldAlert size={12} /> Fiscal Sustainability Monitor
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    Sovereign <span className="text-purple-500">Stress</span> Lab
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.2rem', fontWeight: 500 }}>
                    Monitoring G20 debt sustainability, interest-to-revenue ratios, and the structural widening of sovereign credit default swaps.
                </Typography>
            </Box>

            <div className="space-y-32">
                {/* 1. GRIT Index Monitor */}
                <section id="grit-monitor" className="scroll-mt-32">
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-emerald-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">GRIT Index Monitor</h2>
                    </div>
                    <SectionErrorBoundary name="GRIT Index">
                        <Suspense fallback={<LoadingFallback />}>
                            <GritIndexMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 2. Sovereign Risk Matrix */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-purple-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Sovereign Risk Matrix</h2>
                    </div>
                    <SectionErrorBoundary name="Sovereign Risk">
                        <Suspense fallback={<LoadingFallback />}>
                            <SovereignRiskMatrix />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-sovereign-risk" insight="The G20 Risk Matrix scores nations on debt/GDP, CDS spreads, and refinancing pressure. Current readings highlight Japan and Italy as structural outliers in the developed market universe." />
                </section>

                {/* 2. Yield Curve Monitor */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-blue-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Yield Curve Dynamics</h2>
                    </div>
                    <SectionErrorBoundary name="Yield Curve">
                        <Suspense fallback={<LoadingFallback />}>
                            <YieldCurveMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 3. Corporate Profit Capture */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Corporate Profit Capture</h2>
                    </div>
                    <SectionErrorBoundary name="Corporate Profit">
                        <Suspense fallback={<LoadingFallback />}>
                            <CorporateProfitCapture />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 4. 401(k) Distress Monitor */}
                <section id="401k-distress" className="scroll-mt-32">
                    <div className="flex items-center gap-3 mb-10">
                        <ShieldAlert className="text-rose-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">401(k) Distress Monitor</h2>
                    </div>
                    <SectionErrorBoundary name="401(k) Distress">
                        <Suspense fallback={<LoadingFallback />}>
                            <Distress401kMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-401k-distress" insight="The 401(k) Distress Monitor tracks hardship withdrawals and loan activity as a leading indicator of consumer exhaustion. Spikes in these levels historically precede broad-based recessionary shifts." />
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Activity size={24} className="text-blue-400" />
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'white' }}>US Labor Supply & Demand</Typography>
                    </div>
                    <SectionErrorBoundary name="Labor Market Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <USLaborMarketMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-labor-market" insight="Real-time monitoring of US Labor statistics via BLS/FRED. The proprietary Labor Distress Index combines claims, layoffs, and quit ratios to provide a high-fidelity recession lead signal." />
                </section>
            </div>

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

export default SovereignStressLab;
