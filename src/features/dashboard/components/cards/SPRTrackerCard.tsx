import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Tooltip, YAxis } from 'recharts';
import { DataStatePanel } from '@/components/DataStatePanel';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import { CHART_HEIGHTS, DEFAULT_TOOLTIP_STYLE } from '@/constants/chartDefaults';

interface SPRTrackerCardProps {
    data: { date: string; value: number }[];
    isLoading: boolean;
}

export const SPRTrackerCard: React.FC<SPRTrackerCardProps> = ({ data, isLoading }) => {
    // Data is already sorted ascending by date
    const latest = data[data.length - 1];
    const yearAgoIndex = data.length > 12 ? data.length - 13 : 0;
    const yearAgo = data[yearAgoIndex]; // Approximation

    const yoyChange = latest && yearAgo ? latest.value - yearAgo.value : 0;
    const isAccumulating = yoyChange >= 0;

    // US SPR Capacity is approx 713.5 million barrels (historically higher, but current focus is ~714)
    const MAX_CAPACITY = 713.5;
    const fillPct = latest ? (latest.value / MAX_CAPACITY) * 100 : 0;

    if (isLoading) {
        return (
            <DataStatePanel
                variant="pending"
                title="Loading SPR inventory data"
                height={400}
            />
        );
    }

    if (!data || data.length === 0) {
        return (
            <DataStatePanel
                variant="empty"
                title="No SPR data"
                description="Strategic Petroleum Reserve observations are not yet populated."
                height={400}
            />
        );
    }

    return (
        <Card className="bg-black/40 border-white/12 backdrop-blur-md h-[450px] p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-4 pt-0 px-0">
                <div className="flex flex-col">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-uppercase flex items-center gap-2">
                        <Database className="h-4 w-4 text-orange-400" />
                        Storage Inventory & Strategic Buffers
                    </CardTitle>
                    <div className="flex gap-4 mt-1">
                        <span className="text-xs text-orange-400/80 font-mono">CAPACITY UTILIZATION: {fillPct.toFixed(1)}%</span>
                        <span className="text-xs text-muted-foreground font-mono uppercase">Reference Cap: 713.5M bbl</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground font-black uppercase tracking-uppercase bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        DATA CURRENT AS OF: {latest?.date}
                    </span>
                    <span className="text-xs text-muted-foreground/40 font-bold uppercase tracking-heading">Updated Weekly via EIA/FRED</span>
                </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <div className="flex items-baseline justify-between mb-8">
                    <div>
                        <div className="text-5xl font-light text-white tracking-heading">
                            {latest?.value.toFixed(1)}
                            <span className="text-xl text-muted-foreground ml-2">M bbl</span>
                        </div>
                        <div className={`flex items-center text-sm mt-1 ${isAccumulating ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isAccumulating ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                            {Math.abs(yoyChange).toFixed(1)}M bbl ({((yoyChange / latest?.value) * 100).toFixed(1)}%) 12-Month Delta
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                            <div
                                className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                                style={{ width: `${fillPct}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase tracking-heading">Inventory Health Index</span>
                    </div>
                </div>

                <div className="w-full mt-2">
                    <MacroChartContainer height={CHART_HEIGHTS.standard}>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="sprGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <YAxis
                                domain={[0, 800]}
                                hide
                            />
                            <Tooltip
                                contentStyle={DEFAULT_TOOLTIP_STYLE}
                                itemStyle={{ color: '#fb923c' }}
                                formatter={(value: number) => [`${value.toFixed(1)} M bbl`, 'SPR Level']}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#fb923c"
                                strokeWidth={3}
                                fill="url(#sprGradient)"
                                animationDuration={1500}
                                dot={false}
                                activeDot={{ r: 4, fill: '#fb923c', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </MacroChartContainer>
                </div>
            </CardContent>
        </Card>
    );
};
