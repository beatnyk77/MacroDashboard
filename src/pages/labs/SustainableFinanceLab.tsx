import React, { Suspense, lazy } from 'react';
import {
    ChevronRight,
    ArrowLeft,
    Leaf,
    Zap,
    Thermometer,
    BarChart3
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';

// Lazy loaded components
const ClimateRiskDashboard = lazy(() => import('@/features/dashboard/components/sections/ClimateRiskDashboard').then(m => ({ default: m.ClimateRiskDashboard })));

const LoadingFallback = () => (
    <div className="w-full min-h-[400px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Synchronizing Climate Telemetry...</span>
    </div>
);

export const SustainableFinanceLab: React.FC = () => {
    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
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
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <ChevronRight size={10} />
                    <a href="/macro-observatory" className="hover:text-white transition-colors">Observatory</a>
                    <ChevronRight size={10} />
                    <span className="text-emerald-500">Sustainable Finance</span>
                </nav>
            </div>

            {/* Intro Header */}
            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <Leaf size={12} /> ESG Transition & Climate Alpha
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    Sustainable <span className="text-emerald-500">Finance</span> & Climate Risk
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide mb-8">
                    Monitoring G20 climate transition risk, sovereign temperature alignment, and the carbon intensity of global industrial hubs.
                </p>

                <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 max-w-4xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-4 inline-block">Lab Objectives</h3>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-wide">
                        This lab translates environmental physical risks and transition policies into institutional-grade macro signals. 
                        <strong className="text-white"> Start by assessing the "Temperature Alignment" of key economies</strong> to understand looming regulatory and tax pressures. Then, pivot to the "Grid Intensity" monitor to identify supply-chain bottlenecks and renewable-ready industrial pockets.
                    </p>
                </div>
            </div>

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
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                        <Thermometer className="text-orange-500 mb-6" size={28} />
                        <h4 className="text-white font-black uppercase tracking-widest mb-4 text-xs">Transition Exposure</h4>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-wide">
                            High temperature alignment (&gt;2.5°C) correlates strongly with future sovereign debt stress as nations are forced into aggressive, unplanned capital re-allocation.
                        </p>
                    </div>
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                        <Zap className="text-emerald-500 mb-6" size={28} />
                        <h4 className="text-white font-black uppercase tracking-widest mb-4 text-xs">Energy Security Link</h4>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-wide">
                            Grid carbon intensity acts as a proxy for fossil-fuel reliance. Low intensity indicates higher insulation from global oil and gas volatility.
                        </p>
                    </div>
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                        <BarChart3 className="text-blue-500 mb-6" size={28} />
                        <h4 className="text-white font-black uppercase tracking-widest mb-4 text-xs">Alpha Projection</h4>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium uppercase tracking-wide">
                            Institutional capital flows are increasingly pivoting toward markets with documented renewable share gains, creating a new "Green Carry Trade" dynamic.
                        </p>
                    </div>
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

export default SustainableFinanceLab;
