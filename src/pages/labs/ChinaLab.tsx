import React, { Suspense, lazy } from 'react';
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
import { SEOManager } from '@/components/SEOManager';
import { Button } from '@/components/ui/button';

// Lazy loaded components
const ChinaMacroPulseSection = lazy(() => import('@/features/dashboard/components/sections/ChinaMacroPulseSection').then(m => ({ default: m.ChinaMacroPulseSection })));
const InstitutionalInfluenceSection = lazy(() => import('@/features/dashboard/components/sections/InstitutionalInfluenceSection').then(m => ({ default: m.InstitutionalInfluenceSection })));
const G20GdpPerCapitaConvergence = lazy(() => import('@/features/dashboard/components/rows/G20GdpPerCapitaConvergence').then(m => ({ default: m.G20GdpPerCapitaConvergence })));

const LoadingFallback = () => (
    <div className="w-full min-h-[400px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Signal...</span>
    </div>
);

export const ChinaLab: React.FC = () => {
    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
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
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <ChevronRight size={10} />
                    <a href="/macro-observatory" className="hover:text-white transition-colors">Observatory</a>
                    <ChevronRight size={10} />
                    <span className="text-blue-400">China Lab</span>
                </nav>
            </div>

            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <Globe size={12} /> Systemic Influence Monitor
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    China <span className="text-blue-500">Lab</span>
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    Analyzing the PBoC monetary plumbing, credit impulse cycles, and the structural pivot toward high-quality manufacturing and green capex.
                </p>
            </div>

            <div className="space-y-32">
                {/* 1. China Macro Pulse */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-rose-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">China Macro Pulse</h2>
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
                        <Zap className="text-blue-400" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Spheres of Institutional Influence</h2>
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
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">G20 GDP Per Capita Convergence</h2>
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
                <h3 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">Structural Analysis: China's Economic Pivot & Global Influence</h3>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>China Lab</strong> tracks the deliberate structural deceleration of China's property sector alongside the corresponding acceleration in high-end manufacturing, green technology, and sovereign influence architecture. Analyzing the People's Bank of China (PBoC) monetary plumbing and credit impulse cycles provides leading indicators for global commodity demand and emerging market liquidity.
                    </p>
                    <p>
                        A key focus of this lab is the tracking of <a href="/glossary/de-dollarization" className="text-blue-400 hover:underline transition-colors">De-Dollarization</a> vectors and the expansion of parallel settlement infrastructure like the <a href="/glossary/mbridge" className="text-blue-400 hover:underline transition-colors">mBridge</a> network. By monitoring the spheres of institutional influence, including BRICS+ trade alignments and bilateral swap lines, the timeline for multi-polar reserve optionality becomes quantifiable.
                    </p>
                    <p>
                        The <em>G20 GDP Per Capita Convergence</em> models the long-term relative growth rate of the Chinese economy against developed market peers, visualizing the shift from export-led accumulation to domestic consumption and strategic industrial autonomy.
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

export default ChinaLab;
