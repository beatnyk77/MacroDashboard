import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

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
            <Card className="h-[400px] animate-pulse bg-white/5 border-white/10">
                <CardHeader><div className="h-6 w-1/2 bg-white/10 rounded" /></CardHeader>
                <CardContent><div className="h-24 bg-white/5 rounded mt-4" /></CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md h-[450px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Database className="h-4 w-4 text-orange-400" />
                        Storage Inventory & Strategic Buffers
                    </CardTitle>
                    <div className="flex gap-4 mt-1">
                        <span className="text-[10px] text-orange-400/80 font-mono">CAPACITY UTILIZATION: {fillPct.toFixed(1)}%</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">Reference Cap: 713.5M bbl</span>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded">
                    LATEST: {latest?.date}
                </span>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between mb-8">
                    <div>
                        <div className="text-5xl font-light text-white tracking-tighter">
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
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Inventory Health Index</span>
                    </div>
                </div>

                <div className="h-[240px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
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
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
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
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
