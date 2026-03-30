import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { HoverDetail } from '@/components/HoverDetail';
import { formatMetric, formatDelta } from '@/utils/formatMetric';
import { useViewContext } from '@/context/ViewContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils'; // Shadcn utility
import { getStaleness } from '@/hooks/useStaleness';

interface MetricCardProps {
    label: string;
    metricId?: string;
    sublabel?: string;
    value: string | number;
    delta?: {
        value: string;
        period: string;
        trend: 'up' | 'down' | 'neutral';
        tooltip?: {
            currentValue: number | string;
            previousValue: number | string;
            absoluteChange: number | string;
            percentChange: number | string;
        };
        riskInterpretation?: 'risk-on' | 'risk-off' | 'neutral';
    };
    status?: 'safe' | 'warning' | 'danger' | 'neutral';
    history?: { date: string; value: number }[];
    precision?: number;
    suffix?: string;
    prefix?: string;
    lastUpdated?: string | Date;
    isLoading?: boolean;
    sx?: any; // Keeping for compatibility but ignoring in new implementation
    className?: string;
    source?: string;
    frequency?: string;
    zScoreWindow?: string;
    description?: string | React.ReactNode;
    methodology?: string | React.ReactNode;
    stats?: { label: string; value: string | number; color?: string }[];
    chartType?: 'line' | 'bar';
    zScore?: number;
    percentile?: number;
    isStale?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    metricId,
    sublabel,
    value,
    delta,
    status = 'neutral',
    history,
    suffix = '',
    prefix = '',
    lastUpdated,
    isLoading,
    className,
    source = 'FRED',
    frequency = 'Daily',
    zScoreWindow = 'Rolling 252D',
    description,
    methodology,
    stats = [],
    chartType = 'line',
    zScore,
    percentile,
    isStale: isStaleProp
}) => {
    const { isInstitutionalView } = useViewContext();
    const [isHighlighted, setIsHighlighted] = React.useState(false);

    // Calculate staleness if not explicitly provided
    const staleness = getStaleness(lastUpdated, frequency);
    const isStale = isStaleProp ?? (staleness.state === 'overdue' || staleness.state === 'stale');

    React.useEffect(() => {
        const handleHighlight = (e: any) => {
            if (e.detail?.metricId === (metricId || label)) {
                setIsHighlighted(true);
                setTimeout(() => setIsHighlighted(false), 3000);

                const element = document.getElementById(metricId || label);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        window.addEventListener('macro-dashboard-highlight', handleHighlight);
        return () => window.removeEventListener('macro-dashboard-highlight', handleHighlight);
    }, [metricId, label]);

    const isNullValue = value === null || value === undefined || value === '-' || value === '' ||
        (typeof value === 'number' && isNaN(value));

    const getDeltaIcon = () => {
        if (!delta) return null;
        if (delta.trend === 'up') return <TrendingUp size={12} />;
        if (delta.trend === 'down') return <TrendingDown size={12} />;
        return <Minus size={12} />;
    };

    const getDeltaTextColor = () => {
        if (!delta) return 'text-muted-foreground';

        // If risk interpretation is provided, use it for coloring
        if (delta.riskInterpretation) {
            if (delta.riskInterpretation === 'risk-on') return 'text-emerald-500';
            if (delta.riskInterpretation === 'risk-off') return 'text-rose-500';
            return 'text-muted-foreground';
        }

        // Fallback to simple trend coloring
        if (delta.trend === 'up') return 'text-emerald-500';
        if (delta.trend === 'down') return 'text-rose-500';
        return 'text-muted-foreground';
    };

    const cardContent = (
        <Card
            id={metricId || label}
            className={cn(
                "relative flex flex-col h-full min-h-[180px] overflow-hidden transition-all duration-300",
                "bg-card/95 border-border/60",
                "hover:shadow-md hover:border-blue-500/30 group",
                isHighlighted && "ring-2 ring-blue-500 ring-offset-2 ring-offset-background",
                isNullValue && "opacity-60",
                className
            )}
        >
            {/* Subtle Gradient Accent - Simplified */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/[0.03] to-transparent blur-2xl -translate-y-8 translate-x-8 group-hover:from-blue-500/10 transition-colors duration-500" />

            <CardContent className="flex flex-col flex-grow p-6 gap-4 relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase group-hover:text-blue-500/80 transition-colors">
                                {label}
                            </span>
                            {status !== 'neutral' && (
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded-[4px] text-xs font-bold tracking-tight",
                                    status === 'safe' && "bg-emerald-500/10 text-emerald-500",
                                    status === 'warning' && "bg-amber-500/10 text-amber-500",
                                    status === 'danger' && "bg-rose-500/10 text-rose-500",
                                )}>
                                    {status.toUpperCase()}
                                </div>
                            )}
                            {isStale && (
                                <div className="px-1.5 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-500 text-xs font-bold tracking-tight animate-pulse border border-amber-500/20">
                                    OFFLINE
                                </div>
                            )}
                        </div>
                        {sublabel && (
                            <div className="text-xs font-medium text-muted-foreground/55 truncate max-w-[180px]">
                                {sublabel}
                            </div>
                        )}
                    </div>
                </div>

                {/* Primary Metric Display */}
                <div className="flex-grow flex flex-col justify-center min-h-[60px]">
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="w-[60%] h-10 rounded-lg opacity-20" />
                            <Skeleton className="w-[30%] h-3 rounded-md opacity-10" />
                        </div>
                    ) : isNullValue ? (
                        <div className="flex items-center gap-2 opacity-50">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground italic">No Data</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-baseline gap-1">
                                <span className={cn(
                                    "text-4xl font-bold tracking-tight text-foreground tabular-nums leading-none",
                                    (String(value).length > 8) && "text-3xl" // Auto-scale for long numbers
                                )}>
                                    {prefix}{typeof value === 'number' ? formatMetric(value, 'number', { showUnit: false }) : value}
                                </span>
                                {suffix && (
                                    <span className="text-lg font-semibold text-muted-foreground/60 self-baseline">
                                        {suffix}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {delta && (
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={cn(
                                                    "flex items-center gap-1 text-sm font-semibold cursor-help",
                                                    getDeltaTextColor()
                                                )}>
                                                    {getDeltaIcon()}
                                                    <span>{delta.value}</span>
                                                    <span className="text-xs font-medium text-muted-foreground/50 uppercase ml-1">{delta.period}</span>
                                                </div>
                                            </TooltipTrigger>
                                            {delta.tooltip && (
                                                <TooltipContent className="p-3 bg-slate-950 border-white/12 shadow-2xl backdrop-blur-xl">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-1.5">
                                                            <span className="text-xs font-bold text-muted-foreground/60 uppercase">Current</span>
                                                            <span className="text-xs font-mono font-bold text-white">{delta.tooltip.currentValue}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-1.5">
                                                            <span className="text-xs font-bold text-muted-foreground/60 uppercase">7 Days Ago</span>
                                                            <span className="text-xs font-mono font-bold text-white/80">{delta.tooltip.previousValue}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 pt-0.5">
                                                            <div className="space-y-0.5">
                                                                <div className="text-xs font-black text-muted-foreground/40 uppercase leading-none">Change</div>
                                                                <div className={cn("text-xs font-bold font-mono", getDeltaTextColor())}>
                                                                    {delta.tooltip.absoluteChange}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-0.5 text-right">
                                                                <div className="text-xs font-black text-muted-foreground/40 uppercase leading-none">% Change</div>
                                                                <div className={cn("text-xs font-bold font-mono", getDeltaTextColor())}>
                                                                    {delta.tooltip.percentChange}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                {typeof zScore === 'number' && !isNaN(zScore) && (
                                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-secondary/50 border border-border/50">
                                        <span className="text-xs font-semibold text-muted-foreground/60 uppercase">σ</span>
                                        <span className={cn(
                                            "text-xs font-bold tabular-nums font-mono",
                                            Math.abs(zScore) > 2 ? "text-amber-500" : "text-blue-400"
                                        )}>
                                            {formatDelta(zScore, { decimals: 1 })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Meta */}
                <div className="pt-3 border-t border-border/40 mt-auto">
                    <div className="flex items-end justify-between">
                        <div className="space-y-1.5 flex-1">
                            {isInstitutionalView && typeof percentile === 'number' && !isNaN(percentile) && (
                                <div className="space-y-1 max-w-[100px]">
                                    <div className="flex justify-between text-xs font-semibold text-muted-foreground/50 tracking-wide">
                                        <span>RANK</span>
                                        <span>{Math.round(percentile)}%</span>
                                    </div>
                                    <div className="h-0.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500/60 rounded-full"
                                            style={{ width: `${percentile}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="text-xs font-medium text-muted-foreground/40 uppercase tracking-wide group-hover:text-muted-foreground/60 transition-colors">
                                {frequency?.toUpperCase()} • {source}
                                {lastUpdated && <span className="hidden group-hover:inline transition-opacity duration-300"> • {new Date(lastUpdated).toLocaleDateString()}</span>}
                            </div>
                        </div>

                        {history && history.length > 0 && (
                            <div className="w-20 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
                                <Sparkline
                                    data={history}
                                    color={status === 'safe' || status === 'neutral' ? 'currentColor' : '#f43f5e'}
                                    height={32}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <HoverDetail
            title={label}
            subtitle={sublabel || label}
            detailContent={{
                description,
                methodology,
                source,
                stats: [
                    { label: 'Update Freq', value: frequency },
                    { label: 'Window', value: zScoreWindow },
                    ...stats
                ],
                history,
                chartType
            }}
        >
            {cardContent}
        </HoverDetail>
    );
};
