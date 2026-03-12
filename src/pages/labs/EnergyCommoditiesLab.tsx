import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    Fuel,
    Zap,
    Activity,
    Globe,
    Ship
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Lazy loaded components
const SovereignEnergySecuritySection = lazy(() => import('@/features/dashboard/components/sections/SovereignEnergySecuritySection').then(m => ({ default: m.SovereignEnergySecuritySection })));
const AsiaCommodityFlowsSection = lazy(() => import('@/features/dashboard/components/sections/AsiaCommodityFlowsSection').then(m => ({ default: m.AsiaCommodityFlowsSection })));
const CommodityTerminalRow = lazy(() => import('@/features/commodities/CommodityTerminalRow').then(m => ({ default: m.CommodityTerminalRow })));
const AIComputeEnergyMonitor = lazy(() => import('@/features/dashboard/components/rows/AIComputeEnergyMonitor').then(m => ({ default: m.AIComputeEnergyMonitor })));
const GeopoliticalRiskMap = lazy(() => import('@/features/dashboard/components/maps/GeopoliticalRiskMap').then(m => ({ default: m.GeopoliticalRiskMap })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Energy Signal...</span>
    </div>
);

export const EnergyCommoditiesLab: React.FC = () => {
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
                        Energy & Commodities
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Intro / How to Use This Lab */}
            <Box sx={{ mb: 12 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                    <Fuel size={12} /> Institutional Resource Security
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    Energy & <span className="text-blue-500">Commodities</span>
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.2rem', fontWeight: 500, mb: 4 }}>
                    Analyzing global physical flow dynamics, refining capacity elasticity, and the energy intensity of the AI compute supercycle.
                </Typography>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 max-w-4xl">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 border-b border-white/10 pb-2 inline-block">How to use this Lab</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        This environment translates physical commodity constraints into sovereign vulnerability metrics.
                        <strong> Start by assessing the US strategic stockpile (SPR) and refining limits.</strong> Then, trace the molecular shift of Russian and Middle Eastern crude eastward to Asia to understand inflation divergence. Finally, monitor the physical bottlenecks of the AI revolution via power demand.
                    </p>
                </div>
            </Box>

            <div className="space-y-32">
                {/* 1. Sovereign Energy Security */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Globe className="text-blue-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Sovereign Energy Security</h2>
                    </div>

                    <div className="w-full">
                        <SectionErrorBoundary name="Sovereign Energy Security">
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignEnergySecuritySection />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="mt-8 p-6 bg-blue-500/5 border-l-4 border-blue-500 rounded-r-2xl max-w-4xl">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 block mb-2">So What? — Institutional Insight</span>
                        <p className="text-sm text-white/80 leading-relaxed">
                            National security is inextricably linked to refining elasticity. The depletion of the SPR combined with aging infrastructure leaves Western economies highly vulnerable to supply shocks. Concurrently, the EU gas storage levels dictate the winter industrial shutdown probabilities, actively altering core inflation forecasts.
                        </p>
                    </div>
                </section>

                {/* 2. Asia Energy & Commodity Flows */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Ship className="text-emerald-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Asia Energy & Commodity Flows</h2>
                    </div>

                    <div className="w-full">
                        <SectionErrorBoundary name="Asia Commodity Flows">
                            <Suspense fallback={<LoadingFallback />}>
                                <AsiaCommodityFlowsSection />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="mt-8 p-6 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-2xl max-w-4xl">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 block mb-2">So What? — Institutional Insight</span>
                        <p className="text-sm text-white/80 leading-relaxed">
                            The "shadow" fleet and redirection of heavily sanctioned crude have created a massive structural cost advantage for Indian refiners and Chinese industrials. By tracking import pain points (FX vs. Brent correlation), we can identify early capitulation risks in emerging markets dependent on dollar-priced energy imports.
                        </p>
                    </div>
                </section>

                {/* 2.5 Geopolitical Risk: Hormuz Tanker Tracking */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Ship className="text-blue-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Hormuz Tanker Tracking</h2>
                    </div>

                    <div className="w-full">
                        <SectionErrorBoundary name="Hormuz Tracking">
                            <Suspense fallback={<LoadingFallback />}>
                                <GeopoliticalRiskMap />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="mt-8 p-6 bg-blue-500/5 border-l-4 border-blue-500 rounded-r-2xl max-w-4xl">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 block mb-2">So What? — Institutional Insight</span>
                        <p className="text-sm text-white/80 leading-relaxed">
                            Monitoring the Strait of Hormuz in real-time allows for the detection of "grey zone" maritime activity. Significant deviations in tanker frequency or insurance risk premiums directly impact the Energy Intensity metrics of the global industrial base.
                        </p>
                    </div>
                </section>

                {/* 3. Physical Flows Terminal */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Physical Flows Terminal</h2>
                    </div>

                    <div className="w-full">
                        <SectionErrorBoundary name="Commodity Terminal">
                            <Suspense fallback={<LoadingFallback />}>
                                <CommodityTerminalRow />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="mt-8 p-6 bg-amber-500/5 border-l-4 border-amber-500 rounded-r-2xl max-w-4xl">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 block mb-2">So What? — Institutional Insight</span>
                        <p className="text-sm text-white/80 leading-relaxed">
                            This acts as the live ticker for physical stress. Instead of paper markets, tracking the physical delivery networks for critical metals (like Copper and REMs) explicitly fronts the demand impulses of clean tech and defense manufacturing, bypassing financialization noise.
                        </p>
                    </div>
                </section>

                {/* 4. AI Compute & Energy CAPEX */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-indigo-400" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">AI Compute & Energy CAPEX</h2>
                    </div>

                    <div className="w-full">
                        <SectionErrorBoundary name="AI Energy Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <AIComputeEnergyMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </div>

                    <div className="mt-8 p-6 bg-indigo-500/5 border-l-4 border-indigo-500 rounded-r-2xl max-w-4xl">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 block mb-2">So What? — Institutional Insight</span>
                        <p className="text-sm text-white/80 leading-relaxed">
                            The Shale Analogy is playing out in real-time. Unprecedented hyperscaler CAPEX is colliding with the physical realities of grid capacity and transformer backlogs. Tracking server energy intensity vs hardware rental costs reveals exactly when oversupply hits the inference layer, while base-load power remains the ultimate bottleneck.
                        </p>
                    </div>
                </section>
            </div>

            <Box sx={{ mt: 16, pt: 8, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
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

export default EnergyCommoditiesLab;
