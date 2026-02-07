import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { HoverDetail } from '@/components/HoverDetail';
import { formatMetric, formatDelta } from '@/utils/formatMetric';
import { useViewContext } from '@/context/ViewContext';
import { DataQualityBadge } from './DataQualityBadge';
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

    // Status colors for inline styles where tailwind classes might be dynamic
    const statusColors = {
        safe: 'text-emerald-500',
        neutral: 'text-blue-500',
        warning: 'text-amber-500',
        danger: 'text-rose-500'
    };

    const statusBgColors = {
        safe: 'bg-emerald-500',
        neutral: 'bg-blue-500',
        warning: 'bg-amber-500',
        danger: 'bg-rose-500'
    };

    const getSignalLabel = (status: string): string => {
        switch (status) {
            case 'safe': return 'HEALTHY';
            case 'neutral': return 'STABLE';
            case 'warning': return 'WATCH';
            case 'danger': return 'STRESS';
            default: return 'NORMAL';
        }
    };

    const isNullValue = value === null || value === undefined || value === '-' || value === '' ||
        (typeof value === 'number' && isNaN(value));

    const isExtreme = (!isLoading && !isNullValue) && (
        (typeof percentile === 'number' && (percentile > 95 || percentile < 5)) ||
        (typeof zScore === 'number' && Math.abs(zScore) >= 2.5)
    );

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
                "relative flex flex-col min-h-[200px] h-full overflow-hidden transition-all duration-300",
                "bg-card/40 backdrop-blur-md border-white/10 dark:border-white/5",
                "hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/50",
                isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                className
            )}
        >
            {isExtreme && (
                <div className="absolute top-0 left-0 z-10 flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border-r border-b border-blue-500/20 rounded-br text-[10px] font-black tracking-wider text-blue-500 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Historical Extreme
                </div>
            )}

            {lastUpdated && (
                <div className="absolute top-3 right-3 z-10">
                    <DataQualityBadge timestamp={lastUpdated} size="small" label={false} />
                </div>
            )}

            <CardContent className="flex flex-col flex-grow p-5 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase opacity-80">
                            {label}
                        </div>
                        {sublabel && (
                            <div className="text-[10px] text-muted-foreground opacity-60 mt-0.5 font-medium">
                                {sublabel}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Value Area */}
                <div className="flex-grow min-h-[64px]">
                    {isLoading ? (
                        <Skeleton className="w-[80%] h-16 rounded-lg" />
                    ) : isNullValue ? (
                        <div className="flex items-center gap-2 mt-2 opacity-40">
                            <span className="w-2 h-2 rounded-full border-2 border-muted-foreground" />
                            <span className="text-xl font-semibold text-muted-foreground">Awaiting data</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Primary Value */}
                            <div className="flex items-baseline gap-3">
                                {status !== 'neutral' && (
                                    <span className={cn(
                                        "w-2.5 h-2.5 rounded-full shadow-[0_0_8px] shrink-0 animate-pulse",
                                        statusBgColors[status as keyof typeof statusBgColors],
                                        `shadow-${statusColors[status as keyof typeof statusColors].split('-')[1]}-500/50`
                                    )} />
                                )}
                                <span className="text-4xl font-bold tracking-tight text-foreground leading-none tabular-nums">
                                    {prefix}{typeof value === 'number' ? formatMetric(value, 'number', { showUnit: false }) : value}{suffix}
                                </span>
                            </div>

                            {/* Signal Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {delta && (
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-bold",
                                        "bg-background/40 border-border/50",
                                        getDeltaTextColor()
                                    )}>
                                        {getDeltaIcon()}
                                        <span>{delta.value}</span>
                                    </div>
                                )}

                                {isInstitutionalView && typeof zScore === 'number' && !isNaN(zScore) && (
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-md border text-[10px] font-black tracking-wide",
                                        Math.abs(zScore) > 2
                                            ? "bg-rose-500/20 border-rose-500/30 text-rose-500"
                                            : "bg-background/40 border-border/50 text-muted-foreground"
                                    )}>
                                        Z: {formatDelta(zScore, { decimals: 1 })}
                                    </div>
                                )}

                                {status !== 'neutral' && (
                                    <div className={cn(
                                        "ml-auto px-2 py-0.5 rounded border text-[10px] font-black tracking-widest uppercase",
                                        status === 'safe' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                                        status === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                                        status === 'danger' && "bg-rose-500/10 border-rose-500/20 text-rose-500",
                                    )}>
                                        {getSignalLabel(status)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Institutional Context: Percentile Bar */}
                {isInstitutionalView && typeof percentile === 'number' && !isNaN(percentile) && !isLoading && (
                    <div className="space-y-1">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">
                                INST. PERCENTILE
                            </span>
                            <span className={cn(
                                "text-[10px] font-black tabular-nums",
                                (percentile > 90 || percentile < 10) ? "text-amber-500" : "text-blue-500"
                            )}>
                                {formatMetric(percentile, 'percent', { showUnit: true })}
                            </span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000 ease-out",
                                    (percentile > 90 || percentile < 10) ? "bg-amber-500" : "bg-blue-500"
                                )}
                                style={{ width: `${Math.max(0, Math.min(100, percentile))}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer: Sparkline & Info */}
                <div className="mt-auto flex justify-between items-end pt-2">
                    <div className="flex-grow">
                        {history && history.length > 0 && (
                            <div className="h-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                                <Sparkline
                                    data={history}
                                    color={status === 'safe' || status === 'neutral' ? '#3b82f6' : '#ef4444'}
                                    height={32}
                                />
                            </div>
                        )}
                        {lastUpdated && (
                            <div className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                                Updated {new Date(lastUpdated).toLocaleDateString()}
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
