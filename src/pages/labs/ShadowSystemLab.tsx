import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    EyeOff,
    Globe
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';

// Lazy loaded components
const ShadowTradeCard = lazy(() => import('@/features/dashboard/components/rows/ShadowTradeCard').then(m => ({ default: m.ShadowTradeCard })));


const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Shadow Signal...</span>
    </div>
);

export const ShadowSystemLab: React.FC = () => {
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
                        Shadow System
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ mb: 8 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                    <EyeOff size={12} /> Off-Grid Telemetry
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    Shadow <span className="text-slate-400">System</span> Lab
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.2rem', fontWeight: 500 }}>
                    Tracking the unobserved economy: Elite wealth flight, trade misinvoicing, and the gravitational shifts in non-G7 trade networks.
                </Typography>
            </Box>

            <div className="space-y-32">
                {/* 3. Shadow Trade Card */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Globe className="text-slate-400" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Shadow Trade Terminal</h2>
                    </div>
                    <SectionErrorBoundary name="Shadow Trade">
                        <Suspense fallback={<LoadingFallback />}>
                            <ShadowTradeCard />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-shadow-trade" insight="Shadow trade metrics capture settlement activity occurring outside traditional SWIFT channels, often mediated through local currency swaps or physical commodity bartering." />
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

export default ShadowSystemLab;
