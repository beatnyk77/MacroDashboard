import React, { useEffect } from 'react';
import {
    Flag, Shield, Terminal as TerminalIcon, Info,
    ArrowUpRight, Share2, Download
} from 'lucide-react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { FYP_HeroTimeline } from '@/features/dashboard/components/rows/China15thFYP/FYP_HeroTimeline';
import { FYP_MissionControlRadar } from '@/features/dashboard/components/rows/China15thFYP/FYP_MissionControlRadar';
import { FYP_TargetGrid } from '@/features/dashboard/components/rows/China15thFYP/FYP_TargetGrid';
import { FYP_ImpactHeatmap } from '@/features/dashboard/components/rows/China15thFYP/FYP_ImpactHeatmap';
import { ComparisonToggle14v15 } from '@/features/dashboard/components/rows/China15thFYP/ComparisonToggle14v15';
import { Button } from '@/components/ui/button';
import { LabPageHeader } from '@/components/LabPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';

const faqItems = [
    {
        question: "What are the core strategic priorities of China's 15th Five-Year Plan (2026–2030)?",
        answer: "The 15th FYP focuses on 'High-Quality Development' and comprehensive national security resilience. Priorities include achieving self-reliance in semiconductor fabrication and critical software, industrial upgrading through new productive forces, energy transition self-sufficiency, and reducing reliance on Western financial networks."
    },
    {
        question: "How does the 15th FYP shift from the 14th Five-Year Plan?",
        answer: "The 15th FYP transitions from dual-circulation recovery to structural de-risking and technological fortress building. Property-led growth is permanently replaced with advanced manufacturing, R&D intensity, and supply chain sovereignty."
    },
    {
        question: "Which quantitative metrics track China's 15th FYP execution?",
        answer: "Key telemetry indicators include national gross R&D expenditure as a percentage of GDP (>2.8%), domestic semiconductor self-sufficiency rates, strategic petroleum and grain reserve levels, and digital economy contribution to total output."
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

export const China15thFYPLab: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    const { data: primaryMetric } = useLatestMetric(MID.CN_GDP_GROWTH_YOY);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);

    return (
        <>
        <SEOManager
            title="China 15th Five-Year Plan Lab — 2026–2030 Strategic Telemetry"
            description="Institutional-grade telemetry tracking China's 15th Five-Year Plan (2026–2030): high-quality development targets, technological self-reliance, R&D intensity, and supply chain sovereignty."
            keywords={['China five-year plan', '15th FYP', 'China 2026-2030', 'technological self-reliance', 'China macro', 'CPC policy', 'semiconductor independence']}
            jsonLd={[
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    'name': 'China 15th Five-Year Plan Lab',
                    'url': 'https://graphiquestor.com/labs/china-15th-fyp',
                    'isPartOf': { '@id': 'https://graphiquestor.com/#website' },
                    'breadcrumb': {
                        '@type': 'BreadcrumbList',
                        'itemListElement': [
                            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://graphiquestor.com/' },
                            { '@type': 'ListItem', 'position': 2, 'name': 'Observatory', 'item': 'https://graphiquestor.com/macro-observatory' },
                            { '@type': 'ListItem', 'position': 3, 'name': 'China 15th Five-Year Plan Lab' }
                        ]
                    }
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'Dataset',
                    'name': 'China 15th Five-Year Plan Data',
                    'description': 'Tracking China 2026-2030 high-quality development targets and supply chain independence metrics.',
                    'url': 'https://graphiquestor.com/labs/china-15th-fyp',
                    'isAccessibleForFree': true,
                    'creator': {
                        '@type': 'Organization',
                        'name': 'GraphiQuestor'
                    }
                },
                faqJsonLd
            ]}
        />
        <div className="min-h-screen text-slate-200 selection:bg-blue-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-500/5 blur-[150px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="page-shell relative z-10 pb-24">
                {/* Header Section */}
                <LabPageHeader
                    trail={[{ label: 'Home', to: '/' }, { label: 'Observatory', to: '/macro-observatory/' }]}
                    current="China 15th Five-Year Plan"
                    badge="Mission Intelligence Lab"
                    badgeIcon={<Flag size={12} />}
                    title={<>China 15th <span className="text-blue-400">Five-Year Plan</span></>}
                    status={<FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />}
                    thesis="An institutional-grade telemetry dashboard tracking the 2026–2030 roadmap for high-quality development, technological self-reliance, and national economic security."
                >
                    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-border text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Active Monitoring
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] tracking-wider uppercase rounded-xl px-6"
                            >
                                <Download size={14} className="mr-2" />
                                Download Strategist PDF
                            </Button>
                            <Button
                                variant="outline"
                                className="border-border text-slate-300 hover:bg-white/5 hover:border-white/20 font-semibold text-[11px] tracking-wider uppercase rounded-xl px-6"
                            >
                                <Share2 size={14} className="mr-2" />
                                Share Intelligence
                            </Button>
                        </div>
                    </div>
                </LabPageHeader>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Hero Timeline */}
                        <Card className="bg-card/40 border-border overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-6 border-b border-border flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <TerminalIcon className="text-red-500" size={18} />
                                        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">2026-2030 Strategic Milestone Timeline</h2>
                                    </div>
                                    <Info size={14} className="text-muted-foreground cursor-help" />
                                </div>
                                <FYP_HeroTimeline />
                            </CardContent>
                        </Card>

                        {/* Quantitative Target Grid */}
                        <FYP_TargetGrid />
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Radar Component */}
                        <FYP_MissionControlRadar />

                        {/* Alpha Insight Box */}
                        <Card className="bg-red-500/5 border-red-500/20">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-2 text-red-500 uppercase font-semibold text-xs tracking-wider">
                                    <Shield size={16} />
                                    Strategist Deep Insight
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                    The 15th FYP represents a fundamental shift from <span className="text-white italic">"Growth at any cost"</span> to <span className="text-white italic">"High-quality resilience."</span> The key metric to watch is R&D growth and supply chain self-sufficiency indices, which now carry higher political weighting than raw GDP.
                                </p>
                                <div className="pt-4 border-t border-red-500/10">
                                    <div className="text-xs text-red-400 uppercase font-semibold mb-2 opacity-60 italic">Key Tipping Point: 2027</div>
                                    <div className="text-xs font-bold text-slate-200">Military centennial goals and semiconductor node independence parity targets align.</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Secondary Layers */}
                <div className="space-y-16">
                    <ComparisonToggle14v15 />
                    <FYP_ImpactHeatmap />
                </div>

                {/* FAQ Section */}
                <div className="mt-16 p-8 bg-white/[0.02] border border-border rounded-xl">
                    <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {faqItems.map(({ question, answer }) => (
                            <div key={question} className="space-y-1">
                                <h3 className="text-sm font-bold text-red-400">{question}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">{answer}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="mt-24 pt-12 border-t border-border flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
                    <div className="p-3 rounded-full bg-red-500/10">
                        <ArrowUpRight className="text-red-500 w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-heading italic">
                        "Development and Security must be in dynamic equilibrium."
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Data source: Central Committee of the Communist Party of China (CPC), Official Release (March 2026). Forecast models internalized from GraphiQuestor Quantitative Intelligence.
                    </p>
                </div>
                <RelatedContent />
                <RelatedMetrics />
            </div>
        </div>
        </>
    );
};
