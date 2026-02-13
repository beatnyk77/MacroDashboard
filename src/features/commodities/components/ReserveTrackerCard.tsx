import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
        // Map to unique labels (Country - Commodity - Type)
        return reserves.slice(0, 8).map(r => ({
            name: `${r.country} ${r.commodity}`,
            volume: r.volume,
            coverage: r.coverage_days,
            type: r.reserve_type
        }));
    }, [reserves]);

    if (isLoading) return <div className="h-48 animate-pulse bg-white/5 rounded-2xl" />;

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
            <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5 px-4 lg:px-6">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Box className="w-3 h-3 text-emerald-500" />
                    Strategic Reserve & Stockpile Tracker
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            fontSize={10}
                            fontWeight="bold"
                            tick={{ fill: '#94a3b8' }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-slate-950 border border-white/10 rounded-lg p-3 shadow-xl">
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
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.type === 'strategic' ? '#10b981' : '#3b82f6'} fillOpacity={0.6} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
