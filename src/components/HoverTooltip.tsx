import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface HoverTooltipProps {
    metric: string;
    currentValue: number;
    percentile?: number;
    zScore?: number;
    historicalStats?: {
        min: number;
        max: number;
        avg: number;
        stdDev: number;
    };
    unit?: string;
    children: React.ReactNode;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({
    metric,
    currentValue,
    percentile,
    zScore,
    historicalStats,
    unit = '',
    children
}) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const getZScoreColor = (z?: number) => {
        if (!z) return 'text-muted-foreground/60';
        if (Math.abs(z) > 2) return 'text-rose-500';
        if (Math.abs(z) > 1) return 'text-orange-500';
        return 'text-emerald-500';
    };

    const getPercentileColor = (p?: number) => {
        if (!p) return 'text-muted-foreground/60';
        if (p > 90 || p < 10) return 'text-rose-500';
        if (p > 75 || p < 25) return 'text-orange-500';
        return 'text-emerald-500';
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-80"
                    >
                        <div className="bg-black/95 backdrop-blur-xl border border-white/12 rounded-xl p-4 shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/12">
                                <div className="text-xs font-black uppercase tracking-uppercase text-muted-foreground/40">
                                    {metric}
                                </div>
                                <Activity size={12} className="text-muted-foreground/40" />
                            </div>

                            {/* Current Value */}
                            <div className="mb-3">
                                <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase mb-1">
                                    Current
                                </div>
                                <div className="text-2xl font-black tabular-nums text-white">
                                    {currentValue.toFixed(2)} {unit}
                                </div>
                            </div>

                            {/* Statistical Context */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {percentile !== undefined && (
                                    <div>
                                        <div className="text-xs font-bold text-muted-foreground/40 uppercase tracking-uppercase mb-1">
                                            10Y Percentile
                                        </div>
                                        <div className={cn("text-lg font-black tabular-nums", getPercentileColor(percentile))}>
                                            {percentile.toFixed(0)}%
                                        </div>
                                    </div>
                                )}
                                {zScore !== undefined && (
                                    <div>
                                        <div className="text-xs font-bold text-muted-foreground/40 uppercase tracking-uppercase mb-1">
                                            Z-Score
                                        </div>
                                        <div className={cn("text-lg font-black tabular-nums flex items-center gap-1", getZScoreColor(zScore))}>
                                            {zScore > 0 ? <TrendingUp size={14} /> : zScore < 0 ? <TrendingDown size={14} /> : null}
                                            {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}σ
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Historical Stats */}
                            {historicalStats && (
                                <div className="pt-3 border-t border-white/12">
                                    <div className="text-xs font-bold text-muted-foreground/40 uppercase tracking-uppercase mb-2">
                                        10Y Historical Range
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-xs text-muted-foreground/40 mb-1">MIN</div>
                                            <div className="text-xs font-bold text-rose-500/80 tabular-nums">
                                                {historicalStats.min.toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground/40 mb-1">AVG</div>
                                            <div className="text-xs font-bold text-blue-500/80 tabular-nums">
                                                {historicalStats.avg.toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground/40 mb-1">MAX</div>
                                            <div className="text-xs font-bold text-emerald-500/80 tabular-nums">
                                                {historicalStats.max.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Z-Score Interpretation */}
                            {zScore !== undefined && Math.abs(zScore) > 1 && (
                                <div className="mt-3 pt-3 border-t border-white/12">
                                    <div className={cn(
                                        "text-xs font-bold uppercase tracking-uppercase px-2 py-1 rounded",
                                        Math.abs(zScore) > 2 ? "bg-rose-500/20 text-rose-400" : "bg-orange-500/20 text-orange-400"
                                    )}>
                                        {Math.abs(zScore) > 2 ? '⚠️ EXTREME VALUE' : '⚡ ELEVATED VALUE'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
