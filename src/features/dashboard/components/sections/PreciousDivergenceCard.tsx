import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Info, Globe, AlertTriangle, Zap } from 'lucide-react';
import { usePreciousDivergence, PreciousDivergenceData } from '@/hooks/usePreciousDivergence';
import { AreaChart, Area } from 'recharts';
import { CHART_COLORS } from '@/constants/chartDefaults';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { FreshnessChip, type FreshnessStatus } from '@/components/FreshnessChip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

function goldFreshness(lastUpdated?: string): FreshnessStatus {
    if (!lastUpdated) return 'no_data';
    const hours = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
    if (hours <= 48) return 'fresh';
    if (hours <= 72) return 'lagged';
    return 'stale';
}

interface ArbitrageRowProps {
    title: string;
    spreadMetric?: PreciousDivergenceData;
    comexMetric?: PreciousDivergenceData;
    shanghaiMetric?: PreciousDivergenceData;
    iconColor: string;
    /** When false, suppress live green pulse on Shanghai (dual-exit honesty). */
    isLive?: boolean;
}

const ArbitrageRow: React.FC<ArbitrageRowProps> = ({
    title,
    spreadMetric,
    comexMetric,
    shanghaiMetric,
    iconColor,
    isLive = true,
}) => {
    if (!spreadMetric) return null;

    const spread = spreadMetric.value;
    const isPremium = spread > 0;

    // Dynamic scaling: If spread is extreme (>5%), we cap at 100%, otherwise we scale relative to 5%
    const maxReference = 5;
    const widthPercent = Math.min((Math.abs(spread) / maxReference) * 100, 100);

    return (
        <div className="group/item relative bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-xl p-6 border border-border overflow-hidden">
            {/* Background Glow */}
            <div className={cn(
                "absolute -top-24 -right-24 w-48 h-48 blur-[60px] opacity-0 group-hover/item:opacity-20 transition-opacity duration-700",
                isPremium ? "bg-emerald-500/30" : "bg-rose-500/30"
            )} />

            <div className="flex flex-col xl:flex-row gap-8 items-stretch xl:items-center relative z-10">
                {/* Header Info - Ticker Style */}
                <div className="xl:w-1/3 flex items-start gap-5">
                    <div className={cn("p-4 rounded-xl bg-white/5 shrink-0 shadow-inner group-hover/item:scale-105 transition-transform duration-500 border border-border", iconColor)}>
                        <Globe className="w-7 h-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-xs uppercase tracking-wider text-terminal-dim">
                                {title} Arbitrage
                            </h3>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>
                        <div className="flex flex-wrap gap-6 items-center">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-terminal-dim uppercase tracking-heading mb-1">COMEX (West)</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-white/90 font-mono tracking-heading tabular-nums">${comexMetric?.value?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                                </div>
                            </div>
                            <div className="w-[1px] h-10 bg-white/5 hidden sm:block" />
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-emerald-500/40 uppercase tracking-heading mb-1">SHANGHAI (East)</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-emerald-400 font-mono tracking-heading tabular-nums">${shanghaiMetric?.value?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                    <div className={cn(
                                        'w-1.5 h-1.5 rounded-full',
                                        isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                    )} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spread Management */}
                <div className="xl:flex-1 flex flex-col justify-center gap-4">
                    <div className="flex justify-between items-end mb-1">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-border">
                                    Spread Delta
                                </span>
                                {Math.abs(spread) > 1.2 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-500 uppercase animate-in fade-in slide-in-from-left-2 transition-all">
                                        <Zap className="w-2.5 h-2.5 fill-amber-500" />
                                        Extreme Divergence
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className={cn(
                                "text-4xl font-bold tracking-heading tabular-nums leading-none",
                                isPremium ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {isPremium ? '+' : ''}{spread.toFixed(2)}%
                            </div>
                            <span className="text-xs font-semibold text-terminal-dim uppercase mt-1">LME/LBMA Premium</span>
                        </div>
                    </div>

                    {/* Gauged Bar - Autofit Center Line */}
                    <div className="relative h-3 bg-white/[0.03] rounded-full overflow-hidden border border-border">
                        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/20 z-10" />
                        <div
                            className={cn(
                                "absolute top-0 bottom-0 transition-all duration-1000 ease-out",
                                isPremium ? "left-1/2 bg-gradient-to-r from-emerald-500/40 to-emerald-500" : "right-1/2 bg-gradient-to-l from-rose-500/40 to-rose-500"
                            )}
                            style={{ width: `${widthPercent / 2}%` }}
                        />
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                    </div>
                </div>

                {/* Narrative Spark - 30D Trend */}
                <div className="xl:w-1/4 h-[90px] opacity-60 hover:opacity-100 transition-opacity duration-500">
                    <MacroChartContainer height="fill">
                        <AreaChart data={spreadMetric.history?.slice(-60) || []}>
                            <defs>
                                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPremium ? CHART_COLORS.expansion : CHART_COLORS.east} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={isPremium ? CHART_COLORS.expansion : CHART_COLORS.east} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPremium ? CHART_COLORS.expansion : CHART_COLORS.east}
                                fill={`url(#grad-${title})`}
                                strokeWidth={2.5}
                                dot={false}
                                isAnimationActive={true}
                                animationDuration={2500}
                            />
                        </AreaChart>
                    </MacroChartContainer>
                    <div className="text-xs font-semibold text-terminal-dim uppercase tracking-wider text-center mt-2">60D Flow Velocity</div>
                </div>
            </div>
        </div>
    );
};

export const PreciousDivergenceCard: React.FC = () => {
    const { data: divergenceData, isLoading } = usePreciousDivergence();

    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-xl bg-white/5" />;
    }

    const goldSpread = divergenceData?.find(d => d.metric_id === 'GOLD_COMEX_SHANGHAI_SPREAD_PCT');
    const silverSpread = divergenceData?.find(d => d.metric_id === 'SILVER_COMEX_SHANGHAI_SPREAD_PCT');

    const goldComex = divergenceData?.find(d => d.metric_id === 'GOLD_COMEX_USD');
    const goldShanghai = divergenceData?.find(d => d.metric_id === 'GOLD_SHANGHAI_USD');

    const silverComex = divergenceData?.find(d => d.metric_id === 'SILVER_COMEX_USD');
    const silverShanghai = divergenceData?.find(d => d.metric_id === 'SILVER_SHANGHAI_USD');

    const asOf = goldSpread?.last_updated || goldComex?.last_updated || silverSpread?.last_updated;
    const status = goldFreshness(asOf);
    const isLive = status === 'fresh';

    if (!divergenceData?.length || status === 'stale' || status === 'no_data') {
        return (
            <Card className="p-8 bg-background/40 border-border rounded-xl">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <FreshnessChip status={status} lastUpdated={asOf} sourceRef="live_api:ingest-precious-divergence" />
                </div>
                <h2 className="text-xl font-bold tracking-heading text-white uppercase">
                    Gold Derivatives &amp; Physical Arbitrage
                </h2>
                <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">
                    {status === 'stale'
                        ? `Last observation older than 72h${asOf ? ` (${asOf})` : ''}. Withholding live vault chrome until daily ingest writes succeed.`
                        : 'No Shanghai–COMEX arbitrage observations available. Surface withheld rather than showing a green live pulse.'}
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-8 bg-background/40 backdrop-blur-3xl border-border shadow-2xl relative overflow-hidden rounded-xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <TrendingUp className="text-emerald-500 w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-heading text-white uppercase italic">
                            Shanghai <span className="text-emerald-500">Divergence</span> Engine
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                        East-West price tracking of physical arbitrage. Persistent <span className="text-white font-bold">Shanghai Premiums</span> signal metal drainage from LBMA/COMEX vaults toward Asian central banks and retail.
                    </p>
                    {asOf && (
                        <p className="text-xs font-mono text-terminal-dim uppercase tracking-wider">
                            As-of {new Date(asOf).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <FreshnessChip status={status} lastUpdated={asOf} sourceRef="live_api:ingest-precious-divergence" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-xl">
                        <div className={cn('w-1.5 h-1.5 rounded-full', isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {isLive ? 'Live Vault Signals' : 'Lagged Vault Signals'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <ArbitrageRow
                    title="Gold (XAU)"
                    spreadMetric={goldSpread}
                    comexMetric={goldComex}
                    shanghaiMetric={goldShanghai}
                    iconColor="text-amber-500"
                    isLive={isLive}
                />

                <ArbitrageRow
                    title="Silver (XAG)"
                    spreadMetric={silverSpread}
                    comexMetric={silverComex}
                    shanghaiMetric={silverShanghai}
                    iconColor="text-slate-400"
                    isLive={isLive}
                />
            </div>

            {/* Bottom Insight Bar */}
            <div className="mt-12 p-8 rounded-xl bg-card/40 border border-border backdrop-blur-md">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                    <div className="flex items-center gap-5">
                        <div className="p-3 rounded-xl bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <AlertTriangle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Institutional Engine Note</div>
                            <p className="text-sm font-medium text-white/90 leading-relaxed max-w-2xl">
                                {goldSpread && goldSpread.value > 0.5
                                    ? "Persistent Shanghai Premium confirmed. Bullion flow velocity remains skewed toward Asian sovereign vaults, potentially front-running a global reserve diversification cycle."
                                    : "Arbitrage bands remain within historical norms. Capital flows are balanced between LBMA and SGE, suggesting stabilized physical demand in the East."}
                            </p>
                        </div>
                    </div>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    aria-label="Arbitrage calculation information"
                                    className="p-3 hover:bg-white/5 rounded-xl border border-border transition-all group cursor-pointer"
                                >
                                    <Info className="w-5 h-5 text-muted-foreground group-hover:text-white" aria-hidden="true" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border-border p-4 max-w-[250px] rounded-xl shadow-2xl">
                                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                    <span className="text-white font-semibold block mb-1 uppercase tracking-wider">Arbitrage Calculation</span>
                                    Cross-exchange spread calculated as ((Shanghai Cash / USDCNH) - COMEX Front Month) / COMEX * 100. Accounts for offshore currency conversion and physical delivery fees.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border">
                    {[
                        {
                            label: 'Vault Drainage',
                            content: 'Premiums > 1.2% signal aggressive metal removal from West to East, straining Comex delivery capacity.',
                            status: 'Critical'
                        },
                        {
                            label: 'Basis Rotation',
                            content: 'Narrowing spread (< 0.2%) suggests cooling Asian retail demand or localized liquidity tightening in SH.',
                            status: 'Neutral'
                        },
                        {
                            label: 'Liquidity Arbitrage',
                            content: 'Wide spreads incentivize global bullion desks to physically transport bar stock to capture the basis.',
                            status: 'Active'
                        }
                    ].map((bullet, idx) => (
                        <div key={idx} className="group/bullet space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-white/60 group-hover/bullet:text-white transition-colors">
                                    {bullet.label}
                                </span>
                                <div className="px-2 py-0.5 rounded bg-white/5 text-xs font-semibold text-muted-foreground uppercase">
                                    {bullet.status}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground/80 font-medium leading-[1.4] italic border-l-2 border-border pl-4 group-hover/bullet:border-emerald-500/30 transition-colors">
                                {bullet.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};
