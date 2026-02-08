import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OilRefiningCapacity } from '@/hooks/useOilData';
import { Factory, TrendingDown, TrendingUp, Globe } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RefiningCapacityCardProps {
    data: OilRefiningCapacity[];
    isLoading: boolean;
}

export const RefiningCapacityCard: React.FC<RefiningCapacityCardProps> = ({ data, isLoading }) => {
    const [region, setRegion] = useState('US');

    // Process data for charts
    const { usData, euData, asiaData } = useMemo(() => {
        const us = data.filter(d => d.country_code === 'US').sort((a, b) => a.as_of_year - b.as_of_year);
        const eu = data.filter(d => ['FR', 'DE', 'IT', 'GB', 'ES'].includes(d.country_code));
        const asia = data.filter(d => ['CN', 'IN'].includes(d.country_code));
        return { usData: us, euData: eu, asiaData: asia };
    }, [data]);

    const latestUS = usData[usData.length - 1];
    const previousUS = usData[usData.length - 2];
    const changeUS = latestUS && previousUS ? latestUS.capacity_mbpd - previousUS.capacity_mbpd : 0;
    const isPositiveUS = changeUS >= 0;

    // EU Aggregation
    const latestEUYear = Math.max(...euData.map(d => d.as_of_year), 0);
    const euCurrent = euData.filter(d => d.as_of_year === latestEUYear);
    const euTotal = euCurrent.reduce((sum, d) => sum + d.capacity_mbpd, 0);

    // Asia Aggregation
    const latestAsiaYear = Math.max(...asiaData.map(d => d.as_of_year), 0);
    const asiaCurrent = asiaData.filter(d => d.as_of_year === latestAsiaYear);
    const asiaTotal = asiaCurrent.reduce((sum, d) => sum + d.capacity_mbpd, 0);

    if (isLoading) {
        return (
            <Card className="h-[350px] animate-pulse bg-white/5 border-white/10">
                <CardHeader><div className="h-6 w-1/2 bg-white/10 rounded" /></CardHeader>
                <CardContent><div className="h-24 bg-white/5 rounded mt-4" /></CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Factory className="h-4 w-4 text-emerald-400" />
                    Refining Capacity
                </CardTitle>
                <Tabs defaultValue="US" className="w-[180px]" onValueChange={setRegion}>
                    <TabsList className="grid w-full grid-cols-3 h-7 bg-white/5">
                        <TabsTrigger value="US" className="text-xs h-6">US</TabsTrigger>
                        <TabsTrigger value="EU" className="text-xs h-6">EU+</TabsTrigger>
                        <TabsTrigger value="Asia" className="text-xs h-6">Asia</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                {region === 'US' ? (
                    <div className="space-y-6">
                        <div className="flex items-baseline justify-between">
                            <div>
                                <div className="text-4xl font-light text-white tracking-tighter">
                                    {latestUS?.capacity_mbpd.toFixed(2)}
                                    <span className="text-lg text-muted-foreground ml-1">mbpd</span>
                                </div>
                                <div className={`flex items-center text-xs mt-1 ${isPositiveUS ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPositiveUS ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {Math.abs(changeUS).toFixed(2)} mbpd vs prev
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[0.65rem] uppercase text-muted-foreground block">Global Share</span>
                                <span className="text-sm font-mono text-white/80">~18.5%</span>
                            </div>
                        </div>

                        <div className="h-[160px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={usData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="usGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                        itemStyle={{ color: '#10b981' }}
                                        formatter={(value: number) => [`${value.toFixed(2)} mbpd`, 'Capacity']}
                                        labelFormatter={(label) => `Year: ${label}`}
                                    />
                                    <Area type="monotone" dataKey="capacity_mbpd" stroke="#10b981" fill="url(#usGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : region === 'EU' ? (
                    <div className="space-y-4">
                        <div className="flex items-baseline justify-between mb-2">
                            <div>
                                <div className="text-3xl font-light text-white tracking-tighter">
                                    {euTotal.toFixed(2)}
                                    <span className="text-lg text-muted-foreground ml-1">mbpd</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Top 5 EU + UK Total ({latestEUYear})</span>
                            </div>
                            <Globe className="h-8 w-8 text-blue-500/20" />
                        </div>

                        <div className="space-y-2">
                            {euCurrent.sort((a, b) => b.capacity_mbpd - a.capacity_mbpd).map(c => (
                                <div key={c.country_code} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground w-6">{c.country_code}</span>
                                        <span className="text-white/80">{c.country_name}</span>
                                    </div>
                                    <span className="font-mono">{c.capacity_mbpd.toFixed(2)}</span>
                                </div>
                            ))}
                            {euCurrent.length === 0 && (
                                <div className="text-sm text-yellow-500/80 italic">
                                    No data. Run 'ingest-oil-global'.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-baseline justify-between mb-2">
                            <div>
                                <div className="text-3xl font-light text-white tracking-tighter">
                                    {asiaTotal.toFixed(2)}
                                    <span className="text-lg text-muted-foreground ml-1">mbpd</span>
                                </div>
                                <span className="text-xs text-muted-foreground">China + India Total ({latestAsiaYear})</span>
                            </div>
                            <Globe className="h-8 w-8 text-rose-500/20" />
                        </div>

                        <div className="space-y-2">
                            {asiaCurrent.sort((a, b) => b.capacity_mbpd - a.capacity_mbpd).map(c => (
                                <div key={c.country_code} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground w-6">{c.country_code}</span>
                                        <span className="text-white/80">{c.country_name}</span>
                                    </div>
                                    <span className="font-mono">{c.capacity_mbpd.toFixed(2)}</span>
                                </div>
                            ))}
                            {asiaCurrent.length === 0 && (
                                <div className="text-sm text-yellow-500/80 italic">
                                    No data. Run 'ingest-oil-global'.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
