import React from 'react';
import { TrailLink as Link } from '@/components/TrailLink';
import { Shield, BookOpen, Radio, ArrowRight, Database, FlaskConical } from 'lucide-react';
import { BrandConfig } from '@/config/brandConfig';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { GlassDock } from '@/components/ui/liquid-glass';

const pillars = [
    {
        icon: Shield,
        label: 'Sovereign & Central Bank Intelligence',
        detail: 'Fiscal dominance, debt maturity walls, auction demand, and reserve composition — sourced from FRED, Treasury, IMF COFER, and RBI DBIE.',
        accent: 'text-blue-400',
    },
    {
        icon: FlaskConical,
        label: 'Proprietary Metrics',
        detail: 'Net Liquidity Z-Score, M2/Gold Ratio, Fiscal Dominance Meter, India Credit Cycle Clock — institutional-grade composites with published methodology.',
        accent: 'text-amber-400',
    },
    {
        icon: BookOpen,
        label: 'Glossary Depth',
        detail: '37+ institutional definitions with live data cross-links, formulas, and methodology articles — built for central bank research desks.',
        accent: 'text-emerald-400',
    },
];

export const TerminalHero: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.FED_BALANCE_SHEET);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);

    return (
        <section
            id="terminal-hero"
            className="relative mb-10 overflow-hidden rounded-lg border border-border bg-card dark:bg-slate-900/50 p-6 sm:p-8 shadow-sm dark:shadow-2xl backdrop-blur-xl"
        >
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                            Institutional Macro Terminal
                        </span>
                        <FreshnessChip
                            status={dataFreshness.state}
                            lastUpdated={primaryMetric?.lastUpdated}
                            isProvisional={primaryMetric?.isProvisional}
                            sourceRef={primaryMetric?.sourceRef}
                            provenance={primaryMetric?.provenance}
                        />
                    </div>

                    <h1 className="mb-3 text-2xl font-black uppercase leading-tight tracking-heading text-foreground sm:text-3xl lg:text-4xl">
                        Sovereign &amp; Central Bank Macro Intelligence
                    </h1>

                    <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base font-medium">
                        {BrandConfig.name} surfaces real-time telemetry on global liquidity, fiscal dominance,
                        de-dollarization, and India/China macro dynamics — with proprietary composites, live data
                        provenance, and a deep institutional glossary. Observe structural reality; do not forecast.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <a
                            href="#start-exploring"
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-muted px-4 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-foreground transition-colors shadow-sm"
                        >
                            Start Exploring
                            <ArrowRight size={14} />
                        </a>
                        <Link
                            to="/glossary"
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-emerald-800 dark:text-emerald-300 transition-colors hover:bg-emerald-500/20"
                        >
                            <BookOpen size={14} />
                            Institutional Glossary
                        </Link>
                        <Link
                            to="/regime-digest"
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-500/20"
                        >
                            <Radio size={14} />
                            Regime Digest
                        </Link>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-border bg-card p-4 text-right shadow-sm">
                    <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-uppercase text-muted-foreground">
                        <Database size={12} />
                        Live Feed Status
                    </div>
                    <div className="text-2xl font-black text-foreground font-mono">15+</div>
                    <div className="text-[10px] font-bold uppercase tracking-uppercase text-muted-foreground">
                        Official Sources · Zero Mock Data
                    </div>
                </div>
            </div>

            <div className="relative mt-6 border-t border-border pt-5">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Quick views</div>
                <GlassDock
                    items={[
                        { label: 'Liquidity', detail: 'Net liquidity proxy', href: '#net-liquidity' },
                        { label: 'Sovereign risk', detail: 'Stress matrix', href: '#sovereign-risk' },
                        { label: 'Energy', detail: 'Security telemetry', href: '#energy-markets' },
                    ]}
                    className="max-w-3xl rounded-lg"
                />
            </div>

            <div className="relative mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-3">
                {pillars.map((pillar) => (
                    <div
                        key={pillar.label}
                        className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 shadow-sm"
                    >
                        <div className={`mb-2 flex items-center gap-2 ${pillar.accent}`}>
                            <pillar.icon size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                                {pillar.label}
                            </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground font-medium">{pillar.detail}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
