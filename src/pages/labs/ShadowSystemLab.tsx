import React, { Suspense, lazy } from 'react';
import {
    ChevronRight,
    ArrowLeft,
    EyeOff,
    Globe
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';

// Lazy loaded components
const ShadowTradeCard = lazy(() => import('@/features/dashboard/components/rows/ShadowTradeCard').then(m => ({ default: m.ShadowTradeCard })));


const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Shadow Signal...</span>
    </div>
);

export const ShadowSystemLab: React.FC = () => {
    return (
        <>
        <SEOManager
            title="Shadow System Lab — Capital Flight, Trade Misinvoicing & Off-Grid Flows"
            description="Track the unobserved economy: elite wealth flight, trade misinvoicing indices, and non-G7 trade network gravitational shifts. Institutional dark-flow telemetry."
            keywords={['shadow trade', 'capital flight', 'trade misinvoicing', 'illicit financial flows', 'off-grid economy', 'shadow banking']}
            jsonLd={{
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                'name': 'Shadow System Lab',
                'url': 'https://graphiquestor.com/labs/shadow-system',
                'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
                'breadcrumb': {
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                        { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                        { '@type': 'ListItem', 'position': 3, 'name': 'Shadow System Lab' }
                    ]
                }
            }}
        />
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <ChevronRight size={10} />
                    <a href="/macro-observatory" className="hover:text-white transition-colors">Observatory</a>
                    <ChevronRight size={10} />
                    <span className="text-slate-400">Shadow System</span>
                </nav>
            </div>

            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <EyeOff size={12} /> Off-Grid Telemetry
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    Shadow <span className="text-slate-400">System</span> Lab
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    Tracking the unobserved economy: Elite wealth flight, trade misinvoicing, and the gravitational shifts in non-G7 trade networks.
                </p>
            </div>

            <div className="space-y-32">
                {/* 3. Shadow Trade Card */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Globe className="text-slate-400" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Shadow Trade Terminal</h2>
                    </div>
                    <SectionErrorBoundary name="Shadow Trade">
                        <Suspense fallback={<LoadingFallback />}>
                            <ShadowTradeCard />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-shadow-trade" insight="Shadow trade metrics capture settlement activity occurring outside traditional SWIFT channels, often mediated through local currency swaps or physical commodity bartering." />
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
        </>
    );
};

export default ShadowSystemLab;
