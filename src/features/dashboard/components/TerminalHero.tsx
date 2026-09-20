import React from 'react';
import { TrailLink as Link } from '@/components/TrailLink';
import { Radio, ArrowRight, Database, Activity } from 'lucide-react';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { METRIC_IDS as MID } from '@/constants/metricIds';
export const TerminalHero: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.FED_BALANCE_SHEET);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);

    return (
        <section
            id="terminal-hero"
            className="relative mb-5 overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm"
        >
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-4xl">
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

                    <h1 className="mb-2 text-2xl font-black leading-tight tracking-heading text-foreground sm:text-3xl">
                        Global macro state
                    </h1>

                    <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Observe structural shifts across liquidity, sovereign risk, rates, energy, and regional macro data.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <a
                            href="#key-telemetry"
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-muted px-4 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-foreground transition-colors shadow-sm"
                        >
                            View live telemetry
                            <ArrowRight size={14} />
                        </a>
                        <Link
                            to="/regime-digest"
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-uppercase text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-500/20"
                        >
                            <Radio size={14} />
                            Read regime digest
                        </Link>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-border bg-background p-4 text-right shadow-sm">
                    <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-uppercase text-muted-foreground">
                        <Database size={12} />
                        Live Feed Status
                    </div>
                    <div className="flex items-center justify-end gap-2 text-2xl font-black text-foreground font-mono"><Activity size={18} className="text-emerald-500" /> Live</div>
                    <div className="text-[10px] font-bold uppercase tracking-uppercase text-muted-foreground">
                        Official source telemetry
                    </div>
                </div>
            </div>

            <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <span>Liquidity</span><span>Rates</span><span>Sovereign risk</span><span>Energy</span><span>Regional pulse</span>
            </div>
        </section>
    );
};
