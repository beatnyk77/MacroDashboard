import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOilSpread } from '@/hooks/useOilSpread';
import { Activity, AlertTriangle } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

export const OilSpreadChart: React.FC = () => {
    const { data, isLoading, error } = useOilSpread();

    const chartData = useMemo(() => {
        if (!data) return [];
        // Sort ascending by date for chronological chart
        return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(d => ({
            ...d,
            formattedDate: format(new Date(d.date), 'MMM dd')
        }));
    }, [data]);

    if (isLoading) {
        return (
            <Card className="bg-card/40 backdrop-blur-md border-white/12 h-[400px] flex items-center justify-center">
                <Activity className="w-8 h-8 text-blue-500 animate-spin" />
            </Card>
        );
    }

    if (error || !data || data.length === 0) {
        return (
            <Card className="bg-card/40 backdrop-blur-md border-white/12 h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-semibold">Unable to load WTI Spread Data</span>
                </div>
            </Card>
        );
    }

    const latestSpread = data[0]?.spread || 0;
    const isBackwardation = latestSpread > 0;

    return (
        <Card className="bg-card/40 backdrop-blur-md border-white/12 overflow-hidden shadow-2xl">
            <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-serif text-foreground tracking-heading flex items-center gap-2">
                            <Activity className="w-5 h-5 text-amber-500" />
                            WTI Physical Market Stress
                        </CardTitle>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">
                            CL1 - CL2 Calendar Spread (Front Month vs Next Month)
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-uppercase mb-1">Current Spread</div>
                        <div className={`text-2xl font-black font-mono ${isBackwardation ? 'text-amber-500' : 'text-blue-500'}`}>
                            {latestSpread > 0 ? '+' : ''}{latestSpread.toFixed(2)}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                                dataKey="formattedDate" 
                                stroke="rgba(255,255,255,0.4)" 
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                minTickGap={30}
                            />
                            <YAxis 
                                stroke="rgba(255,255,255,0.4)" 
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `$${val}`}
                                dx={-10}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                }}
                                itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                                labelStyle={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '4px' }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spread']}
                            />
                            
                            {/* Regime Bands */}
                            <ReferenceLine y={16} stroke="#9f1239" strokeDasharray="3 3" strokeOpacity={0.6} label={{ position: 'insideTopLeft', value: 'EXTREME STRESS', fill: '#9f1239', fontSize: 10, fontWeight: 'bold' }} />
                            <ReferenceLine y={10} stroke="#e11d48" strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'insideTopLeft', value: 'STRESSED', fill: '#e11d48', fontSize: 10, fontWeight: 'bold' }} />
                            <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} label={{ position: 'insideTopLeft', value: 'TIGHTENING', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={2} label={{ position: 'insideTopLeft', value: 'PARITY', fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} />
                            <ReferenceLine y={-5} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.4} label={{ position: 'insideBottomLeft', value: 'OVERSUPPLY', fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' }} />

                            <Line 
                                type="monotone" 
                                dataKey="spread" 
                                stroke="#f59e0b" 
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
