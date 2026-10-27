import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell
} from 'recharts';
import { DataStatePanel } from '@/components/DataStatePanel';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_YAXIS_PROPS, CHART_COLORS, alpha } from '@/constants/chartDefaults';
import { formatCurrency, formatPercentage } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { TreasuryHolder } from '@/hooks/useTreasuryHolders';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { CountryCode } from '@/components/CountryCode';
import { TREASURY_HOLDER_CODES } from '@/constants/countryCodes';

interface TreasuryHoldersChartProps {
    data: TreasuryHolder[];
    height?: number;
    className?: string;
}

const CHART_INNER_MIN = 200;

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className={`${TOOLTIP_SHELL_CLASS} min-w-[200px]`}>
                <div className="flex items-center gap-2 mb-2">
                    <CountryCode code={TREASURY_HOLDER_CODES[data.country_name]} size="md" />
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {data.country_name}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-end gap-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Holdings</span>
                        <span className="text-lg font-semibold text-slate-100 font-mono tabular-nums">
                            {formatCurrency(data.holdings_usd_bn, { decimals: 1 })}B
                        </span>
                    </div>
                    <div className="flex justify-between items-end gap-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Share</span>
                        <span className="text-xs font-bold text-yellow-400 font-mono tabular-nums">
                            {formatPercentage(data.pct_of_total_foreign, { decimals: 1 })}
                        </span>
                    </div>
                    <div className="flex justify-between items-end gap-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase">MoM Change</span>
                        <span className={cn(
                            "text-xs font-bold tabular-nums",
                            (data.mom_pct_change || 0) > 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {formatPercentage(data.mom_pct_change, { showSign: true, decimals: 1 })}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export const TreasuryHoldersChart: React.FC<TreasuryHoldersChartProps> = ({ data, height = 500, className }) => {
    if (!data || data.length === 0) {
        return (
            <DataStatePanel
                variant="empty"
                title="No holder data"
                description="Treasury foreign holdings are not available for charting."
                height={height}
                className={className}
            />
        );
    }

    const maxVal = Math.max(...data.map(d => d.holdings_usd_bn || 0));
    const chartHeight = Math.max(height - 32, CHART_INNER_MIN);

    return (
        <div className={cn("w-full bg-card rounded-xl border border-border p-4 shadow-sm", className)}>
            <MacroChartContainer height={chartHeight}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                    <XAxis
                        type="number"
                        hide
                        domain={[0, maxVal * 1.1]}
                    />
                    <YAxis
                        {...DEFAULT_YAXIS_PROPS}
                        dataKey="country_name"
                        type="category"
                        width={100}
                        tick={({ x, y, payload }) => (
                            <g transform={`translate(${x},${y})`}>
                                <text x={-10} y={0} dy={4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={11} fontWeight={600}>
                                    {payload.value.length > 15 ? `${payload.value.substring(0, 15)}...` : payload.value}
                                </text>
                            </g>
                        )}
                        axisLine={false}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: alpha(CHART_COLORS.label, 0.08) }}
                    />
                    <Bar
                        dataKey="holdings_usd_bn"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        animationDuration={1500}
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index < 3 ? CHART_COLORS.gold : alpha(CHART_COLORS.gold, 0.6)} // Top 3 brighter gold
                            />
                        ))}
                    </Bar>
                </BarChart>
            </MacroChartContainer>
        </div>
    );
};
