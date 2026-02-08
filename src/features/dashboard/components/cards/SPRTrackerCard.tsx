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

    if (isLoading) {
        return (
            <Card className="h-[300px] animate-pulse bg-white/5 border-white/10">
                <CardHeader><div className="h-6 w-1/2 bg-white/10 rounded" /></CardHeader>
                <CardContent><div className="h-24 bg-white/5 rounded mt-4" /></CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-400" />
                    Strategic Petroleum Reserve
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                    {latest?.date}
                </span>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div>
                        <div className="text-4xl font-light text-white tracking-tighter">
                            {latest?.value.toFixed(1)}
                            <span className="text-lg text-muted-foreground ml-1">M bbl</span>
                        </div>
                        <div className={`flex items-center text-xs mt-1 ${isAccumulating ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isAccumulating ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(yoyChange).toFixed(1)}M bbl YoY
                        </div>
                    </div>
                </div>

                <div className="h-[160px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="sprGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <YAxis
                                domain={['dataMin - 20', 'dataMax + 20']}
                                hide
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                itemStyle={{ color: '#fb923c' }}
                                formatter={(value: number) => [`${value.toFixed(1)} M bbl`, 'SPR Level']}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#fb923c"
                                strokeWidth={2}
                                fill="url(#sprGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
