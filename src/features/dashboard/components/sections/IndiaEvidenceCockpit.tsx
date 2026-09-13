import React, { useState } from 'react';
import { Activity, ChevronDown, Database, ShieldCheck } from 'lucide-react';
import { DataStatePanel } from '@/components/DataStatePanel';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useIndiaIntelligence, type IndiaDomainResult, type IndiaEvidenceMetric } from '@/hooks/useIndiaIntelligence';

const dateLabel = (date: string | null) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date';
const valueLabel = (metric: IndiaEvidenceMetric) => metric.value == null ? 'Unavailable' : `${metric.state === 'historical' ? 'Historical · ' : ''}${metric.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${metric.unit}`;
const freshness = (metric: IndiaEvidenceMetric) => metric.state === 'observed' ? 'fresh' : metric.state === 'lagged' ? 'lagged' : 'no_data';

const EvidenceRow: React.FC<{ metric: IndiaEvidenceMetric }> = ({ metric }) => (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
        <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-foreground">{metric.label}</div>
            <div className="mt-1 truncate text-[10px] uppercase tracking-wider text-muted-foreground">{metric.source || 'Source unavailable'} · {dateLabel(metric.asOf)}</div>
        </div>
        <div className="shrink-0 text-right">
            <div className={`text-sm font-black ${metric.value == null ? 'text-muted-foreground' : 'text-foreground'}`}>{valueLabel(metric)}</div>
            <FreshnessChip status={freshness(metric)} label={metric.state === 'historical' ? 'HISTORICAL' : undefined} lastUpdated={metric.asOf || undefined} sourceRef={metric.sourceRef} provenance={metric.provenance} isProvisional={metric.isProvisional} />
        </div>
    </div>
);

const DomainCard: React.FC<{ domain: IndiaDomainResult }> = ({ domain }) => (
    <div className="rounded-2xl border border-border bg-card shadow-sm px-4">
        <div className="flex items-center justify-between border-b border-border py-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-foreground"><Activity size={13} className="text-blue-600 dark:text-blue-400" /> {domain.label}</div>
            <span className={`text-[10px] font-black uppercase tracking-wider ${domain.state === 'observed' ? 'text-emerald-700 dark:text-emerald-400' : domain.state === 'lagged' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>{domain.state}</span>
        </div>
        {domain.metrics.map(metric => <EvidenceRow key={metric.id} metric={metric} />)}
        <div className="border-t border-border py-3 text-[10px] uppercase tracking-wider text-muted-foreground">Domain score: {domain.score == null ? 'Unavailable' : domain.score.toFixed(2)}</div>
    </div>
);

export const IndiaEvidenceCockpit: React.FC = () => {
    const { data, isLoading, isError, refetch } = useIndiaIntelligence();
    const [expanded, setExpanded] = useState(false);
    if (isLoading) return <DataStatePanel variant="pending" title="Loading India evidence" description="Checking current observations, publication dates, and provenance." height={260} />;
    if (isError || !data) return <DataStatePanel variant="error" title="India evidence unavailable" description="The live metric registry did not respond. No regime values are shown." onRetry={() => refetch()} height={260} />;
    const regimeColor = data.overallRegime === 'IMPROVING' ? 'text-emerald-700 dark:text-emerald-400' : data.overallRegime === 'DETERIORATING' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400';
    return (
        <section className="rounded-3xl border border-border bg-card shadow-sm p-5 sm:p-7 text-card-foreground" aria-labelledby="india-evidence-title">
            <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400"><ShieldCheck size={13} /> India evidence cockpit</div>
                    <h2 id="india-evidence-title" className="text-xl font-black uppercase tracking-[0.08em] text-foreground sm:text-2xl">Daily India regime</h2>
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">The classification uses current published observations only. Historical records remain context and do not satisfy regime coverage.</p>
                </div>
                <div className="text-right"><div className={`text-sm font-black uppercase tracking-widest ${regimeColor}`}>{data.overallRegime}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{data.observed} observed · {data.lagged} lagged · {data.unavailable} unavailable</div></div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {data.domains.map(domain => <DomainCard key={domain.key} domain={domain} />)}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Score: {data.overallScore == null ? 'Unavailable' : data.overallScore.toFixed(2)}</span>
                <span><Database size={13} className="mr-1 inline" /> Registry: india-regime-v1</span>
                <button type="button" onClick={() => setExpanded(value => !value)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition">Methodology <ChevronDown size={13} className={expanded ? 'rotate-180' : ''} /></button>
            </div>
            {expanded && <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">Seven domains are equally weighted. Each metric uses the latest 20 valid observations, requires at least five observations, and maps percentile or sample z-score evidence to the range −1 to +1. Required domains are Growth, Inflation, Liquidity, Fiscal, Credit, and External. Market flows are optional. Scores at or above 0.35 are improving, scores at or below −0.35 are deteriorating, and intermediate scores are mixed.</div>}
        </section>
    );
};
