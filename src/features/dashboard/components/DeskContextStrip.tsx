import { Activity, ArrowUpRight, Database, Gauge, Radio, Star, GitCompare } from 'lucide-react';
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
        <div className="group min-w-[13rem] flex-1 rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/50">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <a href={definition.href} className="flex min-w-0 flex-1 items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground" aria-label={`${definition.label}, open ${definition.source} module`}>
                    <span className="truncate">{definition.label}</span><ArrowUpRight size={12} className="shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                </a>
                <button type="button" onClick={onToggle} aria-label={`${watched ? 'Remove' : 'Add'} ${definition.label} ${watched ? 'from' : 'to'} watchlist`} aria-pressed={watched} className={cn('rounded p-1 transition-colors', watched ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500')}>
                    <Star size={13} fill={watched ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className={cn('font-mono text-lg font-black tabular-nums text-foreground', loading && 'animate-pulse text-muted-foreground/40')}>
                {loading ? 'Loading' : displayValue(metric, definition.metricId)}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{definition.source}</span>
                {metric && metric.delta !== null && metric.delta !== undefined && (
                    <span className={cn('font-mono text-[10px] font-bold', metric.trend === 'up' ? 'text-emerald-500' : metric.trend === 'down' ? 'text-rose-500' : 'text-muted-foreground')}>
                        {metric.trend === 'up' ? '+' : ''}{metric.delta.toLocaleString(undefined, { maximumFractionDigits: 2 })} {metric.deltaPeriod}
                    </span>
                )}
                {freshness ? <FreshnessChip status={freshness.state} lastUpdated={metric?.lastUpdated} isProvisional={metric?.isProvisional} sourceRef={metric?.sourceRef} provenance={metric?.provenance} /> : <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Unavailable</span>}
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
    const healthTone = health?.status === 'healthy' ? 'text-emerald-500' : health?.status === 'critical' ? 'text-rose-500' : 'text-amber-500';
    const activeView = searchParams.get('view');

    const selectView = (viewId: string, target: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('view', viewId);
        setSearchParams(next, { replace: true });
        window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    return (
        <section className="mb-6 rounded-2xl border border-border bg-card/90 p-3.5 shadow-sm dark:shadow-lg backdrop-blur-xl sm:p-4" aria-label="Desk context">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2"><Gauge size={14} className="text-primary" /><h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Desk context</h2><span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Current state</span></div>
                <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Activity size={11} className="text-primary" />Regime <span className={regime ? 'text-foreground font-bold' : 'text-muted-foreground/40'}>{regimeLoading ? 'Loading' : regime?.regimeLabel ?? 'Unavailable'}</span>{regime && <span className="font-mono text-muted-foreground">{Math.round(regime.pulseScore)}/100</span>}</span>
                    <span className={cn('flex items-center gap-1.5', healthTone)}><Radio size={11} />{healthLabel}{health?.staleCount ? <span className="font-mono">· {health.staleCount}</span> : null}</span>
                    <Link to="/data-health/" className="flex items-center gap-1 text-primary hover:underline"><Database size={11} />Details</Link>
                </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
                {ANCHORS.map((anchor, index) => <AnchorCard key={anchor.id} definition={anchor} metric={metricQueries[index].data} loading={metricQueries[index].isLoading} watched={watchlist.includes(anchor.metricId)} onToggle={() => toggle(anchor.metricId)} />)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <span className="mr-1 text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground/60">Desk views</span>
                {VIEW_PRESETS.map((view) => (
                    <button key={view.id} type="button" onClick={() => selectView(view.id, view.target)} aria-pressed={activeView === view.id} className={cn('rounded-md border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors', activeView === view.id ? 'border-primary/40 bg-primary/10 text-primary font-bold' : 'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground')}>
                        {view.label}
                    </button>
                ))}
                <Link
                    to="/labs/macro-precedents"
                    className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
                >
                    <GitCompare size={11} className="text-primary" />
                    Precedents Lab
                </Link>
                {activeView && <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Shareable URL view</span>}
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Watchlist {watchlist.length}</span>
            </div>
        </section>
    );
};
