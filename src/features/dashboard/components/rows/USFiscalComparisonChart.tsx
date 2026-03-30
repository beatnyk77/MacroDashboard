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

const USFiscalComparisonChart: React.FC = () => {
    const { data: pulseData, isLoading } = useUSMacroPulse();

    const chartData = useMemo(() => {
        if (!pulseData) return [];

        const defense = pulseData.find((m: any) => m.metric_id === 'US_DEFENSE_SPENDING');
        const interest = pulseData.find((m: any) => m.metric_id === 'US_FEDERAL_INTEREST_PAYMENTS');

        if (!defense || !interest) return [];

        const defenseMap = new Map((defense.history || []).map((h: any) => [h.date, h.value]));
        const interestMap = new Map((interest.history || []).map((h: any) => [h.date, h.value]));
        const allDates = Array.from(new Set([...defenseMap.keys(), ...interestMap.keys()])).sort() as string[];

        // Filter to show data from 2000 onwards
        const filteredDates = allDates.filter((date: string) => date >= '2000-01-01');

        return filteredDates.map((date: string) => ({
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

    // Generate X-axis ticks dynamically (from 2000 to latest)
    const xAxisTicks = useMemo(() => {
        if (chartData.length === 0) return [];
        const firstDate = new Date(chartData[0].date);
        const lastDate = new Date(chartData[chartData.length - 1].date);
        const startYear = Math.max(2000, firstDate.getFullYear());
        const endYear = lastDate.getFullYear();
        const ticks: string[] = [];
        for (let year = startYear; year <= endYear; year += 5) {
            ticks.push(`${year}-01-01`);
        }
        if (ticks[ticks.length - 1] !== `${endYear}-01-01`) {
            ticks.push(`${endYear}-01-01`);
        }
        return ticks;
    }, [chartData]);

    // Compute latest values before conditional return to obey Rules of Hooks
    const latestValues = useMemo(() => {
        if (chartData.length === 0) return null;
        const latest = chartData[chartData.length - 1];
        return {
            defense: latest.defense,
            interest: latest.interest,
            date: latest.date
        };
    }, [chartData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-80 bg-black/20 animate-pulse rounded-xl border border-white/5">
                <span className="text-white/40 font-mono text-sm">Loading Fiscal Telemetry...</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#0A0A0A] border border-white/12 rounded-xl p-6 glass-morphism overflow-hidden">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-heading">
                            US Defense Spending vs Federal Debt Interest
                        </h3>
                        <p className="text-white/50 text-sm font-mono mt-1">
                            Historical Comparison ($ Billions, Monthly)
                            <span className="text-white/30 ml-2">
                                • Latest: {latestValues ? format(new Date(latestValues.date), 'MMM yyyy') : 'N/A'}
                            </span>
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg shrink-0">
                        <span className="text-red-400 text-sm font-bold animate-pulse">
                            CRITICAL INSIGHT: Interest payments now rival or exceed defense spending
                        </span>
                    </div>
                </div>

                {/* Current values display */}
                {latestValues && (
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span className="text-white/60">Defense:</span>
                            <span className="text-indigo-400 font-mono font-bold">
                                ${(latestValues.defense / 1e3).toFixed(1)}T
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            <span className="text-white/60">Interest:</span>
                            <span className="text-rose-400 font-mono font-bold">
                                ${(latestValues.interest / 1e3).toFixed(1)}T
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str: string) => format(new Date(str), 'yyyy')}
                            ticks={xAxisTicks}
                            stroke="#ffffff40"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={50}
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
                        <Legend
                            verticalAlign="top"
                            align="right"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{
                                fontSize: '12px',
                                color: '#ffffff80',
                                textAlign: 'right'
                            }}
                        />

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
                    <span className="text-white/30 text-xs font-mono uppercase tracking-uppercase block mb-2">Sources</span>
                    <div className="flex gap-4">
                        <span className="text-white/60 text-sm">BEA (National Defense)</span>
                        <span className="text-white/60 text-sm">Treasury (Interest)</span>
                    </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <span className="text-white/30 text-xs font-mono uppercase tracking-uppercase block mb-2">Note</span>
                    <p className="text-white/50 text-xs leading-relaxed">
                        Data shown in nominal USD billions. Federal debt interest encompasses all payments on public debt securities.
                        Defense spending includes gross investment and consumption expenditures.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default USFiscalComparisonChart;
