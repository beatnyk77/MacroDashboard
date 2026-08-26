import React, { useMemo, useState } from 'react';
import { Activity, ChevronDown, Database, Eye, ShieldCheck } from 'lucide-react';
import { FreshnessChip } from '@/components/FreshnessChip';
import { DataStatePanel } from '@/components/DataStatePanel';
import { useFiscalCockpit, type FiscalCockpitMetric } from '@/hooks/useFiscalCockpit';

const formatValue = (metric: FiscalCockpitMetric) => {
    if (metric.value == null) return 'Unavailable';
    if (metric.unit === '%') return `${metric.value.toFixed(2)}%`;
    if (metric.unit === 'bps') return `${metric.value.toFixed(1)} bps`;
    return `${metric.value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${metric.unit}`;
};

const formatDate = (date: string | null) => date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No published date';

const MetricRow: React.FC<{ metric: FiscalCockpitMetric }> = ({ metric }) => (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-b-0">
        <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white/80">{metric.label}</div>
            <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/35">
                <span>{metric.source || 'Source unavailable'}</span>
                <span>·</span>
                <span>{formatDate(metric.asOf)}</span>
            </div>
        </div>
        <div className="shrink-0 text-right">
            <div className={`text-sm font-black ${metric.value == null ? 'text-white/30' : 'text-white'}`}>{formatValue(metric)}</div>
            <FreshnessChip
                status={metric.freshness}
                lastUpdated={metric.lastUpdated || metric.asOf || undefined}
                sourceRef={metric.sourceRef}
                provenance={metric.provenance}
                isProvisional={metric.isProvisional}
            />
        </div>
    </div>
);

export const FiscalCockpit: React.FC = () => {
    const { data, isLoading, isError, refetch } = useFiscalCockpit();
    const [showCoverage, setShowCoverage] = useState(false);
    const groups = useMemo(() => ['Liquidity', 'Fiscal', 'Market'], []);

    if (isLoading) return <DataStatePanel variant="pending" title="Loading published telemetry" description="The cockpit is checking current observations and provenance." height={260} />;
    if (isError || !data) return <DataStatePanel variant="error" title="Published telemetry unavailable" description="The data service did not return the cockpit registry. No values are shown until it recovers." onRetry={() => refetch()} height={260} />;

    const overall = data.observed === 0 ? 'UNAVAILABLE' : data.lagged > 0 || data.unavailable > 0 ? 'COVERAGE DEGRADED' : 'OBSERVED';
    const statusClass = overall === 'OBSERVED' ? 'text-emerald-400' : overall === 'UNAVAILABLE' ? 'text-white/45' : 'text-amber-400';

    return (
        <section aria-labelledby="fiscal-cockpit-title" className="rounded-3xl border border-blue-400/15 bg-blue-400/[0.035] p-5 sm:p-7">
            <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-300/70">
                        <Eye size={13} /> Evidence cockpit
                    </div>
                    <h2 id="fiscal-cockpit-title" className="text-xl font-black uppercase tracking-[0.08em] text-white sm:text-2xl">US Treasury & Fiscal Monitor</h2>
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/45">Latest published observations are separated from market-data freshness. Values with missing, provisional, or unapproved provenance remain unavailable.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-black uppercase tracking-widest ${statusClass}`}>{overall}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/35">{data.observed}/{data.metrics.length} usable</span>
                </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {groups.map(group => {
                    const metrics = data.metrics.filter(metric => (group === 'Liquidity' ? ['TGA_BALANCE_BN', 'RRP_BALANCE_BN', 'SRF_USAGE', 'FX_SWAP_LINES'].includes(metric.id) : group === 'Fiscal' ? ['US_DEBT_MATURING_12M_TN', 'US_FEDERAL_INTEREST_PAYMENTS', 'US_FISCAL_INTEREST_TO_RECEIPTS_PCT', 'US_FISCAL_INTEREST_TO_GDP_PCT'].includes(metric.id) : true));
                    return (
                        <div key={group} className="rounded-2xl border border-white/[0.07] bg-black/20 px-4">
                            <div className="flex items-center gap-2 border-b border-white/[0.06] py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white/55"><Activity size={13} className="text-blue-300/70" /> {group}</div>
                            {metrics.map(metric => <MetricRow key={metric.id} metric={metric} />)}
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.08] pt-5 text-[10px] uppercase tracking-wider text-white/40">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={13} className="text-emerald-400/70" /> {data.observed} observed</span>
                <span className="inline-flex items-center gap-2"><Activity size={13} className="text-amber-400/70" /> {data.lagged} lagged</span>
                <button type="button" onClick={() => setShowCoverage(value => !value)} className="inline-flex items-center gap-2 text-white/65 transition hover:text-white"><Database size={13} /> {data.unavailable} unavailable <ChevronDown size={13} className={showCoverage ? 'rotate-180' : ''} /></button>
            </div>
            {showCoverage && (
                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Coverage register</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {data.metrics.filter(metric => metric.state === 'unavailable').map(metric => <div key={metric.id} className="text-xs text-white/55"><span className="text-white/75">{metric.label}</span><span className="block text-[10px] text-white/30">{metric.unavailableReason}</span></div>)}
                    </div>
                </div>
            )}
        </section>
    );
};
