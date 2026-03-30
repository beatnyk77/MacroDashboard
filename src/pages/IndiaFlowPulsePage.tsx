import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { ChevronRight, Activity } from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

const IndiaMarketPulseRow = lazy(() =>
    import('@/features/dashboard/components/rows/IndiaMarketPulseRow').then(m => ({
        default: m.IndiaMarketPulseRow,
    }))
);
const FIIDIIMonitorSection = lazy(() =>
    import('@/features/dashboard/components/sections/FIIDIIMonitorSection').then(m => ({
        default: m.FIIDIIMonitorSection,
    }))
);

const LoadingFallback = () => (
    <div className="w-full h-full min-h-[200px] bg-slate-900/50 border border-white/5 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-uppercase">
            Connecting...
        </span>
    </div>
);

export const IndiaFlowPulsePage: React.FC = () => {
    return (
        <Container maxWidth={false} sx={{ py: 6, bgcolor: 'background.default', minHeight: '100vh' }}>
            <SEOManager
                title="India Flow Pulse (FII/DII) | GraphiQuestor"
                description="Live FII and DII institutional flow intelligence, derivatives sentiment, market breadth, and sectoral rotation for Indian equities."
                isApp={true}
            />

            <Box sx={{ mb: 4 }}>
                <Breadcrumbs
                    separator={<ChevronRight size={14} className="text-muted-foreground/50" />}
                    aria-label="breadcrumb"
                >
                    <Link
                        underline="hover"
                        color="inherit"
                        href="/"
                        sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}
                    >
                        Home
                    </Link>
                    <Link
                        underline="hover"
                        color="inherit"
                        href="/india-equities"
                        sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}
                    >
                        India Equities
                    </Link>
                    <Typography
                        color="text.primary"
                        sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}
                    >
                        FII / DII Flow Pulse
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ mb: 8 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-uppercase mb-4">
                    <Activity size={12} /> Live Institutional Flow Data
                </div>
                <Typography
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}
                >
                    India Flow <span className="text-blue-400">Pulse</span>
                </Typography>
                <Typography
                    variant="body1"
                    sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.1rem', fontWeight: 500 }}
                >
                    Daily FII & DII institutional microstructure — cash flows, derivatives positioning, market breadth,
                    sector rotation, and cap-stack risk pulse for Indian equity markets.
                </Typography>
            </Box>

            <div className="space-y-12 w-full">
                <SectionErrorBoundary name="India Market Pulse">
                    <Suspense fallback={<LoadingFallback />}>
                        <IndiaMarketPulseRow />
                    </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary name="FII DII Monitor">
                    <Suspense fallback={<LoadingFallback />}>
                        <FIIDIIMonitorSection />
                    </Suspense>
                </SectionErrorBoundary>
            </div>
        </Container>
    );
};

export default IndiaFlowPulsePage;
