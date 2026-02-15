import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';

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

    if (isLoading) return <div className="h-48 animate-pulse bg-white/5 rounded-2xl border border-white/10" />;

    if (!chartData || chartData.length === 0) {
        return (
            <Card className="bg-black/40 border-white/10 backdrop-blur-md shadow-2xl">
                <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5 px-6">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
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
        <Card className="bg-black/40 border-white/10 backdrop-blur-md shadow-2xl">
            <CardHeader className="pb-4 bg-white/[0.02] border-b border-white/5 px-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Box className="w-4 h-4 text-emerald-500" />
                        Strategic Reserve & Stockpile Tracker
                    </CardTitle>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Strategic</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Commercial</span>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tight mt-1">
                    India Grains & Global Crude Oil Stockpiles
                </p>
            </CardHeader>
            <CardContent className="p-6">
                {/* Big Number Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {chartData.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                    {item.commodity}
                                </span>
                                <span className={cn(
                                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest",
                                    item.stressRegime === 'Comfortable' ? "bg-emerald-500/10 text-emerald-400" :
                                        item.stressRegime === 'Watch' ? "bg-amber-500/10 text-amber-400" :
                                            "bg-rose-500/10 text-rose-400"
                                )}>
                                    {item.stressRegime}
                                </span>
                            </div>
                            <div className="text-2xl font-black text-white tabular-nums leading-none mb-1">
                                {item.volume.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground/60">{item.country}</span>
                                <div className={cn(
                                    "flex items-center gap-0.5 font-bold",
                                    item.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {item.delta >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                    {Math.abs(item.delta).toFixed(1)}%
                                </div>
                            </div>
                            {item.coverage && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">Coverage: </span>
                                    <span className="text-[10px] font-mono text-emerald-400">{item.coverage} days</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={75}
                                fontSize={9}
                                fontWeight="bold"
                                tick={{ fill: '#94a3b8' }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-slate-950 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-xl">
                                            <p className="text-xs font-bold text-white mb-2">{data.name}</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4 text-[10px]">
                                                    <span className="text-muted-foreground">Volume:</span>
                                                    <span className="text-white font-mono">{data.volume.toLocaleString()}</span>
                                                </div>
                                                {data.coverage && (
                                                    <div className="flex justify-between gap-4 text-[10px]">
                                                        <span className="text-muted-foreground">Coverage:</span>
                                                        <span className="text-emerald-400 font-mono">{data.coverage} days</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between gap-4 text-[10px]">
                                                    <span className="text-muted-foreground">12M Change:</span>
                                                    <span className={cn(
                                                        "font-mono",
                                                        data.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        {data.delta >= 0 ? '+' : ''}{data.delta.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-[10px] pt-1 border-t border-white/5">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <span className={cn(
                                                        "font-bold uppercase text-[9px]",
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
                                        fill={entry.type === 'strategic' ? '#10b981' : '#3b82f6'}
                                        fillOpacity={0.7}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
