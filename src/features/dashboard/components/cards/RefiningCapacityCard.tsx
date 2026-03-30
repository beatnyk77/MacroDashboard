import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OilRefiningCapacity } from '@/hooks/useOilData';
import { Factory, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RefiningCapacityCardProps {
    data: OilRefiningCapacity[];
    utilizationData?: { date: string; value: number }[];
    isLoading: boolean;
}

export const RefiningCapacityCard: React.FC<RefiningCapacityCardProps> = ({ data, utilizationData = [], isLoading }) => {
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

    // Aggregated EU capacity (Top 5: FR, DE, IT, GB, ES)
    const aggregatedEU = useMemo(() => {
        const byYear = euData.reduce((acc: Record<number, number>, d) => {
            acc[d.as_of_year] = (acc[d.as_of_year] || 0) + d.capacity_mbpd;
            return acc;
        }, {});
        return Object.entries(byYear).map(([year, capacity]) => ({
            as_of_year: parseInt(year),
            capacity_mbpd: capacity as number
        })).sort((a, b) => a.as_of_year - b.as_of_year);
    }, [euData]);

    const latestEU = aggregatedEU[aggregatedEU.length - 1];
    const previousEU = aggregatedEU[aggregatedEU.length - 2];
    const changeEU = latestEU && previousEU ? latestEU.capacity_mbpd - previousEU.capacity_mbpd : 0;
    const isPositiveEU = changeEU >= 0;

    // Aggregated Asia capacity (CN, IN)
    const aggregatedAsia = useMemo(() => {
        const byYear = asiaData.reduce((acc: Record<number, number>, d) => {
            acc[d.as_of_year] = (acc[d.as_of_year] || 0) + d.capacity_mbpd;
            return acc;
        }, {});
        return Object.entries(byYear).map(([year, capacity]) => ({
            as_of_year: parseInt(year),
            capacity_mbpd: capacity as number
        })).sort((a, b) => a.as_of_year - b.as_of_year);
    }, [asiaData]);

    const latestAsia = aggregatedAsia[aggregatedAsia.length - 1];
    const previousAsia = aggregatedAsia[aggregatedAsia.length - 2];
    const changeAsia = latestAsia && previousAsia ? latestAsia.capacity_mbpd - previousAsia.capacity_mbpd : 0;
    const isPositiveAsia = changeAsia >= 0;

    // Process utilization for chart alignment
    const combinedData = useMemo(() => {
        if (region === 'US') {
            return usData.map(d => {
                const util = utilizationData.find(u => u.date.startsWith(String(d.as_of_year)));
                return { ...d, utilization: util?.value || null };
            });
        }
        if (region === 'EU') return aggregatedEU;
        return aggregatedAsia;
    }, [region, usData, aggregatedEU, aggregatedAsia, utilizationData]);

    const latestUtil = utilizationData[utilizationData.length - 1];

    if (isLoading) {
        return (
            <Card className="h-[400px] animate-pulse bg-white/5 border-white/12">
                <CardHeader><div className="h-6 w-1/2 bg-white/10 rounded" /></CardHeader>
                <CardContent><div className="h-24 bg-white/5 rounded mt-4" /></CardContent>
            </Card>
        );
    }

    const currentStats = {
        US: { latest: latestUS, change: changeUS, isPositive: isPositiveUS, label: 'US Aggregate' },
        EU: { latest: latestEU, change: changeEU, isPositive: isPositiveEU, label: 'Top 5 EU + UK Aggregate' },
        Asia: { latest: latestAsia, change: changeAsia, isPositive: isPositiveAsia, label: 'China + India Aggregate' }
    }[region as 'US' | 'EU' | 'Asia'];

    return (
        <Card className="bg-black/40 border-white/12 backdrop-blur-md h-[450px] p-6">
            <CardHeader className="flex flex-row items-center justify-between pb-4 pt-0 px-0">
                <div className="flex flex-col">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-uppercase flex items-center gap-2">
                        <Factory className="h-4 w-4 text-emerald-400" />
                        Atmospheric Crude Distillation Capacity
                    </CardTitle>
                    <div className="flex gap-4 mt-1">
                        {region === 'US' && latestUtil && (
                            <span className="text-xs text-emerald-400/80 font-mono">UTILIZATION RATE: {latestUtil.value.toFixed(1)}%</span>
                        )}
                        <span className="text-xs text-blue-400/80 font-mono">REGION: {region}</span>
                    </div>
                </div>
                <Tabs defaultValue="US" className="w-[180px]" onValueChange={setRegion}>
                    <TabsList className="grid w-full grid-cols-3 h-7 bg-white/5">
                        <TabsTrigger value="US" className="text-xs h-6">US</TabsTrigger>
                        <TabsTrigger value="EU" className="text-xs h-6">EU+</TabsTrigger>
                        <TabsTrigger value="Asia" className="text-xs h-6">Asia</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <div className="space-y-6">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <div className="text-5xl font-light text-white tracking-heading">
                                {currentStats?.latest?.capacity_mbpd.toFixed(2) || '0.00'}
                                <span className="text-xl text-muted-foreground ml-1">mbpd</span>
                            </div>
                            <div className={`flex items-center text-xs mt-1 ${currentStats?.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {currentStats?.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                {Math.abs(currentStats?.change || 0).toFixed(2)} mbpd vs prev
                            </div>
                            <span className="text-xs text-muted-foreground/60">{currentStats?.label}</span>
                        </div>
                        {region === 'US' && (
                            <div className="text-right">
                                <span className="text-xs uppercase text-muted-foreground block font-mono">Strategic Utilization</span>
                                <span className="text-2xl font-mono text-emerald-400">{latestUtil?.value.toFixed(1)}%</span>
                            </div>
                        )}
                    </div>

                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="capGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', fontSize: '12px' }}
                                    itemStyle={{ padding: '2px 0' }}
                                    formatter={(value: number, name: string) => [
                                        name === 'utilization' ? `${value.toFixed(1)}%` : `${value.toFixed(2)} mbpd`,
                                        name === 'utilization' ? 'Utilization' : 'Capacity'
                                    ]}
                                    labelFormatter={(label) => `Year: ${label}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="capacity_mbpd"
                                    name="capacity"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#capGradient)"
                                    animationDuration={1000}
                                />
                                {region === 'US' && (
                                    <Area
                                        type="monotone"
                                        dataKey="utilization"
                                        name="utilization"
                                        stroke="#3b82f6"
                                        strokeWidth={1}
                                        strokeDasharray="5 5"
                                        fill="url(#utilGradient)"
                                        animationDuration={1000}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
