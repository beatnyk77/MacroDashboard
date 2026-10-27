import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { CommodityHistoryPoint } from '@/hooks/useCommodities';
import { TerminalChartTooltip, type TerminalChartTooltipProps } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import { CHART_HEIGHTS, CHART_COLORS, alpha } from '@/constants/chartDefaults';

interface CommodityHistoryCardProps {
    title: string;
    category: string;
    price: number;
    unit: string;
    history: CommodityHistoryPoint[];
    color: 'red' | 'orange' | 'slate';
    delta?: number;
}

const CustomTooltip = (props: TerminalChartTooltipProps) => (
    <TerminalChartTooltip
        {...props}
        valueFormatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
    />
);

export const CommodityHistoryCard: React.FC<CommodityHistoryCardProps> = ({
    title,
    category,
    price,
    unit,
    history,
    color,
    delta = 0
}) => {
    const gradId = `grad-${title.replace(/\s+/g, '')}`;

    // Calculate 25y min/max with fallback
    const values = (history || []).map(h => h.value);
    const hasData = values.length > 0;
    const minVal = hasData ? Math.min(...values) : 0;
    const maxVal = hasData ? Math.max(...values) : 0;

    const colorMap = {
        red: { stroke: CHART_COLORS.stress, fill: CHART_COLORS.stress, shadow: alpha(CHART_COLORS.stress, 0.4) },
        orange: { stroke: CHART_COLORS.orange, fill: CHART_COLORS.orange, shadow: alpha(CHART_COLORS.orange, 0.4) },
        slate: { stroke: CHART_COLORS.label, fill: CHART_COLORS.label, shadow: alpha(CHART_COLORS.label, 0.4) }
    };

    const isPositive = delta > 0;
    const TrendIcon = delta === 0 ? Minus : (isPositive ? TrendingUp : TrendingDown);

    return (
        <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-700 rounded-xl p-8 border border-border overflow-hidden flex flex-col h-full">
            {/* Ambient Background */}
            <div className={cn(
                "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-10 transition-opacity group-hover:opacity-20",
                color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : 'bg-slate-400'
            )} />

            <div className="relative z-10 space-y-6 flex-grow">
                {/* Header Row */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : 'bg-slate-400'
                            )} />
                            <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                                {category}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-heading uppercase italic underline decoration-white/5 underline-offset-8">
                            {title}
                        </h3>
                    </div>

                    {delta !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tabular-nums",
                            delta > 0 ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                        )}>
                            <TrendIcon size={12} />
                            {Math.abs(delta).toFixed(2)}%
                        </div>
                    )}
                </div>

                {/* Price Display */}
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white tracking-heading tabular-nums drop-shadow-md">
                            ${price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">{unit}</span>
                    </div>
                </div>

                {/* 25Y History Chart */}
                <MacroChartContainer height={CHART_HEIGHTS.compact} className="mt-4 -mx-2 relative transition-transform duration-700 group-hover:scale-[1.02]">
                        <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colorMap[color].fill} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={colorMap[color].fill} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide />
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={colorMap[color].stroke}
                                fill={`url(#${gradId})`}
                                strokeWidth={3}
                                animationDuration={2500}
                                isAnimationActive={true}
                            />
                            <ReferenceLine
                                y={price}
                                stroke={`${colorMap[color].stroke}80`}
                                strokeDasharray="3 3"
                            />
                        </AreaChart>
                </MacroChartContainer>
            </div>

            {/* Range Stats */}
            <div className="relative z-10 mt-6 pt-6 border-t border-border flex justify-between items-end">
                <div className="space-y-1">
                    <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">25Y Min-Max Band</span>
                    <div className="flex items-center gap-4 text-xs font-bold text-white/50 tabular-nums">
                        <span>Low: <span className="text-white">${minVal.toFixed(1)}</span></span>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <span>High: <span className="text-white">${maxVal.toFixed(1)}</span></span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-semibold text-white/20 uppercase tracking-wider">Institutional Telemetry</div>
                    <div className="text-xs font-semibold text-white/10 uppercase tracking-heading">Source: NYMEX / COMEX</div>
                </div>
            </div>
        </div>
    );
};
