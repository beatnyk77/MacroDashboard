import React from 'react';
import { useParams } from 'react-router-dom';
import { TrailLink as Link } from '@/components/TrailLink';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChevronRight, Database, BookOpen, Activity, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { ShareButton } from '@/components/ShareButton';
import { ExportCSVButton } from '@/components/ExportCSVButton';
import { FreshnessChip } from '@/components/FreshnessChip';
import { SubscribeCard } from '@/components/SubscribeCard';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { useAuthoritySnapshot, useAuthorityHistory } from '@/hooks/useAuthoritySnapshot';
import { DataProvenanceBadge } from '@/components/authority/DataProvenanceBadge';
import { SnapshotBanner } from '@/components/authority/SnapshotBanner';
import { SnapshotTimeline } from '@/components/authority/SnapshotTimeline';
import { AuthorityCitationBlock } from '@/components/authority/AuthorityCitationBlock';
import { trackAuthoritySnapshotView, trackAuthorityDownload } from '@/lib/authority/authorityEvents';
import { METRICS_CATALOG, type MetricEntry } from '@/features/metrics/metricsCatalog';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { getConceptByMetricId } from '@/lib/conceptHub';
import { ConceptHierarchyBanner } from '@/components/seo/ConceptHierarchyBanner';
import { metricPrimaryMeta, metricSnapshotMeta } from '@/lib/seoTemplates';
import { InstitutionalAccessStrip } from '@/components/growth/InstitutionalAccessStrip';

/**
 * /metrics/:id — programmatic SEO pages for proprietary metrics (roadmap F5).
 * One page per METRICS_CATALOG entry: plain-English methodology, formula,
 * interpretation bands, FAQ + Dataset JSON-LD, and — where a time series is
 * wired below — a live chart with CSV export.
 */

interface SeriesPoint {
    date: string;
    value: number;
}

interface GenericMetricRow {
    metric_id: string;
    metric_name: string | null;
    category: string | null;
    tier: string | null;
    unit: string | null;
    unit_label: string | null;
    native_frequency: string | null;
    display_frequency: string | null;
    expected_interval_days: number | null;
    as_of_date: string | null;
    last_updated_at: string | null;
    value: number | null;
    staleness_flag: string | null;
    source_name: string | null;
    source_ref: string | null;
    provenance: string | null;
    is_provisional: boolean | null;
}

const dbStatusToChip = (status: string | null) => {
    if (status === 'fresh') return 'fresh' as const;
    if (status === 'lagged') return 'lagged' as const;
    if (status === 'very_lagged') return 'stale' as const;
    return 'no_data' as const;
};

const formatMetricValue = (value: number | null | undefined, unitLabel?: string | null) => {
    if (value == null || !Number.isFinite(Number(value))) return '—';
    const n = Number(value);
    const suffix = unitLabel && unitLabel.length <= 10 ? ` ${unitLabel}` : '';
    if (Math.abs(n) >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T${suffix}`;
    if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B${suffix}`;
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M${suffix}`;
    if (Math.abs(n) >= 100) return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}${suffix}`;
    if (Math.abs(n) >= 10) return `${n.toFixed(2)}${suffix}`;
    return `${n.toFixed(3).replace(/\.?0+$/, '')}${suffix}`;
};

/** Catalog id → live time-series source. Entries without a mapping render the
 *  methodology layout without a chart (never fabricate data). */
const SERIES_SOURCES: Record<string, { kind: 'view-net-liquidity' } | { kind: 'observations'; metricId: string }> = {
    'net-liquidity': { kind: 'view-net-liquidity' },
    'net-liquidity-zscore': { kind: 'view-net-liquidity' },
    'debt-gold-zscore': { kind: 'observations', metricId: MID.RATIO_DEBT_GOLD },
    'china-iceberg-ratio': { kind: 'observations', metricId: MID.CN_ICEBERG_RATIO },
    'global-usd-reserve-share': { kind: 'observations', metricId: MID.GLOBAL_USD_SHARE_PCT },
    'm2-gold-ratio': { kind: 'observations', metricId: MID.RATIO_M2_GOLD },
    'fed-monetization-ratio': { kind: 'observations', metricId: MID.FED_BALANCE_SHEET },
    'india-credit-cycle': { kind: 'observations', metricId: MID.IN_REPO_RATE },
    'gold-silver-ratio': { kind: 'observations', metricId: MID.RATIO_GOLD_SILVER },
    'dxy-dollar-index': { kind: 'observations', metricId: MID.DXY_INDEX },
    'vix-volatility-index': { kind: 'observations', metricId: MID.VIX_INDEX },
    'treasury-10y-yield': { kind: 'observations', metricId: MID.UST_10Y_YIELD },
    'brent-crude-oil': { kind: 'observations', metricId: MID.BRENT_CRUDE_PRICE },
    'china-lgfv-stress': { kind: 'observations', metricId: MID.CN_LGFV_STRESS_INDEX },
    'india-gdp-growth': { kind: 'observations', metricId: MID.IN_GDP_GROWTH_YOY },
    'treasury-auction-demand': { kind: 'observations', metricId: MID.US_TREASURY_10Y_DEMAND_SCORE },
    'us-debt-maturity-wall': { kind: 'observations', metricId: MID.US_DEBT_MATURING_12M_TN },
    'wti-physical-stress': { kind: 'observations', metricId: MID.WTI_CRUDE_PRICE },
    'cftc-cot-positioning': { kind: 'observations', metricId: MID.COT_UST_10Y_NET_SPEC },
    'g20-fiscal-vulnerability': { kind: 'observations', metricId: MID.G20_DEBT_GDP_PCT },
    'china-monetization-pressure': { kind: 'observations', metricId: MID.CN_MONETIZATION_PRESSURE },
};

function seriesMetricId(entryId: string | undefined): string | undefined {
    if (!entryId) return undefined;
    const source = SERIES_SOURCES[entryId];
    if (!source || source.kind === 'view-net-liquidity') return undefined;
    return source.metricId;
}

function useMetricSeries(entryId: string | undefined) {
    const source = entryId ? SERIES_SOURCES[entryId] : undefined;
    return useQuery({
        queryKey: ['metric-page-series', entryId],
        enabled: !!source,
        staleTime: 1000 * 60 * 30,
        queryFn: async (): Promise<SeriesPoint[]> => {
            if (!source) return [];
            if (source.kind === 'view-net-liquidity') {
                const { data, error } = await supabase
                    .from('vw_net_liquidity')
                    .select('as_of_date, value')
                    .order('as_of_date', { ascending: false })
                    .limit(365);
                if (error) throw error;
                return (data ?? [])
                    .map((r: any) => ({ date: (r.as_of_date ?? '') as string, value: Number(r.value) }))
                    .filter(p => p.date && Number.isFinite(p.value))
                    .reverse();
            }
            const { data, error } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', source.metricId)
                .order('as_of_date', { ascending: false })
                .limit(365);
            if (error) throw error;
            return (data ?? [])
                .map((r: any) => ({ date: r.as_of_date as string, value: Number(r.value) }))
                .filter(p => Number.isFinite(p.value))
                .reverse();
        },
    });
}

function useGenericMetric(metricId: string | undefined) {
    return useQuery({
        queryKey: ['generic-metric-page', metricId],
        enabled: !!metricId,
        staleTime: 1000 * 60 * 5,
        queryFn: async (): Promise<{ latest: GenericMetricRow | null; series: SeriesPoint[] }> => {
            if (!metricId) return { latest: null, series: [] };
            const [latestRes, historyRes] = await Promise.all([
                supabase
                    .from('vw_latest_metrics')
                    .select('metric_id, metric_name, category, tier, unit, unit_label, native_frequency, display_frequency, expected_interval_days, as_of_date, last_updated_at, value, staleness_flag, source_name, source_ref, provenance, is_provisional')
                    .eq('metric_id', metricId)
                    .maybeSingle(),
                supabase
                    .from('metric_observations')
                    .select('as_of_date, value')
                    .eq('metric_id', metricId)
                    .order('as_of_date', { ascending: false })
                    .limit(365),
            ]);
            if (latestRes.error) throw latestRes.error;
            if (historyRes.error) throw historyRes.error;
            return {
                latest: (latestRes.data as GenericMetricRow | null) ?? null,
                series: (historyRes.data ?? [])
                    .map((r: any) => ({ date: r.as_of_date as string, value: Number(r.value) }))
                    .filter((point) => point.date && Number.isFinite(point.value))
                    .reverse(),
            };
        },
    });
}

const GenericMetricPage: React.FC<{ metricId: string }> = ({ metricId }) => {
    const { data, isLoading } = useGenericMetric(metricId);
    const latest = data?.latest;
    const series = data?.series ?? [];
    const observationFreshness = getStaleness(latest?.as_of_date, latest?.native_frequency ?? undefined);
    const chipStatus = observationFreshness.state === 'fresh'
        ? dbStatusToChip(latest?.staleness_flag ?? null)
        : observationFreshness.state;
    const title = latest?.metric_name ?? metricId;

    if (isLoading) {
        return (
            <div className="mx-auto flex min-h-[520px] w-full max-w-4xl items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white/35">
                <Activity size={14} className="animate-pulse" /> Loading metric
            </div>
        );
    }

    if (!latest) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center">
                <SEOManager title="Metric Not Found" description={`No live metric found for ${metricId}.`} robots="noindex, follow" />
                <AlertTriangle className="mx-auto mb-4 text-amber-300" size={28} />
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">Metric unavailable</h1>
                <p className="mt-3 text-sm text-muted-foreground">No live `vw_latest_metrics` row exists for `{metricId}`.</p>
                <Link to="/metrics/" className="mt-6 inline-flex text-sm font-bold text-blue-300 hover:underline">Open metrics explorer</Link>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
            <SEOManager
                title={`${title} | Live Metric`}
                description={`Live GraphiQuestor metric ${metricId}: latest observation, history, source, cadence, and freshness state.`}
                keywords={[metricId, title, latest.category ?? 'macro metric', 'live metric data']}
                canonical={`/metrics/${encodeURIComponent(metricId)}/`}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'Dataset',
                    name: `${title} time series`,
                    description: `Latest and historical observations for ${metricId}.`,
                    variableMeasured: title,
                    temporalCoverage: latest.as_of_date ? `../${latest.as_of_date}` : undefined,
                    creator: { '@type': 'Organization', name: 'GraphiQuestor', url: 'https://graphiquestor.com' },
                }}
            />
            <nav className="mb-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/30">
                <Link to="/metrics/" className="hover:text-blue-400 transition-colors">Metrics</Link>
                <ChevronRight size={12} />
                <span className="text-white/60">{metricId}</span>
            </nav>

            <header className="mb-8 border-b border-white/10 pb-6">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/80">{latest.category ?? 'Live Metric'}</div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white">{title}</h1>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-2xl font-black tabular-nums text-white">{formatMetricValue(latest.value, latest.unit_label)}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Observation {latest.as_of_date ?? 'unavailable'}
                    </span>
                    <FreshnessChip
                        status={chipStatus}
                        lastUpdated={latest.as_of_date ?? undefined}
                        label={observationFreshness.state !== 'fresh' ? observationFreshness.label : undefined}
                        isProvisional={latest.is_provisional === true}
                        sourceRef={latest.source_ref}
                        provenance={latest.provenance}
                    />
                </div>
            </header>

            <div className="grid gap-4 md:grid-cols-4">
                <Fact label="Metric ID" value={metricId} mono />
                <Fact label="Cadence" value={latest.native_frequency ?? '—'} />
                <Fact label="Source" value={latest.source_name ?? latest.source_ref ?? 'Internal Analytics'} />
                <Fact label="Pipeline refresh" value={latest.last_updated_at ? new Date(latest.last_updated_at).toLocaleString() : '—'} />
            </div>

            {series.length > 1 && (
                <section className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-white/40">Time Series</h2>
                        <ExportCSVButton data={series} filename={`graphiquestor-${metricId}`} />
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} minTickGap={48} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} width={64} domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                                />
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            <section className="mt-8 space-y-3 border-t border-white/10 pt-6 text-[12px]">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-white/40">Data provenance</h2>
                <p className="flex items-start gap-1.5 leading-relaxed text-white/50">
                    <Database size={13} className="mt-0.5 flex-shrink-0 text-white/40" />
                    <span>
                        Latest observation from `vw_latest_metrics`; history from `metric_observations`. Freshness above is based on the observation date and native cadence. Pipeline refresh is shown separately to avoid confusing a rerun with a new observation.
                    </span>
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <Link to="/metrics/" className="font-bold text-blue-400 hover:underline">All live metrics →</Link>
                    <Link to="/api-docs/" className="font-bold text-blue-400 hover:underline">Pull via API →</Link>
                </div>
            </section>
        </div>
    );
};

const Fact: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[9px] font-black uppercase tracking-widest text-white/35">{label}</div>
        <div className={`mt-2 break-words text-sm font-bold text-white/80 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
);

function buildJsonLd(entry: MetricEntry, hasSeries: boolean, latestDate?: string, snapshotId?: string) {
    const url = snapshotId 
        ? `https://graphiquestor.com/metrics/${entry.id}/history/${snapshotId}`
        : `https://graphiquestor.com/metrics/${entry.id}`;
    const org = {
        '@type': 'Organization',
        name: 'GraphiQuestor',
        url: 'https://graphiquestor.com',
        logo: 'https://graphiquestor.com/hero-preview.jpg',
        sameAs: ['https://graphiquestor.com/about/', 'https://graphiquestor.com/for-researchers/'],
    };
    const faq = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: `What is the ${entry.name}?`,
                acceptedAnswer: { '@type': 'Answer', text: entry.intuition.replace(/\s+/g, ' ').trim() },
            },
            {
                '@type': 'Question',
                name: `How is the ${entry.name} calculated?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `${entry.formula}. Components: ${entry.components.join('; ')}`.replace(/\s+/g, ' ').trim(),
                },
            },
            {
                '@type': 'Question',
                name: `How do institutions use the ${entry.name}?`,
                acceptedAnswer: { '@type': 'Answer', text: entry.institutionalUse.replace(/\s+/g, ' ').trim() },
            },
            {
                '@type': 'Question',
                name: `What data sources power the ${entry.name}?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `GraphiQuestor computes the ${entry.name} from: ${entry.sources.join('; ')}. Methodology and refresh cadence are documented on this page and linked methods articles.`,
                },
            },
        ],
    };
    const webPage = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: entry.name,
        url,
        description: entry.intuition.replace(/\s+/g, ' ').trim().slice(0, 300),
        isPartOf: { '@type': 'WebSite', name: 'GraphiQuestor', url: 'https://graphiquestor.com' },
        publisher: org,
        about: { '@type': 'Thing', name: entry.name },
    };
    if (!hasSeries) return [webPage, faq];
    return [
        webPage,
        faq,
        {
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: `${entry.name} — time series`,
            description: `Historical time series for the ${entry.name}, updated automatically from official sources (${entry.sources.join(', ')}).`,
            url,
            license: 'https://graphiquestor.com/terms',
            creator: org,
            ...(latestDate ? { temporalCoverage: `../${latestDate}` } : {}),
        },
    ];
}

export const MetricPage: React.FC = () => {
    const { id, snapshotId } = useParams<{ id: string; snapshotId?: string }>();
    const decodedId = id ? decodeURIComponent(id) : undefined;
    const entry = METRICS_CATALOG.find(m => m.id === decodedId);
    const { data: series } = useMetricSeries(entry?.id);
    const liveMetricId = seriesMetricId(entry?.id);
    const { data: liveMetric } = useLatestMetric(liveMetricId ?? '');
    const { data: snapshot } = useAuthoritySnapshot(id, snapshotId);
    const { data: history } = useAuthorityHistory(id);
    
    const freshness = liveMetric
        ? getStaleness(liveMetric.lastUpdated, liveMetric.frequency)
        : null;
    const shareRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (entry) {
            trackAuthoritySnapshotView(entry.id, snapshotId, !!snapshotId);
        }
    }, [entry, snapshotId]);

    if (!entry) {
        return <GenericMetricPage metricId={decodedId ?? ''} />;
    }

    const latest = series && series.length > 0 ? series[series.length - 1] : undefined;
    const meta = snapshotId && snapshot 
        ? metricSnapshotMeta(entry.name, entry.id, snapshot.observed_at?.split('T')[0] ?? '')
        : metricPrimaryMeta(entry.name, entry.id);
    const concept = getConceptByMetricId(entry.id);

    return (
        <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <SEOManager
                title={meta.title}
                description={meta.description}
                keywords={[entry.name, entry.category, 'macro metric', 'methodology', ...entry.sources]}
                canonical={snapshotId ? `https://graphiquestor.com/metrics/${entry.id}/history/${snapshotId}` : `https://graphiquestor.com/metrics/${entry.id}`}
                jsonLd={buildJsonLd(entry, !!latest, latest?.date, snapshotId)}
            />

            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/30">
                <Link to="/methodology" className="hover:text-blue-400 transition-colors">Methodology</Link>
                <ChevronRight size={12} />
                <span className="text-white/60">{entry.name}</span>
            </nav>

            {concept && <ConceptHierarchyBanner role="primary" concept={concept} />}

            <div ref={shareRef} className="relative group space-y-8">
                <div className="absolute right-0 top-0 z-10">
                    <ShareButton
                        targetRef={shareRef}
                        title={entry.name}
                        dataSource={entry.sources.join(', ')}
                        href={`/metrics/${entry.id}`}
                    />
                </div>

                {/* Header */}
                <header className="space-y-3 border-b border-white/10 pb-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/80">{entry.category}</div>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        {snapshotId ? `Snapshot: ${entry.name}` : `Live terminal: ${entry.name}`}
                    </h1>
                    
                    {snapshot && snapshotId && (
                        <SnapshotBanner snapshot={snapshot} className="mb-4" />
                    )}

                    {(latest || liveMetric || (snapshot && snapshotId)) && (
                        <div className="flex flex-wrap items-center gap-3 text-[12px] font-bold text-white/50">
                            <span className="text-white text-lg font-black">
                                {(() => {
                                    const v = snapshotId && snapshot ? snapshot.value : (liveMetric?.value ?? latest?.value);
                                    if (v == null) return '—';
                                    return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2);
                                })()}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 uppercase tracking-widest text-[10px]">
                                Last observation {snapshotId && snapshot ? snapshot.observed_at?.split('T')[0] : (liveMetric?.lastUpdated ?? latest?.date)}
                            </span>
                            {snapshotId && snapshot ? (
                                <DataProvenanceBadge snapshot={snapshot} />
                            ) : freshness && (
                                <FreshnessChip
                                    status={freshness.state}
                                    lastUpdated={liveMetric?.lastUpdated}
                                    label={freshness.label}
                                    isProvisional={liveMetric?.isProvisional}
                                    sourceRef={liveMetric?.sourceRef}
                                    provenance={liveMetric?.provenance}
                                />
                            )}
                        </div>
                    )}
                </header>

                {/* Chart */}
                {series && series.length > 1 && (
                    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-[11px] font-black uppercase tracking-widest text-white/40">Time Series</h2>
                            <div onClick={() => trackAuthorityDownload(entry.id, 'csv', snapshotId)}>
                                <ExportCSVButton data={series} filename={`graphiquestor-${entry.id}`} />
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} minTickGap={48} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} width={56} domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ background: '#0b1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                )}

                {/* Formula */}
                <section>
                    <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/40">Formula</h2>
                    <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 font-mono text-[13px] text-emerald-400 whitespace-pre-wrap">{entry.formula}</pre>
                    <ul className="mt-4 space-y-2">
                        {entry.components.map((c, i) => (
                            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-white/60">
                                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-blue-400" />
                                {c}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Intuition */}
                <section>
                    <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/40">Why It Matters</h2>
                    <p className="text-[14px] leading-relaxed text-white/70">{entry.intuition}</p>
                </section>

                {/* Institutional use */}
                <section>
                    <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/40">Institutional Use</h2>
                    <p className="text-[14px] leading-relaxed text-white/70">{entry.institutionalUse}</p>
                </section>

                {/* Interpretation bands */}
                <section>
                    <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/40">How to Read It</h2>
                    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                        {entry.interpretation.map((band, i) => (
                            <div key={i} className={`flex items-center justify-between gap-4 px-4 py-3 text-[13px] ${i > 0 ? 'border-t border-white/[0.05]' : ''}`}>
                                <span className={`font-black uppercase tracking-wider text-[11px] ${band.color}`}>{band.label}</span>
                                <span className="font-mono text-white/50">{band.condition}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Publication History */}
                {history && history.length > 0 && (
                    <section className="pt-4 pb-4">
                        <SnapshotTimeline snapshots={history} currentSnapshotId={snapshotId} />
                    </section>
                )}

                {/* Sources + EEAT */}
                <section className="space-y-3 border-t border-white/10 pt-6 text-[12px]">
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-white/40">Data provenance</h2>
                    <p className="flex items-start gap-1.5 leading-relaxed text-white/50">
                        <Database size={13} className="mt-0.5 flex-shrink-0 text-white/40" />
                        <span>
                            Sources: {entry.sources.join(' · ')}. Computed and published by Kartikay Sharma, CA, for FounderHQ LLP.
                            Values are observational composites — not forecasts. See{' '}
                            <Link to="/about/" className="font-bold text-blue-400 hover:underline">About</Link>
                            {' '}and{' '}
                            <Link to="/for-researchers/" className="font-bold text-blue-400 hover:underline">citation guidelines</Link>.
                        </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        {entry.relatedPage && (
                            <Link to={entry.relatedPage} className="flex items-center gap-1.5 font-bold text-blue-400 hover:underline">
                                <BookOpen size={13} /> {entry.relatedPageLabel ?? 'Methodology deep dive'}
                            </Link>
                        )}
                        <Link to="/methodology" className="font-bold text-blue-400 hover:underline">
                            All metric methodologies →
                        </Link>
                        <Link to="/api-docs/" className="font-bold text-blue-400 hover:underline">
                            Pull via API →
                        </Link>
                    </div>
                </section>

                {/* Citation Kit */}
                <section className="pt-2">
                    <AuthorityCitationBlock
                        metricName={entry.name}
                        metricId={entry.id}
                        snapshotId={snapshotId}
                        observedAt={snapshot?.observed_at ?? liveMetric?.lastUpdated ?? latest?.date}
                    />
                </section>
            </div>

            <div className="mt-10">
                <InstitutionalAccessStrip variant="compact" />
            </div>

            <div className="mt-10">
                <SubscribeCard source="metric-page" />
            </div>
        </div>
    );
};

export default MetricPage;
