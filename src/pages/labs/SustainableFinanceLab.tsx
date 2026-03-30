import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    Leaf,
    Zap,
    Thermometer,
    BarChart3
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

// Lazy loaded components
const ClimateRiskDashboard = lazy(() => import('@/features/dashboard/components/sections/ClimateRiskDashboard').then(m => ({ default: m.ClimateRiskDashboard })));

const LoadingFallback = () => (
    <div className="w-full min-h-[400px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Synchronizing Climate Telemetry...</span>
    </div>
);

import { SEOManager } from '@/components/SEOManager';

export const SustainableFinanceLab: React.FC = () => {
    return (
        <Container maxWidth={false} sx={{ py: 6 }}>
            <SEOManager 
                title="Sustainable Finance & Climate Risk Lab"
                description="Monitoring the intersection of global finance and climate entropy. Tracking physical risk, energy transition velocity, and green capital flows."
                keywords={['Sustainable Finance', 'Climate Risk', 'Green Transition', 'ESG Data', 'Climate Entropy']}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Dataset",
                    "name": "Climate Finance & Energy Transition Data",
                    "description": "Global dataset tracking climate risk exposure and energy transition momentum.",
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
                        Sustainable Finance
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Intro Header */}
            <Box sx={{ mb: 12 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-widest mb-4">
                    <Leaf size={12} /> ESG Transition & Climate Alpha
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    Sustainable <span className="text-emerald-500">Finance</span> & Climate Risk
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.2rem', fontWeight: 500, mb: 4 }}>
                    Monitoring G20 climate transition risk, sovereign temperature alignment, and the carbon intensity of global industrial hubs.
                </Typography>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/12 max-w-4xl">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 border-b border-white/12 pb-2 inline-block">Lab Objectives</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        This lab translates environmental physical risks and transition policies into institutional-grade macro signals. 
                        <strong> Start by assessing the "Temperature Alignment" of key economies</strong> to understand looming regulatory and tax pressures. Then, pivot to the "Grid Intensity" monitor to identify supply-chain bottlenecks and renewable-ready industrial pockets.
                    </p>
                </div>
            </Box>

            <div className="space-y-32">
                {/* Main Dashboard Section */}
                <section>
                    <SectionErrorBoundary name="Climate Risk Dashboard">
                        <Suspense fallback={<LoadingFallback />}>
                            <ClimateRiskDashboard />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* Integration Insight */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-[#0f1115] border border-white/5 rounded-2xl">
                        <Thermometer className="text-orange-500 mb-4" size={24} />
                        <h4 className="text-white font-bold uppercase mb-2">Transition Exposure</h4>
                        <p className="text-xs text-muted-foreground leading-loose">
                            High temperature alignment (&gt;2.5°C) correlates strongly with future sovereign debt stress as nations are forced into aggressive, unplanned capital re-allocation.
                        </p>
                    </div>
                    <div className="p-6 bg-[#0f1115] border border-white/5 rounded-2xl">
                        <Zap className="text-emerald-500 mb-4" size={24} />
                        <h4 className="text-white font-bold uppercase mb-2">Energy Security Link</h4>
                        <p className="text-xs text-muted-foreground leading-loose">
                            Grid carbon intensity acts as a proxy for fossil-fuel reliance. Low intensity indicates higher insulation from global oil and gas volatility.
                        </p>
                    </div>
                    <div className="p-6 bg-[#0f1115] border border-white/5 rounded-2xl">
                        <BarChart3 className="text-blue-500 mb-4" size={24} />
                        <h4 className="text-white font-bold uppercase mb-2">Alpha Projection</h4>
                        <p className="text-xs text-muted-foreground leading-loose">
                            Institutional capital flows are increasingly pivoting toward markets with documented renewable share gains, creating a new "Green Carry Trade" dynamic.
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

export default SustainableFinanceLab;
