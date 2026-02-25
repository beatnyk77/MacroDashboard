import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    Fuel,
    Zap,
    Activity,
    Globe
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Lazy loaded components
const EnergySecuritySection = lazy(() => import('@/features/dashboard/components/sections/EnergySecuritySection').then(m => ({ default: m.EnergySecuritySection })));
const CommodityTerminalRow = lazy(() => import('@/features/commodities/CommodityTerminalRow').then(m => ({ default: m.CommodityTerminalRow })));
const CriticalChokepointsCard = lazy(() => import('@/features/dashboard/components/rows/CriticalChokepointsCard').then(m => ({ default: m.CriticalChokepointsCard })));
const AIComputeEnergyMonitor = lazy(() => import('@/features/dashboard/components/rows/AIComputeEnergyMonitor').then(m => ({ default: m.AIComputeEnergyMonitor })));

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

            <Box sx={{ mb: 8 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                    <Fuel size={12} /> Resource Security Telemetry
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    Energy & <span className="text-blue-500">Commodities</span>
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.2rem', fontWeight: 500 }}>
                    Analyzing global physical flow dynamics, refining capacity elastcity, and the energy intensity of the AI compute supercycle.
                </Typography>
            </Box>

            <div className="space-y-24">
                {/* 1. Energy Security Section */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Globe className="text-blue-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Sovereign Energy Security</h2>
                    </div>
                    <SectionErrorBoundary name="Energy Security">
                        <Suspense fallback={<LoadingFallback />}>
                            <EnergySecuritySection />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-energy-security" insight="Energy security scoring integrates crude sourcing diversity and SPR levels. Red regimes indicate high dependence on critical chokepoints (Strait of Malacca/Hormuz) without sufficient refining redundancy." />
                </section>

                {/* 2. Commodity Terminal */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-amber-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Physical Flow Terminal</h2>
                    </div>
                    <SectionErrorBoundary name="Commodity Terminal">
                        <Suspense fallback={<LoadingFallback />}>
                            <CommodityTerminalRow />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* 3. Chokepoints & AI Compute */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <Zap className="text-amber-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Critical Chokepoints</h2>
                        </div>
                        <SectionErrorBoundary name="Critical Chokepoints">
                            <Suspense fallback={<LoadingFallback />}>
                                <CriticalChokepointsCard />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-10">
                            <Zap className="text-blue-400" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">AI Compute & Energy Capex</h2>
                        </div>
                        <SectionErrorBoundary name="AI Energy Monitor">
                            <Suspense fallback={<LoadingFallback />}>
                                <AIComputeEnergyMonitor />
                            </Suspense>
                        </SectionErrorBoundary>
                    </section>
                </div>
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

export default EnergyCommoditiesLab;
