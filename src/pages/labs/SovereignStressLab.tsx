import React, { Suspense, lazy } from 'react';
import {
    ChevronRight,
    ArrowLeft,
    ShieldAlert,
    TrendingUp,
    Activity,
    Globe
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { Button } from '@/components/ui/button';

// Lazy loaded components
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const YieldCurveMonitor = lazy(() => import('@/features/dashboard/components/rows/YieldCurveMonitor').then(m => ({ default: m.YieldCurveMonitor })));
const IranConflictImpactMonitor = lazy(() => import('@/features/dashboard/components/rows/IranConflictImpactMonitor').then(m => ({ default: m.IranConflictImpactMonitor })));
const BoJStressMonitor = lazy(() => import('@/features/dashboard/components/rows/BoJStressMonitor').then(m => ({ default: m.BoJStressMonitor })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Stress Signal...</span>
    </div>
);

export const SovereignStressLab: React.FC = () => {
    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <ChevronRight size={10} />
                    <a href="/macro-observatory" className="hover:text-white transition-colors">Observatory</a>
                    <ChevronRight size={10} />
                    <span className="text-purple-500">Sovereign Stress</span>
                </nav>
            </div>

            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <ShieldAlert size={12} /> Fiscal Sustainability Monitor
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    Sovereign <span className="text-purple-500">Stress</span> Lab
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    Monitoring G20 debt sustainability, interest-to-revenue ratios, and the structural widening of sovereign credit default swaps.
                </p>
            </div>

            <div className="space-y-32">
                {/* Section 1: Sovereign Risk Matrix */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-purple-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Sovereign Risk Matrix</h2>
                    </div>
                    <SectionErrorBoundary name="Sovereign Risk">
                        <Suspense fallback={<LoadingFallback />}>
                            <SovereignRiskMatrix />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-sovereign-risk" insight="The G20 Risk Matrix scores nations on debt/GDP, CDS spreads, and refinancing pressure. Current readings highlight Japan and Italy as structural outliers in the developed market universe." />
                </section>

                {/* Section 2: Yield Curve Monitor */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Yield Curve Dynamics</h2>
                    </div>
                    <SectionErrorBoundary name="Yield Curve">
                        <Suspense fallback={<LoadingFallback />}>
                            <YieldCurveMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                </section>

                {/* Section 3: BoJ Monetary Dominance */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-cyan-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">BoJ Monetary Dominance</h2>
                    </div>
                    <SectionErrorBoundary name="BoJ Stress Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <BoJStressMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-boj-stress" insight="Bank of Japan balance sheet tracking reveals divergence between Total Assets and Monetary Base. High intervention periods indicate significant policy pressure points." />
                </section>

                {/* Section 4: Geopolitical Stress Test */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <Globe size={24} className="text-orange-500" />
                        <h2 className="text-xl font-black uppercase tracking-heading text-white">Geopolitical Stress Test: Iran Conflict</h2>
                    </div>
                    <SectionErrorBoundary name="Iran Conflict Monitor">
                        <Suspense fallback={<LoadingFallback />}>
                            <IranConflictImpactMonitor />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-iran-conflict" insight="Visualization of India's second-order exposure to Middle East conflict. Unlike 1990, India's $680bn FX reserves and $125bn remittance flywheel provide a structural floor despite higher oil sensitivity." />
                </section>
            </div>

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

export default SovereignStressLab;
