import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, Database, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { FreshnessChip, type FreshnessStatus } from '@/components/FreshnessChip';
import { TrailLink } from '@/components/TrailLink';
import { getStaleness } from '@/hooks/useStaleness';

interface LiveMetricRow {
    metric_id: string;
    metric_name: string | null;
    category: string | null;
    tier: string | null;
    unit: string | null;
    unit_label: string | null;
    native_frequency: string | null;
    display_frequency: string | null;
    as_of_date: string | null;
    last_updated_at: string | null;
    value: number | null;
    staleness_flag: string | null;
    source_name: string | null;
    source_ref: string | null;
    is_provisional: boolean | null;
}

const dbStatusToChip = (status: string | null): FreshnessStatus => {
    if (status === 'fresh') return 'fresh';
    if (status === 'lagged') return 'lagged';
    if (status === 'very_lagged') return 'stale';
    return 'no_data';
};

const formatValue = (value: number | null, unitLabel?: string | null) => {
    if (value == null || !Number.isFinite(Number(value))) return '—';
    const n = Number(value);
    const suffix = unitLabel && unitLabel.length <= 8 ? ` ${unitLabel}` : '';
    if (Math.abs(n) >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T${suffix}`;
    if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B${suffix}`;
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M${suffix}`;
    if (Math.abs(n) >= 100) return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}${suffix}`;
    if (Math.abs(n) >= 10) return `${n.toFixed(2)}${suffix}`;
    return `${n.toFixed(3).replace(/\.?0+$/, '')}${suffix}`;
};

export const MetricsExplorerPage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'fresh' | 'review'>('all');

    const { data: metrics, isLoading } = useQuery({
        queryKey: ['metrics-explorer', 'vw_latest_metrics'],
        staleTime: 1000 * 60 * 5,
        queryFn: async (): Promise<LiveMetricRow[]> => {
            const { data, error } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, metric_name, category, tier, unit, unit_label, native_frequency, display_frequency, as_of_date, last_updated_at, value, staleness_flag, source_name, source_ref, is_provisional')
                .order('metric_id', { ascending: true });
            if (error) throw error;
            return (data ?? []) as LiveMetricRow[];
        },
    });

    const rows = metrics ?? [];
    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return rows.filter((row) => {
            const observationFreshness = getStaleness(row.as_of_date, row.native_frequency ?? undefined);
            const needsReview = row.staleness_flag !== 'fresh' || observationFreshness.state !== 'fresh';
            if (statusFilter === 'fresh' && needsReview) return false;
            if (statusFilter === 'review' && !needsReview) return false;
            if (!needle) return true;
            return [
                row.metric_id,
                row.metric_name,
                row.category,
                row.source_name,
                row.native_frequency,
            ].some((value) => String(value ?? '').toLowerCase().includes(needle));
        });
    }, [query, rows, statusFilter]);

    const freshCount = rows.filter((row) => row.staleness_flag === 'fresh' && getStaleness(row.as_of_date, row.native_frequency ?? undefined).state === 'fresh').length;
    const reviewCount = rows.length - freshCount;

    return (
        <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
            <SEOManager
                title="Live Metrics Explorer"
                description="Search every live GraphiQuestor metric with latest observation, cadence, provenance, and freshness status."
                keywords={['macro metrics explorer', 'live macro data', 'GraphiQuestor metrics', 'data provenance']}
                canonical="/metrics/"
            />

            <header className="mb-8 border-b border-white/10 pb-6">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-300">
                    <Database size={12} /> Live metric catalog
                </div>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">Metrics Explorer</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Direct index of `vw_latest_metrics`. Each row links to a live detail page with history, observation date, ingestion timestamp, source, and freshness state.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <Stat label="Live IDs" value={rows.length || '—'} />
                        <Stat label="Current" value={rows.length ? freshCount : '—'} tone="safe" />
                        <Stat label="Review" value={rows.length ? reviewCount : '—'} tone="warn" />
                    </div>
                </div>
            </header>

            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3">
                    <Search size={16} className="text-white/40" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search metric ID, label, source, cadence..."
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    />
                </div>
                <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
                    {[
                        ['all', 'All'],
                        ['fresh', 'Current'],
                        ['review', 'Review'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setStatusFilter(value as typeof statusFilter)}
                            className={`min-h-9 px-3 text-[10px] font-black uppercase tracking-widest transition ${
                                statusFilter === value ? 'rounded-md bg-blue-500/20 text-blue-200' : 'text-white/45 hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
                <table className="w-full min-w-[1100px] text-left">
                    <thead className="border-b border-white/10 bg-white/[0.025] text-[10px] font-black uppercase tracking-widest text-white/35">
                        <tr>
                            <th className="px-4 py-3">Metric</th>
                            <th className="px-4 py-3">Latest</th>
                            <th className="px-4 py-3">Observation</th>
                            <th className="px-4 py-3">Cadence</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                        {filtered.map((row) => {
                            const observationFreshness = getStaleness(row.as_of_date, row.native_frequency ?? undefined);
                            const chipStatus = observationFreshness.state === 'fresh'
                                ? dbStatusToChip(row.staleness_flag)
                                : observationFreshness.state;
                            return (
                                <tr key={row.metric_id} className="transition hover:bg-white/[0.03]">
                                    <td className="px-4 py-3">
                                        <TrailLink to={`/metrics/${encodeURIComponent(row.metric_id)}`} className="font-mono text-sm font-black text-white hover:text-blue-300">
                                            {row.metric_id}
                                        </TrailLink>
                                        <div className="mt-1 max-w-[360px] truncate text-xs text-muted-foreground">{row.metric_name ?? row.category ?? 'Unnamed metric'}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm font-bold tabular-nums text-white">{formatValue(row.value, row.unit_label)}</td>
                                    <td className="px-4 py-3 text-xs text-white/60">{row.as_of_date ?? 'No observation'}</td>
                                    <td className="px-4 py-3 text-xs uppercase tracking-widest text-white/50">{row.native_frequency ?? '—'}</td>
                                    <td className="px-4 py-3 text-xs text-white/55">{row.source_name ?? row.source_ref ?? 'Internal Analytics'}</td>
                                    <td className="px-4 py-3">
                                        <FreshnessChip
                                            status={chipStatus}
                                            lastUpdated={row.as_of_date ?? undefined}
                                            label={observationFreshness.state !== 'fresh' ? observationFreshness.label : undefined}
                                            isProvisional={row.is_provisional === true}
                                            sourceRef={row.source_ref}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {isLoading && (
                    <div className="flex h-32 items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white/35">
                        <Activity size={14} className="animate-pulse" /> Loading metrics
                    </div>
                )}
                {!isLoading && filtered.length === 0 && (
                    <div className="flex h-32 items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white/35">
                        <AlertTriangle size={14} /> No metrics match the current filter
                    </div>
                )}
            </div>
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string | number; tone?: 'safe' | 'warn' }> = ({ label, value, tone }) => (
    <div className="min-w-[88px] rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="text-[9px] font-black uppercase tracking-widest text-white/35">{label}</div>
        <div className={`mt-1 font-mono text-lg font-black ${tone === 'safe' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-white'}`}>{value}</div>
    </div>
);

export default MetricsExplorerPage;
