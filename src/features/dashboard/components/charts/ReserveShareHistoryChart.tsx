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
import { TerminalChartTooltip, type TerminalChartTooltipProps } from '@/components/charts/TerminalChartTooltip';
import { fixed } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import { CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';

interface ReserveShareHistoryChartProps {
    title: string;
    data: any[];
    currentValue: number;
    color: string;
    years?: number;
    description?: string;
    isDeclining?: boolean;
}

const CustomTooltip = (props: TerminalChartTooltipProps) => (
    <TerminalChartTooltip {...props} valueFormatter={fixed(1, '%')} />
);

export const ReserveShareHistoryChart: React.FC<ReserveShareHistoryChartProps> = ({
    title,
    data,
    currentValue,
    color,
    years = 25,
    description,
    isDeclining = false
}) => {
    const gradId = `grad-${title.replace(/\s+/g, '')}`;

    return (
        <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-xl p-8 border border-border overflow-hidden flex flex-col h-full">
            {/* Background Accent */}
            <div className={cn(
                "absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-32 -mt-32 opacity-10 transition-opacity group-hover:opacity-20",
                color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'
            )} />

            <div className="relative z-10 space-y-4 mb-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                            {title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                                {years}-Year Institutional History
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white tracking-heading tabular-nums">
                            {currentValue?.toFixed(1)}%
                        </div>
                        <div className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                            Official Global Share
                        </div>
                    </div>
                </div>

                {description && (
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium max-w-[80%] italic">
                        {description}
                    </p>
                )}
            </div>

            {/* Main Chart */}
            <MacroChartContainer height={CHART_HEIGHTS.standard} className="relative z-10 transition-transform duration-700 group-hover:scale-[1.02]">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color === 'blue' ? CHART_COLORS.west : CHART_COLORS.gold} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={color === 'blue' ? CHART_COLORS.west : CHART_COLORS.gold} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            hide
                        />
                        <YAxis
                            domain={['dataMin - 5', 'dataMax + 5']}
                            hide
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color === 'blue' ? CHART_COLORS.west : CHART_COLORS.gold}
                            fill={`url(#${gradId})`}
                            strokeWidth={3}
                            animationDuration={2000}
                        />
                        <ReferenceLine
                            y={currentValue}
                            stroke={color === 'blue' ? '#3b82f680' : '#fbbf2480'}
                            strokeDasharray="4 4"
                            label={{
                                value: `Current: ${currentValue}%`,
                                position: 'right',
                                fill: WHITE_ALPHA.dim,
                                fontSize: 11,
                                fontWeight: 700,
                                className: 'uppercase tracking-heading'
                            }}
                        />
                    </AreaChart>
            </MacroChartContainer>

            {/* Narrative Insight */}
            <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        isDeclining ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    )} />
                    <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                        {isDeclining ? "Structural Erosion" : "Strategic Expansion"}
                    </span>
                </div>
                <div className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                    Source: IMF COFER / WGC
                </div>
            </div>
        </div>
    );
};
