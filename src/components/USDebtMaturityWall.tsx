import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, DollarSign, AlertTriangle } from 'lucide-react';

interface MaturityBucket {
    bucket: string;
    amount: number;
    total_debt: number;
    date: string;
}

interface HistoricalData {
    date: string;
    total_debt: number;
    short_term: number; // <1Y
    medium_term: number; // 1-5Y
    long_term: number; // 5Y+
}

const BUCKET_ORDER = ['<1M', '1-3M', '3-6M', '6-12M', '1-2Y', '2-5Y', '5-10Y', '10Y+'];
const BUCKET_COLORS: Record<string, string> = {
    '<1M': '#ef4444',      // red-500 - immediate risk
    '1-3M': '#f97316',     // orange-500
    '3-6M': '#f59e0b',     // amber-500
    '6-12M': '#eab308',    // yellow-500
    '1-2Y': '#84cc16',     // lime-500
    '2-5Y': '#22c55e',     // green-500
    '5-10Y': '#14b8a6',    // teal-500
    '10Y+': '#06b6d4',     // cyan-500 - longest term
};

export const USDebtMaturityWall: React.FC = () => {
    const [maturityData, setMaturityData] = useState<MaturityBucket[]>([]);
    const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [latestDate, setLatestDate] = useState<string>('');

    useEffect(() => {
        fetchMaturityData();
        fetchHistoricalData();
    }, []);

    const fetchMaturityData = async () => {
        try {
            const { data, error } = await supabase
                .from('us_debt_maturities')
                .select('*')
                .order('date', { ascending: false })
                .limit(8);

            if (error) throw error;

            if (data && data.length > 0) {
                setLatestDate(data[0].date);
                // Sort by bucket order
                const sorted = [...data].sort((a, b) =>
                    BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket)
                );
                setMaturityData(sorted);
            }
        } catch (error) {
            console.error('Error fetching maturity data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoricalData = async () => {
        try {
            const { data, error } = await supabase
                .from('us_debt_maturities')
                .select('date, bucket, amount, total_debt')
                .order('date', { ascending: true });

            if (error) throw error;

            if (data) {
                // Group by date and calculate short/medium/long term
                const grouped = (data as any[]).reduce((acc: Record<string, any>, row: any) => {
                    if (!acc[row.date]) {
                        acc[row.date] = {
                            date: row.date,
                            total_debt: row.total_debt,
                            short_term: 0,
                            medium_term: 0,
                            long_term: 0
                        };
                    }

                    const amount = parseFloat(row.amount);
                    if (['<1M', '1-3M', '3-6M', '6-12M'].includes(row.bucket)) {
                        acc[row.date].short_term += amount;
                    } else if (['1-2Y', '2-5Y'].includes(row.bucket)) {
                        acc[row.date].medium_term += amount;
                    } else {
                        acc[row.date].long_term += amount;
                    }

                    return acc;
                }, {});

                setHistoricalData(Object.values(grouped));
            }
        } catch (error) {
            console.error('Error fetching historical data:', error);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl">
                <div className="animate-pulse text-slate-400">Loading maturity data...</div>
            </div>
        );
    }

    const totalDebt = maturityData[0]?.total_debt || 0;
    const totalDebtTrillions = (totalDebt / 1_000_000).toFixed(2); // Convert millions to trillions

    const shortTermDebt = maturityData
        .filter(d => ['<1M', '1-3M', '3-6M', '6-12M'].includes(d.bucket))
        .reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
    const shortTermTrillions = (shortTermDebt / 1_000_000).toFixed(2);

    const nextYearDebt = maturityData
        .filter(d => ['<1M', '1-3M', '3-6M', '6-12M', '1-2Y'].includes(d.bucket))
        .reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
    const nextYearTrillions = (nextYearDebt / 1_000_000).toFixed(2);

    const chartData = maturityData.map(d => ({
        bucket: d.bucket,
        amount: parseFloat(d.amount.toString()) / 1_000_000, // Convert to trillions for display
        amountMillions: parseFloat(d.amount.toString())
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-300 font-semibold mb-1">{dataPoint.bucket}</p>
                    <p className="text-cyan-400 font-bold text-lg">
                        ${dataPoint.amount.toFixed(2)}T
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                        {((dataPoint.amount / parseFloat(totalDebtTrillions)) * 100).toFixed(1)}% of total
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <section className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-700/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-cyan-400" />
                            US Debt Maturity Wall
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base">
                            Treasury Securities Redemption Schedule • Marketable Debt Only
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>Updated: {new Date(latestDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs italic">U.S. Treasury MSPD – Marketable securities only – updated monthly</span>
                    </div>
                </div>
            </div>

            {/* Key Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 md:p-8 bg-slate-800/30">
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-5 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-6 h-6 text-cyan-400" />
                        <span className="text-slate-400 text-sm font-medium">Total Marketable Debt</span>
                    </div>
                    <p className="text-4xl font-bold text-white">${totalDebtTrillions}T</p>
                    <p className="text-slate-400 text-xs mt-1">Outstanding Treasury Securities</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-5 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                        <span className="text-slate-400 text-sm font-medium">Maturing &lt;1 Year</span>
                    </div>
                    <p className="text-4xl font-bold text-white">${shortTermTrillions}T</p>
                    <p className="text-slate-400 text-xs mt-1">
                        {((parseFloat(shortTermTrillions) / parseFloat(totalDebtTrillions)) * 100).toFixed(1)}% of total debt
                    </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl p-5 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-6 h-6 text-yellow-400" />
                        <span className="text-slate-400 text-sm font-medium">Next 2 Years</span>
                    </div>
                    <p className="text-4xl font-bold text-white">${nextYearTrillions}T</p>
                    <p className="text-slate-400 text-xs mt-1">Refinancing pressure ahead</p>
                </div>
            </div>

            {/* Main Chart: Maturity Buckets */}
            <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-cyan-400 rounded-full"></span>
                    Maturity Distribution
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                            <XAxis
                                type="number"
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `$${value.toFixed(1)}T`}
                            />
                            <YAxis
                                type="category"
                                dataKey="bucket"
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                width={70}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                            <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={BUCKET_COLORS[entry.bucket] || '#06b6d4'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Secondary Chart: Historical Trend */}
            {historicalData.length > 1 && (
                <div className="p-6 md:p-8 border-t border-slate-700/50 bg-slate-800/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-green-400 rounded-full"></span>
                        Historical Maturity Profile
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    tickFormatter={(value) => `$${(value / 1_000_000).toFixed(0)}T`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    formatter={(value: any) => [`$${(value / 1_000_000).toFixed(2)}T`, '']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="short_term"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ fill: '#ef4444', r: 3 }}
                                    name="<1Y"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="medium_term"
                                    stroke="#eab308"
                                    strokeWidth={2}
                                    dot={{ fill: '#eab308', r: 3 }}
                                    name="1-5Y"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="long_term"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    dot={{ fill: '#06b6d4', r: 3 }}
                                    name="5Y+"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-slate-400 text-sm">&lt;1 Year</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-slate-400 text-sm">1-5 Years</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                            <span className="text-slate-400 text-sm">5+ Years</span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
