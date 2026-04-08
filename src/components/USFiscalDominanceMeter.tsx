import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    AlertTriangle,
    DollarSign,
    Activity,
    BarChart2,
    Percent
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface RatioHistoryPoint {
    date: string;
    ratio: number;
    interest: number;
    entitlements: number;
    receipts: number;
}

interface LatestValues {
    interest: number | null;
    entitlements: number | null;
    receipts: number | null;
    ratio: number | null;
    asOfDate: string;
}

export const USFiscalDominanceMeter: React.FC = () => {
    const [history, setHistory] = useState<RatioHistoryPoint[]>([]);
    const [latest, setLatest] = useState<LatestValues>({
        interest: null,
        entitlements: null,
        receipts: null,
        ratio: null,
        asOfDate: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFiscalDominanceData();
    }, []);

    const fetchFiscalDominanceData = async () => {
        try {
            setLoading(true);

            // Fetch 20 years of historical data (quarterly) for all three metrics
            const since = new Date();
            since.setFullYear(since.getFullYear() - 20);

            const { data: obsData, error } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', [
                    'US_FEDERAL_INTEREST',
                    'US_MAJOR_ENTITLEMENTS',
                    'US_TAX_RECEIPTS'
                ])
                .gte('as_of_date', since.toISOString().split('T')[0])
                .order('as_of_date', { ascending: false });

            if (error) throw error;

            if (obsData && obsData.length > 0) {
                // Group by date
                interface DateEntry {
                    interest?: number;
                    entitlements?: number;
                    receipts?: number;
                }
                const dateMap = new Map<string, DateEntry>();

                const metricToKey: Record<string, keyof DateEntry> = {
                    'US_FEDERAL_INTEREST': 'interest',
                    'US_MAJOR_ENTITLEMENTS': 'entitlements',
                    'US_TAX_RECEIPTS': 'receipts'
                };

                for (const row of obsData) {
                    if (!dateMap.has(row.as_of_date)) {
                        dateMap.set(row.as_of_date, {});
                    }
                    const entry = dateMap.get(row.as_of_date)!;
                    const key = metricToKey[row.metric_id];
                    if (key) {
                        entry[key] = Number(row.value);
                    }
                }

                // Build ratio history points
                const points: RatioHistoryPoint[] = [];

                for (const [date, values] of dateMap.entries()) {
                    const interest = values.interest ?? 0;
                    const entitlements = values.entitlements ?? 0;
                    const receipts = values.receipts ?? 0;

                    // Only include if we have both numerator and denominator
                    if (interest !== undefined && entitlements !== undefined && receipts !== undefined && receipts > 0) {
                        const combined = interest + entitlements;
                        const ratio = (combined / receipts) * 100; // as percentage

                        points.push({
                            date,
                            ratio,
                            interest,
                            entitlements,
                            receipts
                        });
                    }
                }

                // Sort ascending by date
                points.sort((a, b) => a.date.localeCompare(b.date));

                setHistory(points);

                // Latest point
                if (points.length > 0) {
                    const latestPoint = points[points.length - 1];
                    setLatest({
                        interest: latestPoint.interest,
                        entitlements: latestPoint.entitlements,
                        receipts: latestPoint.receipts,
                        ratio: latestPoint.ratio,
                        asOfDate: latestPoint.date
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching fiscal dominance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl">
                <div className="animate-pulse text-slate-400">Loading Fiscal Dominance data...</div>
            </div>
        );
    }

    const ratio = latest.ratio;
    const isAboveThreshold = ratio !== null && ratio >= 100;
    const formattedRatio = ratio !== null ? ratio.toFixed(1) : '--';
    const formattedInterest = latest.interest !== null ? `$${(latest.interest / 1000).toFixed(2)}T` : '--';
    const formattedEntitlements = latest.entitlements !== null ? `$${(latest.entitlements / 1000).toFixed(2)}T` : '--';
    const formattedReceipts = latest.receipts !== null ? `$${(latest.receipts / 1000).toFixed(2)}T` : '--';
    const asOfDate = latest.asOfDate
        ? new Date(latest.asOfDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    const chartData = history.map(h => ({
        date: new Date(h.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        ratio: Number(h.ratio.toFixed(2)),
        // Keep raw values for tooltip (in trillions)
        interest: h.interest,
        entitlements: h.entitlements,
        receipts: h.receipts
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const total = data.interest + data.entitlements;
            return (
                <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl z-50">
                    <p className="text-slate-300 font-semibold mb-2 border-b border-slate-700 pb-1">{data.date}</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-400 text-xs flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true"></div>
                                Interest Payments
                            </span>
                            <span className="text-white font-mono">${(data.interest / 1000).toFixed(2)}T</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-400 text-xs flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true"></div>
                                Major Entitlements
                            </span>
                            <span className="text-white font-mono">${(data.entitlements / 1000).toFixed(2)}T</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-300 text-xs font-semibold">Combined Numerator</span>
                            <span className="text-red-300 font-mono">${(total / 1000).toFixed(2)}T</span>
                        </div>
                        <div className="border-t border-slate-700 pt-1 mt-1 flex items-center justify-between gap-6">
                            <span className="text-slate-400 text-xs flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-500" aria-hidden="true"></div>
                                Tax Receipts
                            </span>
                            <span className="text-cyan-300 font-mono">${(data.receipts / 1000).toFixed(2)}T</span>
                        </div>
                        <div className="border-t border-slate-700 pt-2 mt-1 flex items-center justify-between gap-6">
                            <span className="text-white text-sm font-black uppercase">Fiscal Dominance Ratio</span>
                            <span className={`text-xl font-bold ${data.ratio >= 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {data.ratio.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <section className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-red-500/20">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-700/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <Activity className={`w-8 h-8 ${isAboveThreshold ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
                            US Fiscal Dominance Meter
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
                            (Interest Payments + Major Entitlements) / Tax Receipts • <span className="text-red-400 font-medium">Red Line = 100% Threshold</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>Updated: {asOfDate}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs italic">FRED API</span>
                    </div>
                </div>
            </div>

            {/* Key Callouts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 bg-slate-800/30">
                {/* Current Ratio Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`${isAboveThreshold ? 'bg-gradient-to-br from-red-500/10 to-red-600/5' : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'} border ${isAboveThreshold ? 'border-red-500/30' : 'border-emerald-500/30'} rounded-xl p-5`}
                >
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <Percent className={`w-6 h-6 ${isAboveThreshold ? 'text-red-400' : 'text-emerald-400'}`} />
                            <span className="text-slate-400 text-sm font-medium">Dominance Ratio</span>
                        </div>
                        {isAboveThreshold && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-400 uppercase tracking-tighter border border-red-500/30 animate-pulse">
                                Critical
                            </span>
                        )}
                    </div>
                    <p className={`text-3xl font-bold ${isAboveThreshold ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formattedRatio}%
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                        {isAboveThreshold
                            ? 'Interest + Entitlements exceed tax revenues — fiscal dominance condition active'
                            : 'Below 100% threshold — tax receipts still cover mandatory spending'}
                    </p>
                </motion.div>

                {/* Interest Payments */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 border border-red-500/20 rounded-xl p-5 hover:border-red-500/50 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-6 h-6 text-red-400" />
                        <span className="text-slate-400 text-sm font-medium">Interest Payments</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{formattedInterest}</p>
                    <p className="text-slate-500 text-xs mt-1">Quarterly (FRED: FYOINT)</p>
                </motion.div>

                {/* Major Entitlements */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-slate-800/50 border border-amber-500/20 rounded-xl p-5 hover:border-amber-500/50 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-6 h-6 text-amber-400" />
                        <span className="text-slate-400 text-sm font-medium">Major Entitlements</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{formattedEntitlements}</p>
                    <p className="text-slate-500 text-xs mt-1">SocSec + Medicare (FRED: W068)</p>
                </motion.div>

                {/* Tax Receipts */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-5 hover:border-cyan-500/50 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart2 className="w-6 h-6 text-cyan-400" />
                        <span className="text-slate-400 text-sm font-medium">Tax Receipts</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{formattedReceipts}</p>
                    <p className="text-slate-500 text-xs mt-1">FRED: W006RC1Q027SBEA</p>
                </motion.div>
            </div>

            {/* Main Chart */}
            <div className="p-6 md:p-8">
                <div className="h-[400px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `${value}%`}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            {/* 100% threshold line */}
                            <ReferenceLine
                                y={100}
                                stroke="#ef4444"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                                label={{
                                    value: '100% Threshold',
                                    position: 'right',
                                    fill: '#ef4444',
                                    fontSize: 11,
                                    fontWeight: 600
                                }}
                            />
                            {/* Dominance ratio line */}
                            <Line
                                type="monotone"
                                dataKey="ratio"
                                name="Fiscal Dominance Ratio"
                                stroke={isAboveThreshold ? '#ef4444' : '#22c55e'}
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, stroke: isAboveThreshold ? '#ef4444' : '#22c55e', fill: '#1e293b', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Institutional Interpretation */}
            <div className="p-6 md:p-8 bg-slate-800/20 border-t border-slate-700/30">
                <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-lg ${isAboveThreshold ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                        <AlertTriangle className={`w-5 h-5 ${isAboveThreshold ? 'text-red-400' : 'text-emerald-400'}`} />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-white mb-1">Institutional Interpretation</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {isAboveThreshold
                                ? `<strong>Fiscal dominance is active.</strong> Interest payments plus mandatory entitlements now consume more than 100% of federal tax receipts. This condition structurally limits fiscal space, increases market dependency on central bank financing, and raises the probability of inflationary debt management. The ratio above 100% signals that the Treasury must issue additional debt to fund operations, increasing rollover risk.`
                                : `<strong>Below fiscal dominance threshold.</strong> Tax receipts still exceed the combined cost of interest payments and major entitlements. This provides limited fiscal space but margin is shrinking — monitor quarterly trajectory closely. A breach of 100% indicates structural deficit dominance requiring central bank monetization or severe austerity to reverse.`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
