import React from 'react';
import { Activity, ArrowUpRight, Database, Gauge, Radio, Star } from 'lucide-react';
import { TrailLink as Link } from '@/components/TrailLink';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { useLatestMetric, type MetricData } from '@/hooks/useLatestMetric';
import { useRegime } from '@/hooks/useRegime';
import { getStaleness } from '@/hooks/useStaleness';
import { formatScaledMetric } from '@/utils/formatNumber';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { useDeskWatchlist } from '@/hooks/useDeskWatchlist';

interface AnchorDefinition {
    id: string;
    label: string;
    metricId: string;
    href: string;
    source: string;
}

const ANCHORS: AnchorDefinition[] = [
    { id: 'fed-assets', label: 'Fed assets', metricId: MID.FED_BALANCE_SHEET, href: '#fed-monetization', source: 'FRED' },
    { id: 'tga', label: 'TGA balance', metricId: MID.TGA_BALANCE, href: '#net-liquidity', source: 'Treasury' },
    { id: 'dealer-holdings', label: 'Dealer Treasury holdings', metricId: MID.PRIMARY_DEALER_TREASURY_HOLDINGS_BN, href: '#auction-demand', source: 'Treasury' },
    { id: 'dxy', label: 'DXY', metricId: MID.DXY_INDEX, href: '#treasury-yield', source: 'Market data' },
    { id: 'gold', label: 'Gold', metricId: MID.GOLD_PRICE_USD, href: '#energy-markets', source: 'Market data' },
    { id: 'brent', label: 'Brent', metricId: MID.BRENT_CRUDE_PRICE, href: '#energy-markets', source: 'EIA' },
];

const VIEW_PRESETS = [
    { id: 'core-liquidity', label: 'Core liquidity', target: 'net-liquidity' },
    { id: 'cross-asset', label: 'Cross-asset', target: 'treasury-yield' },
    { id: 'sovereign-risk', label: 'Sovereign risk', target: 'sovereign-risk' },
] as const;

function displayValue(metric: MetricData | null | undefined, metricId: string): string {
    if (!metric || !Number.isFinite(Number(metric.value))) return '—';
    const value = Number(metric.value);
    return formatScaledMetric(metricId, value) ?? value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const AnchorCard: React.FC<{ definition: AnchorDefinition; metric?: MetricData | null; loading: boolean; watched: boolean; onToggle: () => void }> = ({ definition, metric, loading, watched, onToggle }) => {
    const freshness = metric ? getStaleness(metric.lastUpdated, metric.frequency) : null;
    return (
        <div className="group min-w-[13rem] flex-1 rounded-xl border border-white/[0.08] bg-black/20 px-3.5 py-3 transition-colors hover:border-blue-400/40 hover:bg-blue-500/[0.06]">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <a href={definition.href} className="flex min-w-0 flex-1 items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/40 hover:text-white" aria-label={`${definition.label}, open ${definition.source} module`}>
                    <span className="truncate">{definition.label}</span><ArrowUpRight size={12} className="shrink-0 text-white/25 transition-colors group-hover:text-blue-300" />
                </a>
                <button type="button" onClick={onToggle} aria-label={`${watched ? 'Remove' : 'Add'} ${definition.label} ${watched ? 'from' : 'to'} watchlist`} aria-pressed={watched} className={cn('rounded p-1 transition-colors', watched ? 'text-amber-300' : 'text-white/25 hover:text-amber-300')}>
                    <Star size={13} fill={watched ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className={cn('font-mono text-lg font-black tabular-nums text-white', loading && 'animate-pulse text-white/30')}>
                {loading ? 'Loading' : displayValue(metric, definition.metricId)}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-[9px] font-bold uppercase tracking-wider text-white/25">{definition.source}</span>
                {metric && metric.delta !== null && metric.delta !== undefined && (
                    <span className={cn('font-mono text-[10px] font-bold', metric.trend === 'up' ? 'text-emerald-400' : metric.trend === 'down' ? 'text-rose-400' : 'text-white/40')}>
                        {metric.trend === 'up' ? '+' : ''}{metric.delta.toLocaleString(undefined, { maximumFractionDigits: 2 })} {metric.deltaPeriod}
                    </span>
                )}
                {freshness ? <FreshnessChip status={freshness.state} lastUpdated={metric?.lastUpdated} isProvisional={metric?.isProvisional} sourceRef={metric?.sourceRef} provenance={metric?.provenance} /> : <span className="text-[9px] font-bold uppercase tracking-wider text-white/25">Unavailable</span>}
            </div>
        </div>
    );
};

export const DeskContextStrip: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: regime, isLoading: regimeLoading } = useRegime();
    const { data: health, isLoading: healthLoading } = useDataIntegrity();
    const { watchlist, toggle } = useDeskWatchlist();
    const fedAssets = useLatestMetric(ANCHORS[0].metricId);
    const tga = useLatestMetric(ANCHORS[1].metricId);
    const dealerHoldings = useLatestMetric(ANCHORS[2].metricId);
    const dxy = useLatestMetric(ANCHORS[3].metricId);
    const gold = useLatestMetric(ANCHORS[4].metricId);
    const brent = useLatestMetric(ANCHORS[5].metricId);
    const metricQueries = [fedAssets, tga, dealerHoldings, dxy, gold, brent];
    const healthLabel = healthLoading ? 'Checking feeds' : health?.status === 'healthy' ? 'Feeds operational' : health?.status === 'critical' ? 'Sync delayed' : 'Latency detected';
    const healthTone = health?.status === 'healthy' ? 'text-emerald-400' : health?.status === 'critical' ? 'text-rose-400' : 'text-amber-400';
    const activeView = searchParams.get('view');

    const selectView = (viewId: string, target: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('view', viewId);
        setSearchParams(next, { replace: true });
        window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    return (
        <section className="mb-6 rounded-2xl border border-blue-400/15 bg-slate-950/55 p-3.5 shadow-lg shadow-blue-950/10 backdrop-blur-xl sm:p-4" aria-label="Desk context">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2"><Gauge size={14} className="text-blue-400" /><h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">Desk context</h2><span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Current state</span></div>
                <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 text-white/35"><Activity size={11} className="text-blue-400/70" />Regime <span className={regime ? 'text-white/75' : 'text-white/30'}>{regimeLoading ? 'Loading' : regime?.regimeLabel ?? 'Unavailable'}</span>{regime && <span className="font-mono text-white/55">{Math.round(regime.pulseScore)}/100</span>}</span>
                    <span className={cn('flex items-center gap-1.5', healthTone)}><Radio size={11} />{healthLabel}{health?.staleCount ? <span className="font-mono">· {health.staleCount}</span> : null}</span>
                    <Link to="/data-health/" className="flex items-center gap-1 text-blue-400/70 hover:text-blue-300"><Database size={11} />Details</Link>
                </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
                {ANCHORS.map((anchor, index) => <AnchorCard key={anchor.id} definition={anchor} metric={metricQueries[index].data} loading={metricQueries[index].isLoading} watched={watchlist.includes(anchor.metricId)} onToggle={() => toggle(anchor.metricId)} />)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                <span className="mr-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/30">Desk views</span>
                {VIEW_PRESETS.map((view) => (
                    <button key={view.id} type="button" onClick={() => selectView(view.id, view.target)} aria-pressed={activeView === view.id} className={cn('rounded-md border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors', activeView === view.id ? 'border-blue-400/40 bg-blue-500/15 text-blue-300' : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white')}>
                        {view.label}
                    </button>
                ))}
                {activeView && <span className="text-[9px] font-bold uppercase tracking-wider text-white/25">Shareable URL view</span>}
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-white/25">Watchlist {watchlist.length}</span>
            </div>
        </section>
    );
};
