import React, { Suspense, lazy } from 'react';
import { PublisherOrganizationSchema } from '@/config/brandConfig';
import { Button } from '@/components/ui/button';
import { useUSFiscalStress } from '@/hooks/useUSFiscalStress';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useFiscalCockpit } from '@/hooks/useFiscalCockpit';
import {
    ChevronRight,
    ArrowLeft,
    ShieldAlert,
    TrendingUp,
    Zap,
    Activity
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { SectionLoadingFallback } from '@/components/SectionLoadingFallback';
import { ChartInsightSummary } from '@/components/ChartInsightSummary';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { TrailLink } from '@/components/TrailLink';
import { FiscalCockpit } from '@/features/dashboard/components/sections/FiscalCockpit';


// Components
import { USDebtMaturityWall } from '@/components/USDebtMaturityWall';
import { USFiscalDominanceMeter } from '@/components/USFiscalDominanceMeter';
import { LazyRender } from '@/components/LazyRender';
import { GfpTeaserCard } from '@/features/gfp/components';

// Lazy loaded components
const USTreasuryDemandGauge = lazy(() => import('@/features/dashboard/components/rows/USTreasuryDemandGauge').then(m => ({ default: m.USTreasuryDemandGauge })));
const TreasuryHoldersSection = lazy(() => import('@/features/dashboard/components/sections/TreasuryHoldersSection').then(m => ({ default: m.TreasuryHoldersSection })));
const OffshoreDollarStressCard = lazy(() => import('@/features/dashboard/components/sections/OffshoreDollarStressCard').then(m => ({ default: m.OffshoreDollarStressCard })));
const USFiscalComparisonChart = lazy(() => import('@/features/dashboard/components/rows/USFiscalComparisonChart'));
const FedMonetizationMonitor = lazy(() => import('@/components/labs/FedMonetizationMonitor').then(m => ({ default: m.FedMonetizationMonitor })));
const FundingPlumbingStress = lazy(() => import('@/components/labs/FundingPlumbingStress').then(m => ({ default: m.FundingPlumbingStress })));
const FOMCMinutesAnalysisCard = lazy(() => import('@/components/labs/FOMCMinutesAnalysisCard').then(m => ({ default: m.FOMCMinutesAnalysisCard })));

export const USMacroFiscalLab: React.FC = () => {
    const { data: cockpit } = useFiscalCockpit();
    const { data: fiscalStress } = useUSFiscalStress();
    const primaryMetric = cockpit?.metrics.find(metric => metric.id === 'US_FEDERAL_INTEREST_PAYMENTS');
    const dataFreshness = primaryMetric?.freshness || 'no_data';
    const latestFiscalStress = fiscalStress?.[fiscalStress.length - 1];
    const interestAsOf = primaryMetric?.asOf
        ? new Date(primaryMetric.asOf).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : null;
    const interestValue = primaryMetric?.value != null ? `${primaryMetric.value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${primaryMetric.unit}` : null;
    const fiscalStressAsOf = latestFiscalStress?.date
        ? new Date(latestFiscalStress.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : null;
    const fiscalRatio = latestFiscalStress?.fiscal_dominance_ratio != null
        ? `${Number(latestFiscalStress.fiscal_dominance_ratio).toFixed(1)}%`
        : null;
    const interestSource = primaryMetric?.source || 'the configured source series';

    const faqItems = [
        {
            question: 'What is the US debt maturity wall?',
            answer: 'The maturity wall is the amount of marketable Treasury debt scheduled to mature across the rolling windows shown in this lab. The maturity module reports the latest Treasury maturity observations by bucket and date; it does not imply a fixed refinancing amount, since the profile changes as securities mature and new debt is issued.'
        },
        {
            question: 'What does fiscal dominance mean for the Federal Reserve?',
            answer: `Fiscal dominance describes a condition in which debt-service and mandatory-spending pressures narrow the fiscal room for restrictive monetary policy. This lab monitors the relationship between federal interest payments, entitlements, and tax receipts through its fiscal-stress series${fiscalRatio && fiscalStressAsOf ? `; the latest available ratio is ${fiscalRatio} as of ${fiscalStressAsOf}` : ''}.`
        },
        {
            question: 'How much does the US government pay in interest on its debt?',
                answer: interestValue && interestAsOf
                ? `The configured ${interestSource} series reports federal current interest payments of ${interestValue} as of ${interestAsOf}. Use the chart and provenance metadata for the latest revision, frequency, and history.`
                : 'The federal interest-payment series is temporarily unavailable. The lab displays the latest observation, source, frequency, and as-of date when the telemetry is available.'
        }
    ];
    return (
        <>
        <SEOManager
            title="US Treasury Liquidity & Fiscal Monitor | GraphiQuestor"
            description="Published US Treasury, liquidity, market, and fiscal observations with source, as-of date, frequency, and provenance."
            keywords={['US Treasury data', 'US fiscal monitor', 'Treasury liquidity', 'Treasury auction demand', 'fiscal dominance', 'TGA balance', 'reverse repo']}
            jsonLd={[
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    'name': 'US Macro & Fiscal Lab',
                    'description': 'Published observations for US sovereign debt, Treasury demand, liquidity, and fiscal burden metrics.',
                    'url': 'https://graphiquestor.com/labs/us-macro-fiscal',
                    'isPartOf': { '@id': 'https://graphiquestor.com/#website' }
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                        { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                        { '@type': 'ListItem', 'position': 3, 'name': 'US Macro & Fiscal Lab', 'item': 'https://graphiquestor.com/labs/us-macro-fiscal' }
                    ]
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'Dataset',
                    'name': 'US Treasury, Liquidity & Fiscal Observations',
                    'description': 'Published US Treasury, Federal Reserve, liquidity, market, and fiscal observations with source metadata.',
                    'url': 'https://graphiquestor.com/labs/us-macro-fiscal',
                    'isAccessibleForFree': true,
                    'creator': PublisherOrganizationSchema,
                    'temporalCoverage': '2010/..',
                    'variableMeasured': ['Treasury General Account', 'Reverse Repo Balance', 'Treasury debt maturities', 'Federal interest payments', 'Treasury yields'],
                    'measurementTechnique': 'Source observations and explicitly labelled derived ratios from public US Treasury, Federal Reserve, and FRED series.'
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    'mainEntity': [
                        ...faqItems.map(({ question, answer }) => ({
                            '@type': 'Question',
                            'name': question,
                            'acceptedAnswer': { '@type': 'Answer', 'text': answer }
                        }))
                    ]
                }
            ]}
        />
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <TrailLink to="/" className="hover:text-white transition-colors">Home</TrailLink>
                    <ChevronRight size={10} />
                    <TrailLink to="/macro-observatory/" className="hover:text-white transition-colors">Observatory</TrailLink>
                    <ChevronRight size={10} />
                    <span className="text-blue-500">US Macro & Fiscal</span>
                </nav>
            </div>

            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-uppercase mb-6">
                    <Zap size={12} /> Core Sovereign Telemetry
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-heading leading-tight text-white">
                        US Macro & Fiscal <span className="text-blue-500">Lab</span>
                    </h1>
                    <FreshnessChip status={dataFreshness} lastUpdated={primaryMetric?.lastUpdated || undefined} sourceRef={primaryMetric?.sourceRef} provenance={primaryMetric?.provenance} isProvisional={primaryMetric?.isProvisional} />
                </div>
                <p className="text-muted-foreground/60 max-w-3xl text-base md:text-lg font-medium leading-relaxed uppercase tracking-wide">
                    Published observations for Treasury funding, US fiscal capacity, and dollar liquidity, with source and data-state context attached to every value.
                </p>
            </div>

            <FiscalCockpit />

            <div className="mt-20 space-y-24">
                {/* Section 0.5: FOMC Minutes Intelligence */}
                <section>
                    <SectionErrorBoundary name="FOMC Minutes Intelligence">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                <FOMCMinutesAnalysisCard />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 1: Debt Maturity Wall */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-blue-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">US Debt Maturity Wall</h2>
                    </div>
                    <SectionErrorBoundary name="US Debt Maturity Wall">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={500} label="Loading module" />}>
                                <USDebtMaturityWall />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-debt-maturity" insight="The maturity module reports scheduled Treasury maturities by bucket and source date. It describes the published maturity profile, while refinancing terms and future issuance remain separate observations." />
                </section>

                {/* Section 1.5: FED Debt Monetization & Yield Control Monitor */}
                <section>
                    <SectionErrorBoundary name="FED Debt Monetization & Yield Control Monitor">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={500} label="Loading module" />}>
                                <FedMonetizationMonitor />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-fed-monetization" insight="Federal Reserve debt monetization leads to direct yield suppression, historically expanding systemic vulnerabilities when Central Bank holdings reach structural extremes." />
                </section>

                {/* Section 2: US Fiscal Dominance Meter */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Activity className="text-red-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">US Fiscal Dominance Meter</h2>
                    </div>
                    <SectionErrorBoundary name="US Fiscal Dominance Meter">
                        <LazyRender minHeight="500px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={500} label="Loading module" />}>
                                <USFiscalDominanceMeter />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-fiscal-dominance" insight="This panel computes burden ratios from the latest available fiscal-stress observations. The displayed methodology and as-of dates define the scope of the comparison." />
                </section>

                {/* Government Financial Position teaser */}
                <section>
                    <SectionErrorBoundary name="Government Financial Position Teaser">
                        <GfpTeaserCard />
                    </SectionErrorBoundary>
                </section>

                {/* Section 2.1: Funding Plumbing Stress (RRP, TGA, SRF, Swaps) */}
                <section>
                    <SectionErrorBoundary name="Funding Plumbing Stress">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                <FundingPlumbingStress />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 3: Treasury Demand */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Zap className="text-amber-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Auction Demand</h2>
                    </div>
                    <SectionErrorBoundary name="Treasury Demand Gauge">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                <USTreasuryDemandGauge />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 2.5: Offshore Dollar Stress */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Zap className="text-rose-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Offshore Dollar Funding Stress</h2>
                    </div>
                    <SectionErrorBoundary name="Offshore Dollar Stress">
                        <LazyRender minHeight="300px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={300} label="Loading module" />}>
                                <OffshoreDollarStressCard />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                </section>

                {/* Section 3: Foreign Holders */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldAlert className="text-emerald-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Foreign Holders</h2>
                    </div>
                    <SectionErrorBoundary name="Top Treasury Holders">
                        <LazyRender minHeight="700px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={700} label="Loading module" />}>
                                <TreasuryHoldersSection />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    
                    <div className="mt-6 flex justify-end">
                        <Button variant="outline" className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 uppercase tracking-widest text-xs font-black" asChild>
                            <a href="/labs/us-treasury-foreign-holdings/">Deep Dive: Foreign Holder Selloff Risk <ChevronRight size={14} className="ml-2" /></a>
                        </Button>
                    </div>
                </section>

                {/* Section 4: US Fiscal Comparison */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="text-indigo-500" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Defense vs Interest</h2>
                    </div>
                    <SectionErrorBoundary name="US Fiscal Comparison">
                        <LazyRender minHeight="400px">
                            <Suspense fallback={<SectionLoadingFallback minHeight={400} label="Loading module" />}>
                                <USFiscalComparisonChart />
                            </Suspense>
                        </LazyRender>
                    </SectionErrorBoundary>
                    <ChartInsightSummary id="lab-us-fiscal-comp" insight="The comparison chart retains source cadence and displays only dates where the defense and interest series overlap. Relative size is an observed relationship, not a forecast." />
                </section>

            </div>

            {/* SEO methodology and discovery text block */}
            <article className="mt-24 p-8 sm:p-12 bg-white/[0.02] border border-white/5 rounded-3xl" aria-label="US Treasury and fiscal data methodology">
                <h3 className="text-xl font-black text-white uppercase tracking-uppercase mb-6">How to read the US Treasury and fiscal monitor</h3>
                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
                    <p>
                        The <strong>US Macro & Fiscal Lab</strong> is a published-observation monitor for Treasury funding, Federal Reserve liquidity facilities, fiscal burden ratios, and Treasury market data. Each usable value carries an as-of date, source, frequency, and provenance state. The coverage register identifies metrics that are unavailable or lagged.
                    </p>
                    <p>
                        The maturity wall reports scheduled Treasury maturities across the available windows. Auction demand reports observed bid-to-cover, yield, and bidder participation fields when the Treasury auction feed is populated. These modules answer different questions and should be read together with their source dates.
                    </p>
                    <p>
                        The <a href="/glossary/tga/" className="text-blue-400 hover:underline">Treasury General Account (TGA)</a> and Overnight Reverse Repo Facility (RRP) are shown as separate liquidity observations. Their levels can be compared with Standing Repo Facility usage and FX swap line balances when those feeds are available. The page preserves native units so cross-series comparisons remain explicit.
                    </p>
                    <p>
                        Fiscal burden panels use published fiscal-stress rows and explicitly labelled derived ratios. A missing or provisional upstream record is not converted into zero. Methodology links and source metadata provide the audit trail for any downstream interpretation.
                    </p>
                </div>

                {/* Visible FAQ block, mirrors the FAQPage JSON-LD above */}
                <div className="mt-10 pt-8 border-t border-white/5 space-y-5">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Frequently Asked Questions</h4>
                    {faqItems.map(({ question, answer }) => (
                        <div key={question}>
                            <p className="text-sm font-bold text-white/90 mb-1">{question}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
                        </div>
                    ))}
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

export default USMacroFiscalLab;
