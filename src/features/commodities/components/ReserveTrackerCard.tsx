import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { CHART_FONT_FAMILY, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { cn } from '@/lib/utils';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const ReserveTrackerCard: React.FC = () => {
    const { data: reserves, isLoading } = useQuery({
        queryKey: ['commodity-reserves'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('commodity_reserves')
                .select('*')
                .order('as_of_date', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    const chartData = React.useMemo(() => {
        if (!reserves) return [];

        // Get latest data for each commodity-country combination
        const latestByKey = reserves.reduce((acc: any, r: any) => {
            const key = `${r.country}-${r.commodity}`;
            if (!acc[key] || new Date(r.as_of_date) > new Date(acc[key].as_of_date)) {
                acc[key] = r;
            }
            return acc;
        }, {});

        // Calculate 12-month delta
        return Object.values(latestByKey).slice(0, 8).map((r: any) => {
            // Find previous year data
            const prevYear = reserves.find((prev: any) =>
                prev.country === r.country &&
                prev.commodity === r.commodity &&
                Math.abs(new Date(prev.as_of_date).getTime() - new Date(r.as_of_date).getTime()) > 300 * 24 * 60 * 60 * 1000 // ~10 months
            );

            const delta = prevYear ? ((r.volume - prevYear.volume) / prevYear.volume) * 100 : 0;

            // Determine stress regime based on coverage days
            const stressRegime = r.coverage_days > 90 ? 'Comfortable' :
                r.coverage_days > 60 ? 'Watch' : 'Critical';

            return {
                name: `${r.country} ${r.commodity}`,
                volume: r.volume,
                coverage: r.coverage_days,
                type: r.reserve_type,
                delta,
                stressRegime,
                country: r.country,
                commodity: r.commodity
            };
        });
    }, [reserves]);

    if (isLoading) return <div className="h-48 animate-pulse bg-white/5 rounded-xl border border-border" />;

    if (!chartData || chartData.length === 0) {
        return (
            <Card className="bg-background/40 border-border backdrop-blur-md shadow-2xl">
                <CardHeader className="pb-2 bg-white/[0.02] border-b border-border px-6">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Box className="w-4 h-4 text-emerald-500" />
                        Strategic Reserve & Stockpile Tracker
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No reserve data available. Run commodity reserves ingestion.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-background/40 border-border backdrop-blur-md shadow-2xl">
            <CardHeader className="pb-4 bg-white/[0.02] border-b border-border px-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-heading flex items-center gap-3">
                        <Box className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                            Resource Security & Stockpile Tracker
                        </span>
                    </CardTitle>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider leading-none">Strategic</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider leading-none">Commercial</span>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-heading mt-1">
                    India Grains & Global Crude Oil Stockpiles
                </p>
            </CardHeader>
            <CardContent className="p-6">
                {/* Big Number Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {chartData.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="p-5 rounded-xl bg-white/[0.03] border border-border hover:bg-white/[0.05] transition-all group/stat relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent blur-xl pointer-events-none" />
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider group-hover/stat:text-white/50 transition-colors">
                                    {item.commodity}
                                </span>
                                <span className={cn(
                                    "text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                                    item.stressRegime === 'Comfortable' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        item.stressRegime === 'Watch' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                            "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                )}>
                                    {item.stressRegime}
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-white italic tabular-nums leading-none mb-2 tracking-heading">
                                {item.volume.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mt-1">
                                <span className="text-terminal-dim">{item.country}</span>
                                <div className={cn(
                                    "flex items-center gap-1",
                                    item.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {item.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {Math.abs(item.delta).toFixed(1)}%
                                </div>
                            </div>
                            {item.coverage && (
                                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                    <span className="text-xs text-white/20 font-semibold uppercase tracking-wider">Inventory Coverage</span>
                                    <span className="text-xs font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{item.coverage} <span className="text-xs opacity-40 italic">DAYS</span></span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <MacroChartContainer height={CHART_HEIGHTS.standard}>
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                {...DEFAULT_YAXIS_PROPS}
                                dataKey="name"
                                type="category"
                                width={120}
                                fontSize={11}
                                fontWeight="900"
                                tick={{ fontFamily: CHART_FONT_FAMILY, fill: CHART_COLORS.textStrong, opacity: 0.6 }}
                                axisLine={false}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const data = payload[0].payload;
                                    return (
                                        <div className={TOOLTIP_SHELL_CLASS}>
                                            <p className="text-xs font-bold text-slate-100 mb-2">{data.name}</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4 text-xs">
                                                    <span className="text-slate-400">Volume:</span>
                                                    <span className="text-slate-100 font-mono">{data.volume.toLocaleString()}</span>
                                                </div>
                                                {data.coverage && (
                                                    <div className="flex justify-between gap-4 text-xs">
                                                        <span className="text-slate-400">Coverage:</span>
                                                        <span className="text-emerald-400 font-mono">{data.coverage} days</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between gap-4 text-xs">
                                                    <span className="text-slate-400">12M Change:</span>
                                                    <span className={cn(
                                                        "font-mono",
                                                        data.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        {data.delta >= 0 ? '+' : ''}{data.delta.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-xs pt-1 border-t border-border">
                                                    <span className="text-slate-400">Status:</span>
                                                    <span className={cn(
                                                        "font-semibold uppercase text-xs",
                                                        data.stressRegime === 'Comfortable' ? "text-emerald-400" :
                                                            data.stressRegime === 'Watch' ? "text-amber-400" :
                                                                "text-rose-400"
                                                    )}>
                                                        {data.stressRegime}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.type === 'strategic' ? CHART_COLORS.expansion : CHART_COLORS.west}
                                        fillOpacity={0.7}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                </MacroChartContainer>
            </CardContent>
        </Card>
    );
};
