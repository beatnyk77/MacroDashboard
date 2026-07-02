import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { SEOManager } from '@/components/SEOManager';
import { BookOpen, FlaskConical, TrendingUp, Shield, Zap, Globe, BarChart3, ChevronDown, ChevronRight, ExternalLink, Bot } from 'lucide-react';
import { InstitutionalAccessStrip } from '@/components/growth/InstitutionalAccessStrip';
import { CiteThisPage } from '@/components/research/CiteThisPage';

// ── Types ─────────────────────────────────────────────────────────────────────

import { METRICS_CATALOG, type MetricEntry } from '@/features/metrics/metricsCatalog';

// Metric definitions now live in src/features/metrics/metricsCatalog.ts —
// shared with the programmatic /metrics/:id pages.
const METRICS: MetricEntry[] = METRICS_CATALOG;

// ── Category Metadata ─────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: 'all', label: 'All Metrics', icon: BookOpen },
    { id: 'Liquidity', label: 'Liquidity', icon: Zap },
    { id: 'Fiscal Health', label: 'Fiscal Health', icon: Shield },
    { id: 'Energy & Commodities', label: 'Energy', icon: FlaskConical },
    { id: 'Credit Quality', label: 'Credit', icon: BarChart3 },
    { id: 'De-Dollarization', label: 'De-Dollarization', icon: Globe },
    { id: 'Sovereign Risk', label: 'Sovereign Risk', icon: TrendingUp },
    { id: 'Statistical Methods', label: 'Statistics', icon: BookOpen },
];

const CATEGORY_COLORS: Record<string, string> = {
    'Liquidity': 'text-terminal-blue border-terminal-blue/30 bg-terminal-blue/10',
    'Fiscal Health': 'text-terminal-rose border-terminal-rose/30 bg-terminal-rose/10',
    'Energy & Commodities': 'text-terminal-gold border-terminal-gold/30 bg-terminal-gold/10',
    'Credit Quality': 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    'De-Dollarization': 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    'Sovereign Risk': 'text-terminal-emerald border-terminal-emerald/30 bg-terminal-emerald/10',
    'Statistical Methods': 'text-terminal-muted border-terminal-muted/30 bg-terminal-muted/10',
};

// ── MetricCard ────────────────────────────────────────────────────────────────

const MetricCard: React.FC<{ metric: MetricEntry }> = ({ metric }) => {
    const [expanded, setExpanded] = useState(false);
    const colorClass = CATEGORY_COLORS[metric.category] ?? 'text-terminal-muted border-border bg-muted/10';

    return (
        <article
            id={metric.id}
            className="group border border-border/60 rounded-2xl bg-card/30 overflow-hidden transition-all duration-300 hover:border-border"
            aria-label={metric.name}
        >
            {/* Header */}
            <button
                className="w-full text-left p-6 flex items-start gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
                onClick={() => setExpanded(prev => !prev)}
                aria-expanded={expanded}
                aria-controls={`metric-body-${metric.id}`}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-uppercase border',
                            colorClass
                        )}>
                            {metric.category}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-heading leading-tight">
                        {metric.name}
                    </h3>
                    <code className="block mt-2 text-xs text-terminal-muted font-mono leading-relaxed">
                        {metric.formula}
                    </code>
                </div>
                <div className="flex-shrink-0 ml-4 text-terminal-muted mt-1">
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
            </button>

            {/* Dedicated metric page — always in the DOM so crawlers discover it */}
            <div className="px-6 pb-4 -mt-2">
                <Link
                    to={`/metrics/${metric.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-uppercase text-terminal-blue hover:underline"
                >
                    Full metric page <ExternalLink size={11} />
                </Link>
            </div>

            {/* Expandable Body */}
            {expanded && (
                <div
                    id={`metric-body-${metric.id}`}
                    className="px-6 pb-6 space-y-6 border-t border-border/40"
                >
                    {/* Formula Components */}
                    <section aria-label="Formula components">
                        <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3 pt-5">
                            Formula Components
                        </h4>
                        <ul className="space-y-2">
                            {metric.components.map((comp, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-terminal-blue flex-shrink-0 mt-2" />
                                    <code className="font-mono text-xs leading-relaxed">{comp}</code>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Intuition */}
                    <section aria-label="Economic intuition">
                        <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3">
                            Economic Intuition
                        </h4>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                            {metric.intuition}
                        </p>
                    </section>

                    {/* Institutional Use */}
                    <section aria-label="Institutional use cases">
                        <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3">
                            Institutional Use Cases
                        </h4>
                        <div className="p-4 rounded-xl border border-terminal-blue/20 bg-terminal-blue/[0.04]">
                            <p className="text-sm text-foreground/70 leading-relaxed">
                                {metric.institutionalUse}
                            </p>
                        </div>
                    </section>

                    {/* Signal Interpretation */}
                    <section aria-label="Signal interpretation table">
                        <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3">
                            Signal Interpretation
                        </h4>
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/20 border-b border-border/50">
                                    <tr>
                                        <th className="py-2 px-4 text-left font-bold text-terminal-muted">Signal</th>
                                        <th className="py-2 px-4 text-left font-bold text-terminal-muted">Condition</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {metric.interpretation.map((row, i) => (
                                        <tr key={i} className="hover:bg-muted/10 transition-colors">
                                            <td className={cn('py-2 px-4 font-bold', row.color)}>{row.label}</td>
                                            <td className="py-2 px-4 font-mono text-terminal-muted">{row.condition}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Footer: Sources + Link */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/30">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mr-2">Sources:</span>
                            {metric.sources.map((src, i) => (
                                <span key={i} className="text-xs text-terminal-muted">
                                    {src}{i < metric.sources.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </div>
                        {metric.relatedPage && (
                            <Link
                                to={metric.relatedPage}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-terminal-blue hover:text-blue-300 transition-colors"
                            >
                                <ExternalLink size={12} />
                                {metric.relatedPageLabel}
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </article>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const METHODOLOGY_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: 'GraphiQuestor Macro Intelligence Methodology',
    headline: 'Metric Methodology & Calculation Framework',
    description: 'Detailed formulas, intuition, and institutional use cases for every derived macro metric on GraphiQuestor, including Net Liquidity Z-Score, Debt/Gold Z-Score, Fiscal Dominance Meter, and Sovereign Stress Index.',
    url: 'https://graphiquestor.com/methodology',
    author: {
        '@type': 'Person',
        name: 'Kartikay Sharma',
        jobTitle: 'Chartered Accountant & Macro Analyst',
        url: 'https://graphiquestor.com/about',
    },
    publisher: {
        '@type': 'Organization',
        name: 'GraphiQuestor',
        url: 'https://graphiquestor.com',
    },
    inLanguage: 'en',
    dateModified: new Date().toISOString().split('T')[0],
};

const METHODOLOGY_HUB_CITATION = {
    title: 'GraphiQuestor Metric Methodology Hub',
    path: '/methodology',
    pageType: 'hub' as const,
    summary:
        'Complete calculation framework for proprietary macro composites — formulas, intuition, institutional use cases, and 25-year Z-score conventions.',
    keyPoints: [
        'Net Liquidity, Debt/Gold, Fiscal Dominance, Energy Dependency, and India Credit Cycle documented.',
        'Every metric links to a deep-dive methods article with live data cross-references.',
        'Designed for citation by AI assistants and institutional research desks.',
    ],
    source: 'GraphiQuestor — see /data-sources for upstream authorities',
};

const FAQ_JSON_LD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "What is the Net Liquidity Index?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Net Liquidity is calculated as Fed Balance Sheet (WALCL) minus the Treasury General Account (TGA) minus the Overnight Reverse Repo (ONRRP). It represents the actual reserves circulating in the financial system."
            }
        },
        {
            "@type": "Question",
            "name": "Why does GraphiQuestor use a 25-year Z-Score?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "A 25-year window is used to capture full debt and monetary cycles post-1971. Shorter windows are too sensitive to recent history, while longer windows include structurally different monetary regimes (like Bretton Woods)."
            }
        },
        {
            "@type": "Question",
            "name": "What is the Fiscal Dominance Meter?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Fiscal dominance occurs when debt service obligations constrain monetary policy. The Meter tracks the ratio of net interest payments to federal revenue, signaling when independent monetary policy is compromised."
            }
        },
        {
            "@type": "Question",
            "name": "How is Sovereign Stress calculated?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "The Sovereign Stress Index (SSI) is a composite score based on CDS spreads, yield curve slopes, FX volatility, and Debt/GDP ratios, all normalized using rolling Z-scores."
            }
        }
    ]
};

export const MetricsMethodologyPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = activeCategory === 'all'
        ? METRICS
        : METRICS.filter(m => m.category === activeCategory);

    return (
        <div className="min-h-screen bg-background">
            <SEOManager
                title="Metric Methodology & Calculation Framework"
                description="Detailed formulas, economic intuition, and institutional use cases for every derived macro metric on GraphiQuestor — Net Liquidity Z-Score, Debt/Gold Z-Score, Fiscal Dominance Meter, Energy Dependency Ratio, and more."
                keywords={[
                    'Net Liquidity Z-Score methodology', 'Debt Gold ratio formula', 'Fiscal Dominance Meter',
                    'Energy Dependency Ratio', 'Sovereign Stress Index', 'macro metric calculation',
                    'institutional macro analysis', 'Z-score financial methodology',
                ]}
                canonicalUrl="https://graphiquestor.com/methodology"
                jsonLd={[METHODOLOGY_JSON_LD, FAQ_JSON_LD]}
            />

            {/* Hero */}
            <header className="w-full border-b border-border/40 bg-card/20 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terminal-blue/10 border border-terminal-blue/20 text-terminal-blue text-[10px] font-black uppercase tracking-uppercase mb-6">
                        <BookOpen size={12} />
                        Methodology Disclosure
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-heading text-foreground mb-4 leading-tight">
                        Metric Methodology &amp;<br />
                        <span className="text-terminal-blue">Calculation Framework</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
                        Every derived metric on this platform is documented with its precise formula,
                        underlying data components, economic intuition, and real-world institutional use cases.
                        All Z-scores use a <strong className="text-foreground">25-year rolling window</strong> to
                        capture full debt and monetary cycles post-1971.
                    </p>

                    {/* Breadcrumb nav */}
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-foreground">Methodology</span>
                    </nav>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-10 space-y-6">
                <InstitutionalAccessStrip />
                <section className="rounded-xl border border-violet-500/15 bg-violet-500/[0.04] p-5 backdrop-blur-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
                            <Bot size={14} />
                            For AI Assistants &amp; Researchers
                        </div>
                        <Link
                            to="/for-researchers"
                            className="text-[10px] font-bold uppercase tracking-uppercase text-violet-400/80 hover:text-violet-300"
                        >
                            Full research hub →
                        </Link>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                        Every methods article includes structured <code className="text-violet-300">#llm-summary</code> blocks
                        and copy-ready citations. Machine-readable index at{' '}
                        <a href="/llms.txt" className="text-violet-400 hover:underline">/llms.txt</a>.
                    </p>
                    <CiteThisPage input={METHODOLOGY_HUB_CITATION} compact />
                </section>
            </div>

            {/* Main content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Principles Grid */}
                <section aria-labelledby="principles-heading" className="mb-16">
                    <h2 id="principles-heading" className="text-2xl font-bold tracking-heading text-foreground mb-8">
                        Core Analytical Principles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Regime-Invariant Design',
                                desc: 'All metrics are normalised against long-run distributions, not recent history. This prevents cycle bias and ensures signals remain comparable across monetary regimes.',
                                color: 'border-terminal-blue/20 bg-terminal-blue/[0.03]',
                                accent: 'text-terminal-blue',
                            },
                            {
                                title: 'Institutional Source Hierarchy',
                                desc: 'Primary sources (FRED, IMF, BIS, RBI DBIE) take precedence over secondary aggregators. Market data (Yahoo Finance) is used only for high-frequency price signals.',
                                color: 'border-terminal-emerald/20 bg-terminal-emerald/[0.03]',
                                accent: 'text-terminal-emerald',
                            },
                            {
                                title: 'Transparent Composition',
                                desc: 'Every composite metric documents its weights and component definitions. There are no black-box signals — every formula is reproducible by any analyst with access to the same inputs.',
                                color: 'border-terminal-gold/20 bg-terminal-gold/[0.03]',
                                accent: 'text-terminal-gold',
                            },
                        ].map((p) => (
                            <Card key={p.title} className={cn('p-6 border', p.color)}>
                                <h3 className={cn('text-base font-bold mb-2', p.accent)}>{p.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Category Filter */}
                <nav aria-label="Category filter" className="flex flex-wrap gap-2 mb-8">
                    {CATEGORIES.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveCategory(id)}
                            className={cn(
                                'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-uppercase border transition-all duration-200',
                                activeCategory === id
                                    ? 'bg-terminal-blue/20 border-terminal-blue/40 text-terminal-blue'
                                    : 'bg-transparent border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                {/* Metrics List */}
                <section aria-labelledby="metrics-heading" className="space-y-4">
                    <h2 id="metrics-heading" className="sr-only">Metric Definitions</h2>
                    {filtered.map(metric => (
                        <MetricCard key={metric.id} metric={metric} />
                    ))}
                </section>

                {/* Regime Detection */}
                <section aria-labelledby="regime-heading" className="mt-20 space-y-8">
                    <div>
                        <h2 id="regime-heading" className="text-2xl font-bold tracking-heading text-foreground mb-2">
                            Macro Regime Classification
                        </h2>
                        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                            The platform classifies the macro environment into three regimes using a deterministic 
                            rules-based model combining normalised liquidity and volatility signals. No machine learning 
                            or probabilistic inference is used — the classification is fully transparent and auditable.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Tightening Risk',
                                rule: 'Net Liquidity Z < −1.5 OR SOFR Spread > 15bps',
                                color: 'border-terminal-rose/20 bg-terminal-rose/[0.03]',
                                textColor: 'text-terminal-rose',
                                desc: 'Central bank liquidity withdrawal is at a pace that historically precedes credit event risk. Reduce duration; increase defensive positioning.',
                            },
                            {
                                title: 'Liquidity Expansion',
                                rule: 'Net Liquidity Z > 1.5 AND SOFR Spread < 5bps',
                                color: 'border-terminal-emerald/20 bg-terminal-emerald/[0.03]',
                                textColor: 'text-terminal-emerald',
                                desc: 'Aggressive central bank accommodation or TGA drain is injecting reserves into the system. Risk appetite historically elevated in this regime.',
                            },
                            {
                                title: 'Neutral / Structural',
                                rule: '−1.5 ≤ Net Liquidity Z ≤ 1.5',
                                color: 'border-border/40',
                                textColor: 'text-muted-foreground',
                                desc: 'Signals within ±1.5σ of the 25-year mean. Market is in a trend-following structural phase. Factor and momentum strategies historically outperform.',
                            },
                        ].map(r => (
                            <Card key={r.title} className={cn('p-6 border', r.color)}>
                                <h3 className={cn('text-base font-bold mb-1', r.textColor)}>{r.title}</h3>
                                <code className="block text-xs font-mono text-muted-foreground mb-3 leading-relaxed">{r.rule}</code>
                                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Cross-link to Data Sources */}
                <aside className="mt-16 p-8 rounded-2xl border border-terminal-blue/20 bg-terminal-blue/[0.03]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Reviewing Our Data Sources?</h3>
                            <p className="text-sm text-muted-foreground">
                                Every metric above is backed by authoritative primary sources with documented refresh cadences.
                            </p>
                        </div>
                        <Link
                            to="/data-sources"
                            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terminal-blue/20 border border-terminal-blue/30 text-terminal-blue text-sm font-bold hover:bg-terminal-blue/30 transition-colors"
                        >
                            <ExternalLink size={14} />
                            View Data Sources
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
};
