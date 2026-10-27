import React, { Suspense, lazy } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { LabPageHeader } from '@/components/LabPageHeader';
import { TrailLink } from '@/components/TrailLink';

const CentralBankGoldNet = lazy(() => import('@/features/dashboard/components/rows/CentralBankGoldNet').then(m => ({ default: m.CentralBankGoldNet })));
const USDebtGoldBackingCard = lazy(() => import('@/features/dashboard/components/cards/USDebtGoldBackingCard').then(m => ({ default: m.USDebtGoldBackingCard })));

const LoadingFallback = () => (
    <div className="w-full min-h-[300px] bg-white/[0.02] border border-border rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-[11px] font-semibold text-terminal-dim uppercase tracking-wider">Loading Telemetry...</span>
    </div>
);

const faqItems = [
    {
        question: "Which central banks are the largest buyers of gold in 2024–2026?",
        answer: "The People's Bank of China (PBoC), Reserve Bank of India (RBI), National Bank of Poland, Central Bank of Turkey, and monetary authorities in the GCC represent the largest official buyers, sustaining gross annual central bank demand above 1,000 metric tonnes."
    },
    {
        question: "Why are central banks accumulating physical gold over US Treasuries?",
        answer: "Physical gold is the premier tier-1 reserve asset free from external sanctions, custodial freeze, and counterparty defaults. As US sovereign debt exceeds $36T, central banks are rebalancing reserves from duration-sensitive fiat debt into unencumbered physical bullion."
    },
    {
        question: "How does GraphiQuestor track sovereign gold accumulation?",
        answer: "GraphiQuestor tracks official monthly IMF International Financial Statistics (IFS) filings, World Gold Council quarterly audits, and global physical customs export flows from major bullion refining hubs (Switzerland, UK) to detect institutional sovereign accumulation."
    }
];

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
        },
    })),
};

export const CentralBankGoldPurchases: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.BRICS_GOLD_HOLDINGS_TONNES);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    return (
        <>
            <SEOManager
                title="Global Central Bank Gold Purchases Tracker (Real-Time Data)"
                description="Track real-time global central bank gold purchases, PBoC accumulation, and RBI reserves. Essential data for macro tracking of de-dollarization."
                keywords={['central bank gold purchases', 'PBOC gold', 'RBI gold reserves', 'gold accumulation', 'sovereign gold']}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Dataset',
                        'name': 'Global Central Bank Gold Purchases Data',
                        'description': 'Real-time monitoring of sovereign gold purchases globally.',
                        'url': 'https://graphiquestor.com/labs/central-bank-gold-purchases',
                        'isAccessibleForFree': true,
                        'dateModified': primaryMetric?.lastUpdated || new Date().toISOString().split('T')[0],
                        'creator': {
                            '@type': 'Organization',
                            'name': 'GraphiQuestor'
                        }
                    },
                    faqJsonLd
                ]}
            />
            <div className="page-shell">
                <LabPageHeader
                    trail={[{ label: 'Home', to: '/' }, { label: 'De-Dollarization Lab', to: '/labs/de-dollarization-gold/' }]}
                    current="Gold Purchases Tracker"
                    badge="Sovereign Gold Telemetry"
                    title={<>Global Central Bank <span className="text-blue-400">Gold Purchases</span></>}
                    status={<FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />}
                    thesis="Real-time tracking of sovereign gold accumulation and the strategic pivot from Western ETFs to Eastern Central Banks."
                />

                <div className="space-y-16">
                    <section>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">Net Purchases by Sovereign Entities</h2>
                        <div className="p-6 bg-white/[0.02] border border-border rounded-xl mb-6">
                            <SectionErrorBoundary name="Gold Net Purchases">
                                <Suspense fallback={<LoadingFallback />}>
                                    <CentralBankGoldNet />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            Since 2022, central bank net gold purchases have shattered historical records. This is a structural reconstitution of Tier 1 capital, heavily concentrated in the Global South (PBoC, RBI, and GCC entities) seeking sanction-proof reserve assets.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">The Debt/Gold Z-Score Framework</h2>
                        <div className="p-6 bg-white/[0.02] border border-border rounded-xl mb-6 max-w-3xl">
                            <SectionErrorBoundary name="Debt/Gold Backing">
                                <Suspense fallback={<LoadingFallback />}>
                                    <USDebtGoldBackingCard />
                                </Suspense>
                            </SectionErrorBoundary>
                        </div>
                        <p className="text-muted-foreground max-w-4xl text-sm leading-relaxed">
                            GraphiQuestor's proprietary Debt/Gold Z-Score metric contextualizes this accumulation. The rapid expansion of fiat M2 and sovereign debt necessitates corresponding physical gold accumulation for nations seeking to maintain the purchasing power of their reserves against Western debasement.
                        </p>
                    </section>
                    
                    {/* FAQ Section */}
                    <section className="p-8 bg-white/[0.02] border border-border rounded-xl">
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            {faqItems.map(({ question, answer }) => (
                                <div key={question} className="space-y-1">
                                    <h3 className="text-sm font-bold text-amber-400">{question}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-24 pt-12 border-t border-border text-center">
                    <Button variant="ghost" className="text-terminal-dim font-semibold uppercase tracking-wider hover:text-white" asChild>
                        <TrailLink to="/labs/de-dollarization-gold/" className="flex items-center gap-2">
                            <ArrowLeft size={18} /> Back to Lab
                        </TrailLink>
                    </Button>
                </div>
                <RelatedContent />
                <RelatedMetrics />
            </div>
        </>
    );
};
