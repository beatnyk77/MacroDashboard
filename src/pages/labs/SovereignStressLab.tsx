import React, { Suspense, lazy } from 'react';
import { PublisherOrganizationSchema } from '@/config/brandConfig';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
    ChevronRight,
    ArrowLeft,
    ShieldAlert,
    TrendingUp,
    Activity
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { LazyRender } from '@/components/LazyRender';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { TrailLink } from '@/components/TrailLink';

// Lazy loaded components
const SovereignRiskMatrix = lazy(() => import('@/features/dashboard/components/sections/SovereignRiskMatrix').then(m => ({ default: m.SovereignRiskMatrix })));
const BoJStressMonitor = lazy(() => import('@/features/dashboard/components/rows/BoJStressMonitor').then(m => ({ default: m.BoJStressMonitor })));
const SovereignStressDeskCard = lazy(() => import('@/components/SovereignStressDeskCard').then(m => ({ default: m.SovereignStressDeskCard })));


const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Loading Stress Signal...</span>
    </div>
);

export const SovereignStressLab: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.US_DEBT_GDP_PCT);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
        <SEOManager
            title="Sovereign Debt Risk Dashboard | G20 Fiscal Monitor"
            description="G20 sovereign debt risk monitor with observed debt-to-GDP, GDP growth, gold reserves, data freshness, and BoJ balance-sheet telemetry."
            keywords={['sovereign debt risk dashboard', 'sovereign stress monitor', 'G20 debt sustainability', 'government debt to GDP', 'sovereign refinancing risk', 'BoJ balance sheet']}
            jsonLd={[
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    'name': 'Sovereign Stress Lab',
                    'url': 'https://graphiquestor.com/labs/sovereign-stress',
                    'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
                    'about': ['sovereign debt', 'fiscal sustainability', 'government bond markets']
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                        { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory/' },
                        { '@type': 'ListItem', 'position': 3, 'name': 'Sovereign Stress Lab' }
                    ]
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'Dataset',
                    'name': 'G20 Sovereign Stress Data',
                    'description': 'Observed G20 sovereign debt, growth, gold-reserve, and Bank of Japan balance-sheet observations with freshness metadata.',
                    'url': 'https://graphiquestor.com/labs/sovereign-stress/',
                    'isAccessibleForFree': true,
                    'temporalCoverage': '2020/..',
                    'variableMeasured': ['Government debt to GDP', 'Real GDP growth', 'Official gold reserves', 'BoJ total assets', 'BoJ monetary base'],
                    'measurementTechnique': 'Latest published observations and transparent derived ratios; coverage varies by country and series.',
                    'creator': PublisherOrganizationSchema
                }
            ]}
        />
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
            {/* Breadcrumbs */}
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <TrailLink to="/" className="hover:text-white transition-colors">Home</TrailLink>
                    <ChevronRight size={10} />
                    <TrailLink to="/macro-observatory/" className="hover:text-white transition-colors">Observatory</TrailLink>
                    <ChevronRight size={10} />
                    <span className="text-purple-500">Sovereign Stress</span>
                </nav>
            </div>

            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <ShieldAlert size={12} /> Fiscal Sustainability Monitor
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white">
                        Sovereign <span className="text-purple-500">Stress</span> Lab
                    </h1>
                    <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                </div>
                <p className="text-muted-foreground/60 max-w-3xl text-sm md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    A country-level screen for observed debt burden, growth, reserve coverage, and balance-sheet transmission. Each reading carries its observation date and data state.
                </p>
            </div>

            <div className="space-y-24">
                {/* Section 0: Sovereign Stress & Cross-Border Flows Desk */}
                <section>
                    <SectionErrorBoundary name="Sovereign Stress Desk">
                        <LazyRender minHeight="450px" fallback={<LoadingFallback />}>
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignStressDeskCard />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 1: Sovereign Risk Matrix */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-purple-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Sovereign Risk Matrix</h2>
                    </div>

                    <SectionErrorBoundary name="Sovereign Risk">
                        <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                            <Suspense fallback={<LoadingFallback />}>
                                <SovereignRiskMatrix />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-sovereign-risk" insight="The current screen compares observed debt-to-GDP and real GDP growth across the covered G20 economies. It is a fiscal-vulnerability screen, not a CDS or refinancing composite." />
                </section>


                {/* Section 2: BoJ Monetary Dominance */}
                <section>
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-cyan-500" size={28} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">BoJ Monetary Dominance</h2>
                    </div>
                    <SectionErrorBoundary name="BoJ Stress Monitor">
                        <LazyRender minHeight="300px" fallback={<LoadingFallback />}>
                            <Suspense fallback={<LoadingFallback />}>
                                <BoJStressMonitor />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-boj-stress" insight="Bank of Japan balance-sheet telemetry shows the level and rate of change of total assets and monetary base. Series availability and cadence are shown with the underlying chart state." />
                </section>

            </div>

            {/* SEO Structural Analysis Text Block */}
            <article className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="Structural Analysis of G20 Debt Sustainability">
                <h2 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">How to read the Sovereign Stress Lab</h2>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>Sovereign Stress Lab</strong> organizes sovereign-risk evidence around fiscal burden, economic growth, reserve coverage, and central-bank balance sheets. The G20 matrix currently uses observed debt-to-GDP and real GDP growth readings, with gold reserves and nominal GDP available as supporting context.
                    </p>
                    <p>
                        The <strong>BoJ Monetary Dominance</strong> monitor tracks total assets and monetary base in trillions of yen. Growth rates are calculated against a date-based historical observation, while unavailable JGB holdings remain visible as a coverage gap until a maintained source is connected.
                    </p>
                    <p>
                        Debt-to-GDP is a stock measure. A fuller sovereign assessment also needs interest-to-revenue, primary balance, debt maturity, currency composition, external debt service, market pricing, and banking-system exposure. Those families should enter the cockpit only when each series has a documented source, cadence, and coverage profile.
                    </p>
                </div>
            </article>

            <div className="mt-24 pt-12 border-t border-white/5 text-center">
                <Button
                    variant="ghost"
                    className="text-muted-foreground/40 font-black uppercase tracking-uppercase hover:text-white transition-colors"
                    asChild
                >
                    <a href="/macro-observatory/" className="flex items-center gap-2">
                        <ArrowLeft size={18} /> Back to Observatory
                    </a>
                </Button>
            </div>
            <RelatedContent />
            <RelatedMetrics />
        </div>
        </>
    );
};

export default SovereignStressLab;
