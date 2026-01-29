import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from 'recharts';
import { useGoldReturns } from '@/hooks/useGoldReturns';
// import { format } from 'date-fns'; // Removed to avoid dependency issue

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-gray-950 border border-gray-800 p-4 rounded-lg shadow-2xl backdrop-blur-md">
                <p className="text-gray-400 text-xs font-mono mb-1">{data.formattedDate}</p>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-lg font-bold ${data.return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {data.return_pct.toFixed(2)}%
                    </span>
                    <span className="text-gray-500 text-sm">Monthly Return</span>
                </div>
                {data.event_name && (
                    <div className="border-t border-gray-800 pt-2 mt-2">
                        <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-1">
                            {data.event_name}
                        </p>
                        <p className="text-gray-300 text-sm leading-snug">
                            {data.event_description}
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 font-mono">
                            {data.macro_regime}
                        </span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const GoldReturnsChart: React.FC = () => {
    const { data: returns, isLoading } = useGoldReturns();

    const chartData = useMemo(() => {
        if (!returns) return [];
        return returns.map((r) => ({
            ...r,
            // Append 'T00:00:00' to ensure local timezone parsing doesn't shift the day if it's treated as UTC
            formattedDate: new Date(`${r.month_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            color: r.return_pct >= 0 ? '#10b981' : '#ef4444',
        }));
    }, [returns]);

    if (isLoading) {
        return (
            <div className="h-[400px] flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full bg-gray-950/20 rounded-xl p-4 border border-gray-800/50 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="positiveReturn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="negativeReturn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                    <XAxis
                        dataKey="month_date"
                        hide
                    />
                    <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                    <Bar
                        dataKey="return_pct"
                        radius={[2, 2, 0, 0]}
                        animationDuration={1500}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.event_name ? '#eab308' : entry.return_pct >= 0 ? 'url(#positiveReturn)' : 'url(#negativeReturn)'}
                                stroke={entry.event_name ? '#eab308' : 'none'}
                                strokeWidth={entry.event_name ? 1 : 0}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GoldReturnsChart;
