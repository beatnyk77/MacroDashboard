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

/**
 * US Fiscal Dominance Meter
 *
 * Formula: (Interest Payments + Social Security + Medicare Benefits) / Federal Tax Receipts × 100
 *
 * Data source: us_fiscal_stress table, populated by ingest-us-macro/fiscal.ts from FRED:
 *   • A091RC1Q027SBEA — Federal interest expense (quarterly, billions USD)
 *   • FGRECPT         — Federal tax receipts (quarterly, billions USD)
 *   • W068RC1Q027SBEA — SocSec + Medicare benefits (quarterly, billions USD)
 *
 * All raw FRED values are in billions USD. Display formatting divides by 1000 → Trillions.
 */

interface RatioHistoryPoint {
    date: string;
    ratio: number;
    interest: number;
    entitlements: number | null;
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

            const since = new Date();
            since.setFullYear(since.getFullYear() - 20);

            // Query us_fiscal_stress directly — this is where real FRED data lives
            const { data, error } = await supabase
                .from('us_fiscal_stress')
                .select('date, interest_expense, entitlements, total_receipts, fiscal_dominance_ratio, insolvency_ratio')
                .gte('date', since.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                const points: RatioHistoryPoint[] = data
                    .filter(row => row.interest_expense != null && row.total_receipts != null && row.total_receipts > 0)
                    .map(row => {
                        const interest = Number(row.interest_expense);
                        const receipts = Number(row.total_receipts);
                        const entitlements = row.entitlements != null ? Number(row.entitlements) : null;

                        // Prefer precomputed ratio, fall back to computing it here
                        let ratio: number;
                        if (row.fiscal_dominance_ratio != null) {
                            ratio = Number(row.fiscal_dominance_ratio);
                        } else if (entitlements != null) {
                            ratio = ((interest + entitlements) / receipts) * 100;
                        } else {
                            // Legacy: interest-only ratio (insolvency_ratio) until entitlements column populates
                            ratio = row.insolvency_ratio != null
                                ? Number(row.insolvency_ratio) * 100
                                : (interest / receipts) * 100;
                        }

                        return { date: row.date, ratio, interest, entitlements, receipts };
                    });

                setHistory(points);

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
        } catch (err) {
            console.error('Error fetching fiscal dominance data:', err);
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

    // All FRED values are billions USD → divide by 1000 to display as Trillions
    const formattedRatio = ratio !== null ? ratio.toFixed(1) : '--';
    const formattedInterest = latest.interest !== null ? `$${(latest.interest / 1000).toFixed(2)}T` : '--';
    const formattedEntitlements = latest.entitlements !== null ? `$${(latest.entitlements / 1000).toFixed(2)}T` : '—';
    const formattedReceipts = latest.receipts !== null ? `$${(latest.receipts / 1000).toFixed(2)}T` : '--';
    const asOfDate = latest.asOfDate
        ? new Date(latest.asOfDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    // Annualize quarterly values for display (×4); chart stays quarterly for accuracy
    const annualInterest = latest.interest !== null ? `$${((latest.interest * 4) / 1000).toFixed(2)}T/yr` : '--';

    const chartData = history.map(h => ({
        date: h.date,
        ratio: Number(h.ratio.toFixed(2)),
        interest: h.interest,
        entitlements: h.entitlements,
        receipts: h.receipts
    }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const numerator = d.entitlements != null ? d.interest + d.entitlements : d.interest;
            return (
                <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl z-50 min-w-[220px]">
                    <p className="text-slate-300 font-semibold mb-2 border-b border-slate-700 pb-1 text-xs">
                        {new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    </p>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                Interest Pmts (qtr)
                            </span>
                            <span className="text-white font-mono">${(d.interest / 1000).toFixed(3)}T</span>
                        </div>
                        {d.entitlements != null && (
                            <div className="flex items-center justify-between gap-6">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    SocSec + Medicare (qtr)
                                </span>
                                <span className="text-white font-mono">${(d.entitlements / 1000).toFixed(3)}T</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-300 font-semibold">Numerator Total</span>
                            <span className="text-red-300 font-mono">${(numerator / 1000).toFixed(3)}T</span>
                        </div>
                        <div className="border-t border-slate-700 pt-1 flex items-center justify-between gap-6">
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                Tax Receipts (qtr)
                            </span>
                            <span className="text-cyan-300 font-mono">${(d.receipts / 1000).toFixed(3)}T</span>
                        </div>
                        <div className="border-t border-slate-700 pt-2 flex items-center justify-between gap-6">
                            <span className="text-white font-black uppercase text-[10px] tracking-widest">Dominance Ratio</span>
                            <span className={`text-lg font-bold ${d.ratio >= 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {d.ratio.toFixed(1)}%
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
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <Activity className={`w-8 h-8 ${isAboveThreshold ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
                            US Fiscal Dominance Meter
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
                            (Interest Payments + SocSec + Medicare) / Tax Receipts •{' '}
                            <span className="text-red-400 font-medium">Red Line = 100% Threshold</span>
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                            &gt;100% = Fiscal dominance regime — mandatory spending exceeds tax revenue, requiring additional debt issuance
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-slate-400 text-sm shrink-0">
                        <span>As of: <span className="text-slate-300">{asOfDate || '—'}</span></span>
                        <span className="text-xs italic text-slate-500">FRED · Quarterly</span>
                        <span className="text-xs text-slate-600">A091RC1 · FGRECPT · W068RC1</span>
                    </div>
                </div>
            </div>

            {/* Key Callouts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 bg-slate-800/30">
                {/* Current Ratio */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`${isAboveThreshold
                        ? 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30'
                        : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30'
                    } border rounded-xl p-5`}
                >
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <Percent className={`w-5 h-5 ${isAboveThreshold ? 'text-red-400' : 'text-emerald-400'}`} />
                            <span className="text-slate-400 text-xs font-medium">Dominance Ratio</span>
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
                            ? 'Mandatory spending exceeds tax revenue — fiscal dominance active'
                            : 'Below 100% — tax receipts still cover mandatory spending'}
                    </p>
                </motion.div>

                {/* Interest Payments */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 border border-red-500/20 rounded-xl p-5 hover:border-red-500/50 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-red-400" />
                        <span className="text-slate-400 text-xs font-medium">Interest Payments</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formattedInterest}</p>
                    <p className="text-slate-500 text-xs mt-1">Quarterly · ≈{annualInterest}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">FRED: A091RC1Q027SBEA</p>
                </motion.div>

                {/* Major Entitlements */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-slate-800/50 border border-amber-500/20 rounded-xl p-5 hover:border-amber-500/50 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-amber-400" />
                        <span className="text-slate-400 text-xs font-medium">SocSec + Medicare</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formattedEntitlements}</p>
                    <p className="text-slate-500 text-xs mt-1">
                        {latest.entitlements == null ? 'Populates on next ingest' : 'Quarterly benefits'}
                    </p>
                    <p className="text-slate-600 text-[10px] mt-0.5">FRED: W068RC1Q027SBEA</p>
                </motion.div>

                {/* Tax Receipts */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-5 hover:border-cyan-500/50 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart2 className="w-5 h-5 text-cyan-400" />
                        <span className="text-slate-400 text-xs font-medium">Tax Receipts</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formattedReceipts}</p>
                    <p className="text-slate-500 text-xs mt-1">Quarterly receipts</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">FRED: FGRECPT</p>
                </motion.div>
            </div>

            {/* Main Chart */}
            <div className="p-6 md:p-8">
                {history.length === 0 ? (
                    <div className="h-[400px] w-full bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                        <div className="text-center text-slate-500">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-500/60" />
                            <p className="text-sm font-medium">No data available</p>
                            <p className="text-xs mt-1 text-slate-600">Run the ingest-us-macro edge function to populate data</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-[400px] w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 60, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { year: '2-digit', month: 'short' })}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(v) => `${v}%`}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                {/* 100% fiscal dominance threshold */}
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
                                        fontWeight: 700
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ratio"
                                    name="Fiscal Dominance Ratio"
                                    stroke={isAboveThreshold ? '#ef4444' : '#22c55e'}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5, stroke: isAboveThreshold ? '#ef4444' : '#22c55e', fill: '#1e293b', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
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
                                ? <><strong className="text-red-400">Fiscal dominance is active.</strong> Interest payments plus mandatory entitlements (SocSec + Medicare) now consume more than 100% of federal tax receipts. This structurally limits fiscal space, increases dependence on central bank financing, and raises the probability of inflationary debt management. The Treasury must issue additional debt to fund all operations — rollover risk is elevated.</>
                                : <><strong className="text-emerald-400">Below fiscal dominance threshold.</strong> Tax receipts still cover the combined cost of interest and major entitlements. Margin is shrinking — monitor quarterly trajectory. A breach of 100% indicates structural deficit dominance requiring central bank monetization or severe austerity to reverse.</>
                            }
                        </p>
                        {latest.entitlements == null && (
                            <p className="text-amber-500/70 text-xs mt-2 italic">
                                ⚠ Entitlements data pending first ingest — ratio currently reflects interest payments only. Trigger ingest-us-macro to activate full formula.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
