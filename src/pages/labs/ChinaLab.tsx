import React, { Suspense, lazy } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import {
    ChevronRight,
    ArrowLeft,
    TrendingUp,
    Globe,
    Zap,
    MapPin
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { LazyRender } from '@/components/LazyRender';

// Lazy loaded components
const ChinaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const InstitutionalInfluenceSection = lazy(() => import('@/features/dashboard/components/sections/InstitutionalInfluenceSection').then(m => ({ default: m.InstitutionalInfluenceSection })));
const G20GdpPerCapitaConvergence = lazy(() => import('@/features/dashboard/components/rows/G20GdpPerCapitaConvergence').then(m => ({ default: m.G20GdpPerCapitaConvergence })));

const LoadingFallback = () => (
    <div className="w-full min-h-[400px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Loading Signal...</span>
    </div>
);

import { SEOManager } from '@/components/SEOManager';

export const ChinaLab: React.FC = () => {
    return (
        <Container maxWidth={false} sx={{ py: 6 }}>
            <SEOManager 
                title="China Macro Intelligence Lab | De-Dollarization & Liquidity"
                description="High-frequency monitor for China's real economy, credit impulse, and PBoC gold reserves. Specialized tracking for de-dollarization momentum."
                keywords={['China Macro', 'Credit Impulse', 'PBoC Gold', 'De-dollarization', 'China Economy Monitor']}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Dataset",
                    "name": "China Macro Intelligence Pulse",
                    "description": "Real-time economic indicators for the People's Republic of China including GDP, Credit Impulse, and FX Reserves.",
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
                        China Lab
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Box sx={{ mb: 10 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest mb-4">
                    <Globe size={12} /> Systemic Influence Monitor
                </div>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2 }}>
                    China <span className="text-blue-500">Lab</span>
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: '800px', fontSize: '1.2rem', fontWeight: 500, lineHeight: 1.6 }}>
                    Analyzing the PBoC monetary plumbing, credit impulse cycles, and the structural pivot toward high-quality manufacturing and green capex.
                </Typography>
            </Box>

            <div className="space-y-32">
                {/* 1. China Macro Pulse */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-rose-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">China Macro Pulse</h2>
                    </div>
                    <SectionErrorBoundary name="China Macro Pulse">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<LoadingFallback />}>
                                <ChinaMacroPulseSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-china-macro" insight="The China Macro Pulse tracks fixed-asset investment (FAI), retail sales, and credit impulse. The structural shift from property-driven growth to industrial upgrading is visible in the diverging capex vectors." />
                </section>

                {/* 2. Institutional Influence */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Zap className="text-blue-500" size={28} />
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Spheres of Institutional Influence</h2>
                    </div>
                    <SectionErrorBoundary name="Institutional Influence">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<LoadingFallback />}>
                                <InstitutionalInfluenceSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* 3. Global Convergence */}
                <section className="bg-white/[0.01] p-12 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-3 mb-10">
                        <MapPin className="text-emerald-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">G20 GDP Per Capita Convergence</h2>
                    </div>
                    <SectionErrorBoundary name="G20 Convergence">
                        <Suspense fallback={<LoadingFallback />}>
                            <G20GdpPerCapitaConvergence />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>
            </div>

            {/* SEO Structural Analysis Text Block */}
            <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Structural Analysis of China's Systemic Pivot">
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6">Structural Analysis: China's Economic Pivot & Global Influence</h3>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>China Lab</strong> tracks the deliberate structural deceleration of China's property sector alongside the corresponding acceleration in high-end manufacturing, green technology, and sovereign influence architecture. Analyzing the People's Bank of China (PBoC) monetary plumbing and credit impulse cycles provides leading indicators for global commodity demand and emerging market liquidity.
                    </p>
                    <p>
                        A key focus of this lab is the tracking of <a href="/glossary/de-dollarization" className="text-blue-400 hover:underline">De-Dollarization</a> vectors and the expansion of parallel settlement infrastructure like the <a href="/glossary/mbridge" className="text-blue-400 hover:underline">mBridge</a> network. By monitoring the spheres of institutional influence, including BRICS+ trade alignments and bilateral swap lines, the timeline for multi-polar reserve optionality becomes quantifiable.
                    </p>
                    <p>
                        The <em>G20 GDP Per Capita Convergence</em> models the long-term relative growth rate of the Chinese economy against developed market peers, visualizing the shift from export-led accumulation to domestic consumption and strategic industrial autonomy.
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

export default ChinaLab;
