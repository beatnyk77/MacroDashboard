import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from '@/components/Sparkline';
import { ExternalLink } from 'lucide-react';
import { HoverDetail } from '@/components/HoverDetail';
import { formatNumber, formatDelta, formatPercentage } from '@/utils/formatNumber';
import { FreshnessChip } from './FreshnessChip';
import { getStaleness } from '@/hooks/useStaleness';
import { cn } from '@/lib/utils';

interface RatioCardProps {
    primaryLabel: string;
    metricId?: string;
    subtitle: string;
    value: number | string;
    zScore?: number;
    percentile?: number; // 0-100
    history?: { date: string; value: number }[];
    status?: 'safe' | 'warning' | 'danger' | 'neutral';
    lastUpdated?: string | Date;
    isLoading?: boolean;
    source?: string;
    frequency?: string;
    description?: string;
    methodology?: string;
    stats?: { label: string; value: string | number; color?: string }[];
    chartType?: 'line' | 'bar';
}

const getZScoreColorClass = (z: number) => {
    if (z > 2) return 'text-rose-500 bg-rose-500/15 border-rose-500/25';
    if (z < -2) return 'text-emerald-500 bg-emerald-500/15 border-emerald-500/25';
    return 'text-muted-foreground bg-muted/20 border-border/50';
};

export const RatioCard: React.FC<RatioCardProps> = ({
    primaryLabel,
    metricId,
    subtitle,
    value,
    zScore,
    percentile,
    history,
    lastUpdated,
    isLoading,
    source = 'Composite Data',
    frequency = 'Daily',
    description,
    methodology,
    stats = [],
    chartType = 'line'
}) => {
    const [isHighlighted, setIsHighlighted] = React.useState(false);

    React.useEffect(() => {
        const handleHighlight = (e: any) => {
            if (e.detail?.metricId === (metricId || primaryLabel)) {
                setIsHighlighted(true);
                setTimeout(() => setIsHighlighted(false), 3000);

                const element = document.getElementById(metricId || primaryLabel);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        window.addEventListener('macro-dashboard-highlight', handleHighlight);
        return () => window.removeEventListener('macro-dashboard-highlight', handleHighlight);
    }, [metricId, primaryLabel]);

    const isNullValue = value === null || value === undefined || value === '-' || value === '' ||
        (typeof value === 'number' && isNaN(value));

    const formattedValue = isNullValue ? 'No data' : formatNumber(typeof value === 'string' ? parseFloat(value) : value, { decimals: 2, notation: 'standard' });

    const { state: stalenessState, label: timeLabel } = getStaleness(lastUpdated, frequency);

    const cardContent = (
        <Card
            id={metricId || primaryLabel}
            className={cn(
                "relative flex flex-col p-5 h-[250px] overflow-hidden transition-all duration-300",
                "bg-card/40 backdrop-blur-md border-white/12 dark:border-white/5",
                "hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/50",
                isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse",
                "group"
            )}
        >
            {stalenessState !== 'fresh' && (
                <div className="absolute top-2 right-2 z-10">
                    <FreshnessChip status={stalenessState} lastUpdated={lastUpdated} />
                </div>
            )}

            <div className="mb-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.12em]">
                            {primaryLabel}
                        </span>
                    </div>

                    {!isLoading && typeof zScore === 'number' && !isNaN(zScore) && (
                        <div className={cn(
                            "px-2 py-0.5 rounded text-xs font-black border",
                            getZScoreColorClass(zScore),
                            Math.abs(zScore) > 2 && "animate-pulse"
                        )}>
                            Z: {formatDelta(zScore, { decimals: 1 })}
                        </div>
                    )}
                </div>
                <span className="block text-xs font-medium text-muted-foreground/70">
                    {subtitle}
                </span>
            </div>

            <div className="mb-4 min-h-[40px] flex items-baseline gap-2">
                {isLoading ? (
                    <Skeleton className="h-10 w-[60%]" />
                ) : isNullValue ? (
                    <h4 className="text-3xl font-bold text-muted-foreground/50">
                        No data
                    </h4>
                ) : (
                    <>
                        <h3 className="text-4xl font-extrabold text-foreground tracking-tight">
                            {formattedValue}
                        </h3>
                        {typeof zScore === 'number' && !isNaN(zScore) && Math.abs(zScore) > 2 && (
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                zScore > 2 ? "bg-rose-500" : "bg-emerald-500"
                            )} />
                        )}
                    </>
                )}
            </div>

            <div className="mb-5">
                {typeof percentile === 'number' && !isNaN(percentile) && !isLoading && (
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-xs font-extrabold text-muted-foreground tracking-wider uppercase">VALUATION PERCENTILE</span>
                            <span className={cn(
                                "text-xs font-black",
                                percentile > 90 || percentile < 10 ? "text-amber-500" : "text-primary"
                            )}>
                                {formatPercentage(percentile, { decimals: 0 })}
                            </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    percentile > 90 || percentile < 10 ? "bg-amber-500" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(100, Math.max(0, percentile))}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto flex justify-between items-end">
                <div className="flex-grow">
                    {history && history.length > 0 && (
                        <div className="h-8 opacity-60">
                            <Sparkline data={history} height={32} color="currentColor" />
                        </div>
                    )}
                    {timeLabel && (
                        <span className={cn(
                            "block mt-1 text-xs font-bold",
                            stalenessState === 'stale' || stalenessState === 'overdue' ? "text-rose-500" : "text-muted-foreground/50"
                        )}>
                            Updated {timeLabel}
                        </span>
                    )}
                </div>
                <button
                    className="text-muted-foreground/20 hover:text-primary transition-colors p-1"
                >
                    <ExternalLink size={12} />
                </button>
            </div>
        </Card>
    );

    return (
        <HoverDetail
            title={primaryLabel}
            subtitle={subtitle}
            detailContent={{
                description,
                methodology,
                source,
                stats: [
                    { label: 'Z-Score', value: formatDelta(zScore, { decimals: 2 }) || 'N/A' },
                    { label: 'Percentile', value: formatPercentage(percentile, { decimals: 1 }) || 'N/A' },
                    { label: 'Frequency', value: frequency },
                    ...stats
                ],
                history: history,
                chartType
            }}
        >
            {cardContent}
        </HoverDetail>
    );
};
