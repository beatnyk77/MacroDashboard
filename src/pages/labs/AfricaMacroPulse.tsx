import React, { Suspense, lazy } from 'react';
import {
    ChevronRight,
    ArrowLeft,
    Globe,
    ShieldAlert,
    BarChart3
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { Button } from '@/components/ui/button';
import { AfricaMacroSnapshot } from '@/features/dashboard/components/sections/AfricaMacroSnapshot';
import { SEOManager } from '@/components/SEOManager';

// Lazy loaded components (to be implemented)
const AfricaComparisonHeatmap = lazy(() => import('@/features/dashboard/components/sections/AfricaComparisonHeatmap').then(m => ({ default: m.AfricaComparisonHeatmap })));
const CountryDeepDiveGrid = lazy(() => import('@/features/dashboard/components/sections/CountryDeepDiveGrid').then(m => ({ default: m.CountryDeepDiveGrid })));

const LoadingFallback = ({ label }: { label: string }) => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">{label}</span>
    </div>
);

export const AfricaMacroPulseLab: React.FC = () => {
    const continentSchema = {
        "@context": "https://schema.org",
        "@type": "Place",
        "name": "Africa",
        "description": "Institutional macro intelligence for Africa — covering sovereign debt, commodity exposure, and BRICS trade gravity across 10 key economies.",
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 8.7832,
            "longitude": 34.5085
        }
    };

    const datasetSchema = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "Africa Macro & Sovereign Debt Pulse",
        "description": "Real-time dataset tracking fiscal stress, debt sustainability, and bilateral trade flows for major African economies including Nigeria, South Africa, Egypt, and Kenya.",
        "url": "https://graphiquestor.com/labs/africa-macro",
        "creator": {
            "@type": "Organization",
            "name": "GraphiQuestor Intelligence"
        },
        "keywords": ["Africa Macro", "Sovereign Debt", "BRICS Trade", "Commodity Exposure"]
    };

    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(continentSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />

            <SEOManager
                title="Africa Macro Pulse — Sovereign Debt, Commodity & Trade Gravity"
                description="Institutional-grade terminal for tracking African macro intelligence. Monitor fiscal stress, debt-to-GDP, and the shift towards BRICS trade gravity for 10 key African economies."
                keywords={[
                    'Africa Macro Intelligence', 'Africa Sovereign Debt', 'BRICS Trade Africa',
                    'Nigeria Macro', 'South Africa Economy', 'Egypt Debt Stress',
                    'Kenya Fiscal Health', 'Commodity Exposure Africa', 'IMF Africa', 'AfDB'
                ]}
            />
            {/* Breadcrumbs */}
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <a href="/" className="hover:text-white transition-colors">Home</a>
                    <ChevronRight size={10} />
                    <a href="/macro-observatory" className="hover:text-white transition-colors">Observatory</a>
                    <ChevronRight size={10} />
                    <span className="text-blue-500">Africa Macro Pulse</span>
                </nav>
            </div>

            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <Globe size={12} /> Emerging Market Intelligence
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white mb-4">
                    Africa <span className="text-blue-500">Macro</span> Pulse
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    Institutional-grade terminal for tracking sovereign debt sustainability, commodity exposure, and the shifting gravity of BRICS trade across the African continent.
                </p>
            </div>

            <div className="space-y-32">
                {/* Section 1: Monthly Snapshot */}
                <section>
                    <SectionErrorBoundary name="Africa Snapshot">
                        <AfricaMacroSnapshot />
                    </SectionErrorBoundary>
                </section>

                {/* Section 2: Continental Heatmap */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="text-emerald-500" size={28} />
                            <h2 className="text-2xl font-black uppercase tracking-heading text-white">Comparative Heatmap</h2>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            10 Key Economies · Debt vs Gravity
                        </div>
                    </div>
                    <SectionErrorBoundary name="Africa Heatmap">
                        <Suspense fallback={<LoadingFallback label="Rendering Heatmap..." />}>
                            <AfricaComparisonHeatmap />
                        </Suspense>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="africa-heatmap" insight="Cross-country comparison reveals a clear divergence: Energy exporters (AO, DZ) see improving fiscal buffers, while import-dependent nations (EG, KE) face deepening structural deficits." />
                </section>

                {/* Section 3: Country Deep Dives */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <ShieldAlert className="text-rose-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Sovereign Deep Dives</h2>
                    </div>
                    <SectionErrorBoundary name="Country Deep Dives">
                        <Suspense fallback={<LoadingFallback label="Loading Deep Dives..." />}>
                            <CountryDeepDiveGrid />
                        </Suspense>
                    </SectionErrorBoundary>
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

export default AfricaMacroPulseLab;
