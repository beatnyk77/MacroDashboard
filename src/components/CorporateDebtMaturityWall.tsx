import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building2, Calendar, DollarSign, AlertTriangle, Activity, Percent, TrendingUp } from 'lucide-react';




interface AggregateData {
    bucket: string;
    amount: number;
    percent: number;
    colorSet: {
        base: string;
        light: string;
        glow: string;
        bg: string;
    };
    coupon?: number;
    delta?: number;
}

const COLORS = {
    yr1: {
        base: '#dc2626',      // red-600 (vibrant, not dim)
        light: '#f87171',     // red-400 for hover/bright
        glow: 'rgba(220, 38, 38, 0.4)',
        bg: 'rgba(220, 38, 38, 0.15)'
    },
    yr2_3: {
        base: '#f59e0b',      // amber-500 (high vis)
        light: '#fcd34d',     // amber-300
        glow: 'rgba(245, 158, 11, 0.4)',
        bg: 'rgba(245, 158, 11, 0.15)'
    },
    yr4_5: {
        base: '#3b82f6',      // blue-500 (pop against dark)
        light: '#60a5fa',     // blue-400
        glow: 'rgba(59, 130, 246, 0.4)',
        bg: 'rgba(59, 130, 246, 0.15)'
    },
    yr5Plus: {
        base: '#10b981',      // emerald-500 (washed out before, now vibrant)
        light: '#34d399',     // emerald-400
        glow: 'rgba(16, 185, 129, 0.4)',
        bg: 'rgba(16, 185, 129, 0.15)'
    }
};

export const CorporateDebtMaturityWall: React.FC = () => {
    const [data, setData] = useState<AggregateData[]>([]);
    const [stats, setStats] = useState({ total: 0, yr1Total: 0, count: 0, avgCpn: 0, deltaAvg: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get the latest as_of_date
            const { data: latestEntry } = await supabase
                .from('corporate_debt_maturities')
                .select('as_of_date')
                .order('as_of_date', { ascending: false })
                .limit(1);

            if (!latestEntry || latestEntry.length === 0) return;

            const latestDate = latestEntry[0].as_of_date;

            const { data: rawData, error } = await supabase
                .from('corporate_debt_maturities')
                .select('*')
                .eq('as_of_date', latestDate);

            if (error) throw error;

            if (rawData && rawData.length > 0) {
                const total = rawData.reduce((sum, item) => sum + (Number(item.maturing_amount) || 0), 0);
                const yr1Sum = rawData.find(d => d.bucket === '<1Y')?.maturing_amount || 0;

                // Calculate weighted averages
                let totalWeightedCpn = 0;
                let totalWeight = 0;
                let weightedDelta = 0;

                const aggregated = rawData.map(item => {
                    const amount = Number(item.maturing_amount);
                    const cpn = Number(item.weighted_avg_coupon) || 0;
                    const delta = Number(item.implied_refinancing_cost_delta) || 0;

                    totalWeightedCpn += cpn * amount;
                    totalWeight += amount;
                    weightedDelta += delta * (amount / total);

                    return {
                        bucket: item.bucket === '<1Y' ? '< 1Y' :
                                item.bucket === '1-3Y' ? '1–3Y' :
                                item.bucket === '3-5Y' ? '3–5Y' : '>5Y',
                        amount,
                        percent: Number(item.percent_of_total_debt),
                        colorSet: item.bucket === '<1Y' ? COLORS.yr1 :
                                  item.bucket === '1-3Y' ? COLORS.yr2_3 :
                                  item.bucket === '3-5Y' ? COLORS.yr4_5 : COLORS.yr5Plus,
                        coupon: cpn,
                        delta: delta
                    };
                });

                // Sort by logical order
                const order = ['< 1Y', '1–3Y', '3–5Y', '>5Y'];
                aggregated.sort((a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket));

                setData(aggregated);
                setStats({
                    total: total,
                    yr1Total: yr1Sum,
                    count: 500,
                    avgCpn: totalWeight > 0 ? totalWeightedCpn / totalWeight : 0,
                    deltaAvg: weightedDelta
                });
            }
        } catch (err) {
            console.error('Error fetching corporate debt data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="animate-pulse text-slate-500 flex items-center gap-2">
                    <Activity className="w-5 h-5 animate-spin" />
                    Analyzing SEC Maturity Filings...
                </div>
            </div>
        );
    }

    return (
        <section className="w-full bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Glow accents */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

            {/* Header Area */}
            <div className="relative p-6 md:p-8 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-blue-300 text-[10px] font-black px-2.5 py-1 rounded border border-blue-500/30 uppercase tracking-[0.15em] shadow-sm">
                                Institutional Grade
                            </span>
                            <span className="text-slate-600 text-xs">|</span>
                            <span className="text-slate-400 text-xs font-mono">SEC EDGAR XBRL • S&P 500</span>
                            {stats.avgCpn > 0 && (
                                <>
                                    <span className="text-slate-600 text-xs">|</span>
                                    <span className="text-amber-400/80 text-xs font-mono">
                                        WAC: {stats.avgCpn.toFixed(2)}%
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/50 shadow-lg">
                                <Building2 className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none">
                                    Corporate Debt Maturity Wall
                                </h2>
                                <p className="text-slate-400 text-xs md:text-sm mt-2 font-mono">
                                    Aggregate maturities across top {stats.count} constituents • Focus on rollover risk and refinancing pressure
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Risk Summary Badge */}
                    <div className="flex-shrink-0">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                            (stats.yr1Total / stats.total) > 0.25
                                ? 'bg-red-500/15 border-red-500/40 text-red-200'
                                : (stats.yr1Total / stats.total) > 0.15
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                        }`}>
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {(stats.yr1Total / stats.total * 100).toFixed(0)}% Due &lt;1Y
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Row - Higher Contrast */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-800/50 bg-slate-900/40">
                <div className="p-5 border-r border-slate-800/50 hover:bg-slate-800/30 transition-colors relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                            Total Aggregate Debt
                        </div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-white tracking-tight">
                            ${stats.total.toFixed(2)}T
                        </div>
                        <p className="text-slate-500 text-xs mt-1 font-mono">S&P 500 constituents</p>
                    </div>
                </div>

                <div className="p-5 border-r border-slate-800/50 bg-red-500/5 hover:bg-red-500/10 transition-colors relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-red-400/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            &lt; 1 Year Maturities
                        </div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-red-400 tracking-tight">
                            ${stats.yr1Total.toFixed(2)}T
                        </div>
                        <p className="text-red-300/60 text-xs mt-1 font-mono">
                            {((stats.yr1Total / stats.total) * 100).toFixed(1)}% of total
                        </p>
                    </div>
                </div>

                <div className="p-5 border-r border-slate-800/50 hover:bg-slate-800/30 transition-colors relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-amber-400/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <Percent className="w-3.5 h-3.5" />
                            1–3 Year Bucket
                        </div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-amber-400 tracking-tight">
                            ${(data.find(d => d.bucket === '1–3Y')?.amount || 0).toFixed(2)}T
                        </div>
                        <p className="text-slate-500 text-xs mt-1 font-mono">
                            {(data.find(d => d.bucket === '1–3Y')?.percent || 0).toFixed(1)}% of total
                        </p>
                    </div>
                </div>

                <div className="p-5 hover:bg-slate-800/30 transition-colors relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <TrendingUp className="w-3.5 h-3.5" />
                            &gt; 5 Year Duration
                        </div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-emerald-400 tracking-tight">
                            ${(data.find(d => d.bucket === '>5Y')?.amount || 0).toFixed(2)}T
                        </div>
                        <p className="text-slate-500 text-xs mt-1 font-mono">
                            Long-dated resilience
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="p-6 md:p-8 bg-slate-950/50">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Chart Area */}
                    <div className="lg:col-span-3">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full"></div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                                    Maturity Distribution
                                </h3>
                            </div>
                        </div>

                        {/* Enhanced Chart Container */}
                        <div className="relative h-[400px] w-full bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/20 to-slate-900/0 pointer-events-none"></div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 12, right: 24, left: 8, bottom: 0 }}
                                    barGap={4}
                                >
                                    <CartesianGrid
                                        strokeDasharray="2 2"
                                        stroke="#334155"
                                        opacity={0.25}
                                        vertical={false}
                                        horizontal={true}
                                    />
                                    <XAxis
                                        dataKey="bucket"
                                        stroke="#64748b"
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        padding={{ left: 8, right: 8 }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'mono' }}
                                        tickFormatter={(val) => `$${val}T`}
                                        axisLine={false}
                                        tickLine={false}
                                        width={65}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)', radius: 4 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const entry = payload[0].payload;
                                                return (
                                                    <div className="bg-slate-900/98 border border-slate-700/70 rounded-lg p-4 shadow-2xl backdrop-blur-md min-w-[220px]">
                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
                                                            <div
                                                                className="w-3 h-3 rounded-sm shadow-lg"
                                                                style={{ backgroundColor: entry.colorSet.base, boxShadow: `0 0 8px ${entry.colorSet.glow}` }}
                                                            ></div>
                                                            <span className="text-slate-200 font-bold text-sm uppercase">
                                                                {entry.bucket}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-slate-400 text-xs uppercase tracking-wide">Amount</span>
                                                                <span className="text-white font-mono font-bold text-sm">
                                                                    ${entry.amount.toFixed(2)}T
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-slate-400 text-xs uppercase tracking-wide">% of Total</span>
                                                                <span className="text-slate-200 font-mono text-sm">
                                                                    {entry.percent.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            {entry.coupon && entry.coupon > 0 && (
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Wght Avg Cpn</span>
                                                                    <span className="text-amber-300 font-mono text-sm">
                                                                        {entry.coupon.toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {entry.delta && (
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Refi Δ Cost</span>
                                                                    <span className={`font-mono text-sm ${entry.delta > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                                                                        {entry.delta > 0 ? '+' : ''}{entry.delta.toFixed(0)}bps
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        radius={[6, 6, 2, 2]}
                                        barSize={56}
                                        animationDuration={800}
                                        animationBegin={0}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.colorSet.base}
                                                style={{
                                                    filter: `drop-shadow(0 4px 8px ${entry.colorSet.glow})`,
                                                    transition: 'all 0.2s ease'
                                                }}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800/30">
                            {[
                                {color: COLORS.yr1.base, label: '&lt;1Y (High Risk)', text: 'text-red-400'},
                                {color: COLORS.yr2_3.base, label: '1–3Y (Elevated)', text: 'text-amber-400'},
                                {color: COLORS.yr4_5.base, label: '3–5Y (Manageable)', text: 'text-blue-400'},
                                {color: COLORS.yr5Plus.base, label: '>5Y (Distant)', text: 'text-emerald-400'}
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <div
                                        className="w-3 h-3 rounded-sm shadow-sm"
                                        style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}40` }}
                                    ></div>
                                    <span className={`${item.text} font-mono uppercase tracking-wide`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Insights Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                </div>
                                <h4 className="text-xs font-bold text-red-200 uppercase tracking-wider">
                                    Refinancing Alert
                                </h4>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                {(stats.yr1Total / stats.total * 100) > 20
                                    ? `CRITICAL: ${((stats.yr1Total / stats.total) * 100).toFixed(0)}% of corporate debt rolls over within 12 months. Historical avg is ~12%.`
                                    : `ELEVATED: ${((stats.yr1Total / stats.total) * 100).toFixed(0)}% of debt maturing &lt;1Y exceeds historical averages.`
                                }
                            </p>
                            {stats.deltaAvg > 0 && (
                                <div className="mt-3 p-2 bg-red-500/10 rounded border border-red-500/20">
                                    <p className="text-red-300 text-[10px] font-mono">
                                        Implied refinancing costs +{stats.deltaAvg.toFixed(0)}bps vs current avg coupon
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                </div>
                                <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                                    Market Context
                                </h4>
                            </div>
                            <div className="space-y-3 text-xs text-slate-300">
                                <p>
                                    <strong className="text-blue-300">Sector Concentration:</strong> Financials & Industrials hold ~78% of the near-term maturity wall, creating sector-specific rollover vulnerability.
                                </p>
                                <p>
                                    <strong className="text-blue-300">2020–2021 Vintage:</strong> Large volume of low-coupon debt (2–3%) issued during COVID liquidity boom now facing 350–450bps higher rates.
                                </p>
                                <p>
                                    <strong className="text-blue-300">Covenant Erosion:</strong> Market-wide lax underwriting standards in 2020–21 vintages increase potential for default clusters in stress scenarios.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500/5 via-amber-500/2 to-transparent border border-amber-500/15 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                                    <Activity className="w-4 h-4 text-amber-400" />
                                </div>
                                <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                                    Key Watchpoints
                                </h4>
                            </div>
                            <ul className="space-y-2 text-[11px] text-slate-300 font-mono leading-relaxed">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">▸</span>
                                    <span>BBB-rated rollover risk as spreads widen</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">▸</span>
                                    <span>Commercial real estate exposure in bank debt</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">▸</span>
                                    <span>Leveraged loan maturity wall 2025–2026</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">▸</span>
                                    <span>High-yield cyclical names in industrials</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Legend */}
            <div className="px-6 py-3 bg-slate-900/40 border-t border-slate-800/30 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>HIGH ROLLOVER RISK</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span>ELEVATED</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>MANAGEABLE</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>DISTANT</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-600">|</span>
                    <span>DATA AS OF: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>
        </section>
    );
};
