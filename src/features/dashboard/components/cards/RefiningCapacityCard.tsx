import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OilRefiningCapacity } from '@/hooks/useOilData';
import { Factory, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface RefiningCapacityCardProps {
    data: OilRefiningCapacity[];
    isLoading: boolean;
}

export const RefiningCapacityCard: React.FC<RefiningCapacityCardProps> = ({ data, isLoading }) => {
    // Process data for chart
    const chartData = useMemo(() => {
        return [...data]
            .sort((a, b) => a.as_of_year - b.as_of_year)
            .map(d => ({
                year: d.as_of_year,
                value: d.capacity_mbpd
            }));
    }, [data]);

    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    const change = latest && previous ? latest.value - previous.value : 0;
    const isPositive = change >= 0;

    if (isLoading) {
        return (
            <Card className="h-[300px] animate-pulse bg-white/5 border-white/10">
                <CardHeader>
                    <div className="h-6 w-1/2 bg-white/10 rounded" />
                </CardHeader>
                <CardContent>
                    <div className="h-24 bg-white/5 rounded mt-4" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Factory className="h-4 w-4 text-emerald-400" />
                    US Refining Capacity
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                    {latest?.year}
                </span>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div>
                        <div className="text-4xl font-light text-white tracking-tighter">
                            {latest?.value.toFixed(2)}
                            <span className="text-lg text-muted-foreground ml-1">mbpd</span>
                        </div>
                        <div className={`flex items-center text-xs mt-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(change).toFixed(2)} mbpd vs prev year
                        </div>
                    </div>
                </div>

                <div className="h-[160px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="year"
                                hide
                            />
                            <YAxis
                                domain={['dataMin - 1', 'dataMax + 1']}
                                hide
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                itemStyle={{ color: '#10b981' }}
                                formatter={(value: number) => [`${value.toFixed(2)} mbpd`, 'Capacity']}
                                labelFormatter={(label) => `Year: ${label}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#capacityGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[0.65rem] uppercase text-muted-foreground tracking-wider block">Global Share</span>
                        <span className="text-sm font-mono text-white/80">~18.5%</span>
                    </div>
                    <div>
                        <span className="text-[0.65rem] uppercase text-muted-foreground tracking-wider block">Utilization</span>
                        <span className="text-sm font-mono text-white/80">91.2%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
