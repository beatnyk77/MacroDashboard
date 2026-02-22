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
                    <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Box className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                            Resource Security & Stockpile Tracker
                        </span>
                    </CardTitle>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">Strategic</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">Commercial</span>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-tight mt-1">
                    India Grains & Global Crude Oil Stockpiles
                </p>
            </CardHeader>
            <CardContent className="p-6">
                {/* Big Number Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {chartData.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all group/stat relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent blur-xl pointer-events-none" />
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover/stat:text-white/50 transition-colors">
                                    {item.commodity}
                                </span>
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border",
                                    item.stressRegime === 'Comfortable' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        item.stressRegime === 'Watch' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                            "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                )}>
                                    {item.stressRegime}
                                </span>
                            </div>
                            <div className="text-3xl font-black text-white italic tabular-nums leading-none mb-2 tracking-tighter">
                                {item.volume.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide mt-1">
                                <span className="text-white/40">{item.country}</span>
                                <div className={cn(
                                    "flex items-center gap-1",
                                    item.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {item.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {Math.abs(item.delta).toFixed(1)}%
                                </div>
                            </div>
                            {item.coverage && (
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Inventory Coverage</span>
                                    <span className="text-[11px] font-mono font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{item.coverage} <span className="text-[8px] opacity-40 italic">DAYS</span></span>
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
                                width={120}
                                fontSize={10}
                                fontWeight="900"
                                tick={{ fill: '#f8fafc', opacity: 0.6 }}
                                axisLine={false}
                                tickLine={false}
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
