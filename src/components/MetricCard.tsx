import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { HoverDetail } from '@/components/HoverDetail';
import { formatMetric, formatDelta } from '@/utils/formatMetric';
import { useViewContext } from '@/context/ViewContext';
import { cn } from '@/lib/utils'; // Shadcn utility

interface MetricCardProps {
    label: string;
    metricId?: string;
    sublabel?: string;
    value: string | number;
    delta?: {
        value: string;
        period: string;
        trend: 'up' | 'down' | 'neutral';
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
    description?: string;
    methodology?: string;
    stats?: { label: string; value: string | number; color?: string }[];
    chartType?: 'line' | 'bar';
    zScore?: number;
    percentile?: number;
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
    percentile
}) => {
    const { isInstitutionalView } = useViewContext();
    const [isHighlighted, setIsHighlighted] = React.useState(false);

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
        if (delta.trend === 'up') return 'text-emerald-500';
        if (delta.trend === 'down') return 'text-rose-500';
        return 'text-muted-foreground';
    };

    const cardContent = (
        <Card
            id={metricId || label}
            className={cn(
                "relative flex flex-col min-h-[220px] h-full overflow-hidden transition-all duration-500",
                "bg-background/40 backdrop-blur-xl border-white/5",
                "hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] hover:border-blue-500/20 group",
                isHighlighted && "ring-2 ring-blue-500 ring-offset-4 ring-offset-background",
                isNullValue && "opacity-60",
                className
            )}
        >
            {/* Shaded Accent Band */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/[0.05] to-transparent blur-2xl -translate-y-16 translate-x-16 group-hover:from-blue-500/10 transition-colors duration-500" />

            <CardContent className="flex flex-col flex-grow p-6 space-y-6 relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[0.65rem] font-black tracking-[0.2em] text-muted-foreground/40 uppercase group-hover:text-blue-400/60 transition-colors">
                                {label}
                            </span>
                            {status !== 'neutral' && (
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded text-[0.6rem] font-bold tracking-tighter",
                                    status === 'safe' && "bg-emerald-500/10 text-emerald-500",
                                    status === 'warning' && "bg-amber-500/10 text-amber-500",
                                    status === 'danger' && "bg-rose-500/10 text-rose-500",
                                )}>
                                    {status.toUpperCase()}
                                </div>
                            )}
                        </div>
                        {sublabel && (
                            <div className="text-[0.65rem] font-bold text-muted-foreground/30 truncate max-w-[180px]">
                                {sublabel}
                            </div>
                        )}
                    </div>
                </div>

                {/* Primary Metric Display */}
                <div className="flex-grow flex flex-col justify-center min-h-[80px]">
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="w-[70%] h-12 rounded-lg opacity-20" />
                            <Skeleton className="w-[40%] h-4 rounded-md opacity-10" />
                        </div>
                    ) : isNullValue ? (
                        <div className="flex items-center gap-2 opacity-30">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                            <span className="text-sm font-black tracking-widest text-muted-foreground uppercase italic">Feed Offline</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter text-foreground tabular-nums leading-none">
                                    {prefix}{typeof value === 'number' ? formatMetric(value, 'number', { showUnit: false }) : value}{suffix}
                                </span>
                                <span className="text-sm font-bold text-muted-foreground/40 mb-1">
                                    {frequency?.toUpperCase() || 'DATA'}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                {delta && (
                                    <div className={cn(
                                        "flex items-center gap-1.5 text-sm font-black",
                                        getDeltaTextColor()
                                    )}>
                                        {getDeltaIcon()}
                                        <span>{delta.value}</span>
                                    </div>
                                )}
                                {typeof zScore === 'number' && !isNaN(zScore) && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                                        <span className="text-[0.65rem] font-black text-muted-foreground/40 uppercase">Z-Score</span>
                                        <span className={cn(
                                            "text-xs font-black tabular-nums font-mono",
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
                <div className="pt-4 border-t border-white/[0.03] mt-auto">
                    <div className="flex items-end justify-between">
                        <div className="space-y-2 flex-1">
                            {isInstitutionalView && typeof percentile === 'number' && !isNaN(percentile) && (
                                <div className="space-y-1.5 max-w-[120px]">
                                    <div className="flex justify-between text-[0.6rem] font-black text-muted-foreground/40 tracking-wider">
                                        <span>P-RANK</span>
                                        <span>{Math.round(percentile)}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500/40 rounded-full transition-all duration-1000"
                                            style={{ width: `${percentile}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="text-[0.6rem] font-bold text-muted-foreground/20 uppercase tracking-[0.1em]">
                                Source: {source} • Refreshed: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>

                        {history && history.length > 0 && (
                            <div className="w-24 h-10 opacity-30 group-hover:opacity-100 transition-opacity duration-700">
                                <Sparkline
                                    data={history}
                                    color={status === 'safe' || status === 'neutral' ? '#60a5fa' : '#f87171'}
                                    height={40}
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
