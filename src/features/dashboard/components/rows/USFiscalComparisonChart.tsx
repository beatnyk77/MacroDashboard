import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceArea
} from 'recharts';
import { format } from 'date-fns';
import { useUSMacroPulse } from '../../../../hooks/useUSMacroPulse';

interface USFiscalComparisonChartProps {
    // Add props if needed
}

const USFiscalComparisonChart: React.FC<USFiscalComparisonChartProps> = () => {
    const { data: pulseData, isLoading } = useUSMacroPulse();

    const chartData = useMemo(() => {
        if (!pulseData) return [];

        const defense = pulseData.find((m: any) => m.metric_id === 'US_DEFENSE_SPENDING');
        const interest = pulseData.find((m: any) => m.metric_id === 'US_FEDERAL_INTEREST_PAYMENTS');

        if (!defense || !interest) return [];

        const defenseMap = new Map((defense.history || []).map((h: any) => [h.date, h.value]));
        const interestMap = new Map((interest.history || []).map((h: any) => [h.date, h.value]));
        const allDates = Array.from(new Set([...defenseMap.keys(), ...interestMap.keys()])).sort() as string[];

        return allDates.map((date: string) => ({
            date,
            defense: defenseMap.get(date),
            interest: interestMap.get(date)
        }));
    }, [pulseData]);

    // Recessions (approx dates for visualization)
    const recessions = [
        { start: '2001-03-01', end: '2001-11-01' },
        { start: '2007-12-01', end: '2009-06-01' },
        { start: '2020-02-01', end: '2020-04-01' }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80 bg-black/20 animate-pulse rounded-xl border border-white/5">
                <span className="text-white/40 font-mono text-sm">Loading Fiscal Telemetry...</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-6 glass-morphism overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                        US Defense Spending vs Federal Debt Interest
                    </h3>
                    <p className="text-white/50 text-sm font-mono mt-1">
                        Historical Comparison ($ Billions, Monthly)
                    </p>
                </div>
                <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <span className="text-red-400 text-sm font-bold animate-pulse">
                        CRITICAL INSIGHT: Interest payments now rival or exceed defense spending
                    </span>
                </div>
            </div>

            <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str: string) => format(new Date(str), 'yyyy')}
                            ticks={['1995-01-01', '2000-01-01', '2005-01-01', '2010-01-01', '2015-01-01', '2020-01-01', '2024-01-01']}
                            stroke="#ffffff40"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#6366f1"
                            fontSize={12}
                            tickFormatter={(val: number) => `$${val}B`}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#f43f5e"
                            fontSize={12}
                            tickFormatter={(val: number) => `$${val}B`}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                            labelFormatter={(label: string) => {
                                try {
                                    return format(new Date(label), 'MMMM yyyy');
                                } catch {
                                    return label;
                                }
                            }}
                        />
                        <Legend verticalAlign="top" height={36} />

                        {recessions.map((r, i) => (
                            <ReferenceArea
                                key={i}
                                x1={r.start}
                                x2={r.end}
                                fill="#ffffff"
                                fillOpacity={0.05}
                                yAxisId="left"
                            />
                        ))}

                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="defense"
                            name="Defense Spending"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: '#0f172a' }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="interest"
                            name="Interest Payments"
                            stroke="#f43f5e"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, stroke: '#f43f5e', strokeWidth: 2, fill: '#0f172a' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 flex flex-wrap gap-6 border-t border-white/5 pt-6">
                <div className="flex-1 min-w-[200px]">
                    <span className="text-white/30 text-xs font-mono uppercase tracking-wider block mb-2">Sources</span>
                    <div className="flex gap-4">
                        <span className="text-white/60 text-sm">BEA (National Defense)</span>
                        <span className="text-white/60 text-sm">Treasury (Interest)</span>
                    </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <span className="text-white/30 text-xs font-mono uppercase tracking-wider block mb-2">Note</span>
                    <p className="text-white/50 text-[11px] leading-relaxed">
                        Data indexed to 1995. Federal debt interest encompasses all payments on public debt securities.
                        Defense spending includes gross investment and consumption expenditures.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default USFiscalComparisonChart;
