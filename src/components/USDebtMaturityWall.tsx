import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, DollarSign, AlertTriangle, ArrowUpRight, Percent, Activity, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface MaturityBucket {
    bucket: string;
    amount: number;
    total_debt: number;
    date: string;
    low_cost_amount: number;
    medium_cost_amount: number;
    high_cost_amount: number;
    tbill_amount: number;
    tbill_avg_yield: number;
}

interface HistoricalData {
    date: string;
    total_debt: number;
    short_term: number; // <1Y
    medium_term: number; // 1-5Y
    long_term: number; // 5Y+
}

const BUCKET_ORDER = ['<1M', '1-3M', '3-6M', '6-12M', '1-2Y', '2-5Y', '5-10Y', '10Y+'];
// Solid colors for the stacked bars
const COST_COLORS = {
    low: '#22c55e',    // green-500
    medium: '#f59e0b', // amber-500
    high: '#ef4444',   // red-500
    tbill: '#94a3b8'    // slate-400
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

    const shortTermBuckets = ['<1M', '1-3M', '3-6M', '6-12M'];
    const shortTermData = maturityData.filter(d => shortTermBuckets.includes(d.bucket));

    const shortTermDebt = shortTermData.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
    const shortTermTrillions = (shortTermDebt / 1_000_000).toFixed(2);

    // Calculate Rollover Risk: Low + Medium cost debt maturing in < 1 year
    // This assumes specific columns exist; fallback to estimate if not yet populated
    const rolloverRiskAmount = shortTermData.reduce((sum, d) => {
        const low = d.low_cost_amount || 0;
        const medium = d.medium_cost_amount || 0;
        return sum + parseFloat(low.toString()) + parseFloat(medium.toString());
    }, 0);
    const rolloverRiskTrillions = (rolloverRiskAmount / 1_000_000).toFixed(2);
    // Unused: const rolloverRiskPct = ((rolloverRiskAmount / shortTermDebt) * 100).toFixed(1);

    const tbillShortTerm = shortTermData.reduce((sum, d) => sum + (d.tbill_amount || 0), 0);
    const tbillShortTermTrillions = (tbillShortTerm / 1_000_000).toFixed(2);
    const tbillAvgYield = shortTermData.reduce((sum, d) => sum + ((d.tbill_amount || 0) * (d.tbill_avg_yield || 0)), 0) / (tbillShortTerm || 1);

    const chartData = maturityData.map(d => ({
        bucket: d.bucket,
        amount: parseFloat(d.amount.toString()) / 1_000_000,
        tbill: (d.tbill_amount || 0) / 1_000_000,
        tbillYield: d.tbill_avg_yield || 0,
        low: (d.low_cost_amount || 0) / 1_000_000,
        medium: (d.medium_cost_amount || 0) / 1_000_000,
        high: (d.high_cost_amount || 0) / 1_000_000,
        amountMillions: parseFloat(d.amount.toString())
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            const total = dataPoint.amount;
            return (
                <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl z-50">
                    <p className="text-slate-300 font-semibold mb-2 border-b border-slate-700 pb-1">{dataPoint.bucket}</p>
                    <div className="space-y-1">
                        {dataPoint.tbill > 0 && (
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 border border-dashed border-slate-200"></div>
                                    T-bills (discount, {dataPoint.tbillYield.toFixed(2)}%)
                                </span>
                                <span className="text-white font-mono">${dataPoint.tbill.toFixed(2)}T</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-red-400 text-xs flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>High Cost (&gt;4%)</span>
                            <span className="text-white font-mono">${dataPoint.high.toFixed(2)}T</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-amber-400 text-xs flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Medium (2-4%)</span>
                            <span className="text-white font-mono">${dataPoint.medium.toFixed(2)}T</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-green-400 text-xs flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Low Cost (&lt;2%)</span>
                            <span className="text-white font-mono">${dataPoint.low.toFixed(2)}T</span>
                        </div>
                        <div className="border-t border-slate-700 pt-1 mt-1 flex items-center justify-between gap-4">
                            <span className="text-slate-400 text-xs font-semibold">Total</span>
                            <span className="text-cyan-400 font-bold">${total.toFixed(2)}T</span>
                        </div>
                    </div>
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
                        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
                            Treasury Securities Redemption Schedule • <span className="text-amber-400 font-medium">Highlighting Rollover Risk</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>Updated: {new Date(latestDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs italic">U.S. Treasury MSPD</span>
                    </div>
                </div>
            </div>

            {/* Key Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 md:p-8 bg-slate-800/30">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-6 h-6 text-cyan-400" />
                        <span className="text-slate-400 text-sm font-medium">Total Marketable Debt</span>
                    </div>
                    <p className="text-3xl font-bold text-white">${totalDebtTrillions}T</p>
                    <p className="text-slate-500 text-xs mt-1">Outstanding Securities</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-orange-500/30 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                        <span className="text-slate-400 text-sm font-medium">Maturing &lt;1 Year</span>
                    </div>
                    <p className="text-3xl font-bold text-white">${shortTermTrillions}T</p>
                    <p className="text-slate-500 text-xs mt-1">
                        {((parseFloat(shortTermTrillions) / parseFloat(totalDebtTrillions)) * 100).toFixed(1)}% of total debt
                    </p>
                </motion.div>

                {/* Rollover Risk Card - NEW */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                >
                    <Link
                        to="/glossary/sovereign-rollover-risk"
                        className="block bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5 relative overflow-hidden group hover:border-red-400/50 transition-colors cursor-pointer"
                        title="View Glossary Definition"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ArrowUpRight className="w-16 h-16 text-red-500" />
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <BookOpen className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <Activity className="w-6 h-6 text-red-400" />
                            <span className="text-red-200 text-sm font-medium">Rollover Shock Risk</span>
                        </div>
                        <p className="text-3xl font-bold text-white relative z-10">${rolloverRiskTrillions}T</p>
                        <div className="relative z-10 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="text-red-300 text-xs bg-red-500/20 px-1.5 py-0.5 rounded">Low-Cost Debt</span>
                                <span className="text-slate-400 text-xs">maturing &lt;1Y</span>
                            </div>
                        </div>
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-500/30 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-6 h-6 text-slate-400" />
                        <span className="text-slate-400 text-sm font-medium">T-Bills Maturing ≤1Y</span>
                    </div>
                    <p className="text-3xl font-bold text-white">${tbillShortTermTrillions}T</p>
                    <p className="text-slate-500 text-xs mt-1">Issued @ avg. {tbillAvgYield.toFixed(2)}% yield</p>
                </motion.div>
            </div>

            {/* Main Chart: Maturity Buckets with Rollover Stack */}
            <div className="p-6 md:p-8 grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-cyan-400 rounded-full"></span>
                            Maturity & Cost Distribution
                        </h3>
                        {/* Legend */}
                        <div className="flex gap-4" role="legend" aria-label="Maturity Cost Legend">
                            <div className="flex items-center gap-2" role="listitem">
                                <div className="w-3 h-3 rounded-sm bg-slate-400 border border-dashed border-slate-200" aria-hidden="true"></div>
                                <span className="text-slate-400 text-xs">T-Bills (discount)</span>
                            </div>
                            <div className="flex items-center gap-2" role="listitem">
                                <div className="w-3 h-3 rounded-sm bg-red-500" aria-hidden="true"></div>
                                <span className="text-slate-400 text-xs">High Cost (&gt;4%)</span>
                            </div>
                            <div className="flex items-center gap-2" role="listitem">
                                <div className="w-3 h-3 rounded-sm bg-amber-500" aria-hidden="true"></div>
                                <span className="text-slate-400 text-xs">Medium</span>
                            </div>
                            <div className="flex items-center gap-2" role="listitem">
                                <div className="w-3 h-3 rounded-sm bg-green-500" aria-hidden="true"></div>
                                <span className="text-slate-400 text-xs">Low Cost (&lt;2%)</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
                                <XAxis
                                    type="number"
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}T`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="bucket"
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                                {/* Stacked Bars */}
                                <Bar dataKey="tbill" name="T-Bills (discount)" stackId="a" fill={COST_COLORS.tbill} radius={[0, 0, 0, 0]} stroke="#cbd5e1" strokeDasharray="3 3" />
                                <Bar dataKey="low" name="Low Cost" stackId="a" fill={COST_COLORS.low} />
                                <Bar dataKey="medium" name="Medium Cost" stackId="a" fill={COST_COLORS.medium} />
                                <Bar dataKey="high" name="High Cost" stackId="a" fill={COST_COLORS.high} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-slate-500 text-[10px] italic mt-2 text-center">
                        Low-cost = effective yield at issuance (&lt;2%). T-bills use discount rate/yield at auction, not coupon.
                    </p>
                </div>

                {/* Impacts of Rising Yield Curve - Educational Section */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 space-y-6">
                    <h4 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Impacts of a Rising Yield Curve</h4>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="mt-1 bg-red-500/20 p-2 rounded-lg h-fit">
                                <ArrowUpRight className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h5 className="text-red-200 font-semibold text-sm">Interest Expense Shock</h5>
                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                    Refinancing <strong>${rolloverRiskTrillions}T</strong> of low-cost debt at current rates (~4.5%) significantly increases annual interest payments, consuming more of the federal budget.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="mt-1 bg-amber-500/20 p-2 rounded-lg h-fit">
                                <Percent className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h5 className="text-amber-200 font-semibold text-sm">Crowding Out Effect</h5>
                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                    Higher government borrowing costs compete with private sector investment, potentially slowing economic growth and cap-ex cycles.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="mt-1 bg-blue-500/20 p-2 rounded-lg h-fit">
                                <Activity className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h5 className="text-blue-200 font-semibold text-sm">Refinancing Wall</h5>
                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                    A high concentration of short-term debt (<strong>{((parseFloat(shortTermTrillions) / parseFloat(totalDebtTrillions)) * 100).toFixed(0)}%</strong> in &lt;1Y) exposes the Treasury to immediate interest rate volatility.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Chart: Historical Trend */}
            {historicalData.length > 1 && (
                <div className="p-6 md:p-8 border-t border-slate-700/50 bg-slate-800/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-cyan-400 rounded-full"></span>
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
