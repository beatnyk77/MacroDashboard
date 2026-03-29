import React, { useMemo } from 'react';
import {
    ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Shield, ArrowRightLeft, Activity, Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { useRBIFXDefense } from '@/hooks/useRBIFXDefense';

export const RBIFXDefenseMonitor: React.FC = () => {
    const { data: rawData, loading } = useRBIFXDefense();

    const chartData = useMemo(() => {
        if (!rawData) return [];
        return rawData.map(d => ({
            ...d,
            formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            // Create a derived metric for REER premium over NEER
            valuation_premium: Number(d.reer_40 || 0) - Number(d.neer_40 || 0)
        }));
    }, [rawData]);

    const latest = useMemo(() => chartData[chartData.length - 1], [chartData]);
    const previous = useMemo(() => chartData[chartData.length - 2], [chartData]);

    if (loading || !latest) {
        return <div className="h-96 w-full bg-[#0a0f1d] border border-white/5 rounded-3xl animate-pulse" />;
    }

    const reservesDelta = Number(latest.fx_reserves_bn || 0) - Number(previous?.fx_reserves_bn || latest.fx_reserves_bn || 0);
    const isAccumulating = reservesDelta > 0;

    // Logic for analyst insight based on recent data
    let analystInsight = "";
    if ((latest.forward_book_net_bn || 0) < 0 && isAccumulating) {
        analystInsight = "RBI is actively accumulating spot reserves while drawing down the net forward book to manage liquidity and absorb inflows without immediate spot market distortion.";
    } else if ((latest.valuation_premium || 0) > 5) {
        analystInsight = "Rupee remains significantly overvalued on a REER basis compared to NEER, putting pressure on export competitiveness and necessitating careful RBI intervention management.";
    } else {
        analystInsight = "RBI maintaining a balanced defense posture. Intervention focus shifting dynamically between spot accumulation and forward book management based on daily volatility.";
    }

    return (
        <section className="w-full bg-[#0a0f1d] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl font-sans relative">
            {/* Header Area */}
            <div className="p-8 pb-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em]">Live Signal</span>
                            <span className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] ml-2">Source: RBI DBIE</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            FX Defense & Currency War Monitor
                        </h2>
                    </div>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 border-b border-white/5">
                <MetricCard
                    title="Headline FX Reserves"
                    value={`$${(latest.fx_reserves_bn || 0).toFixed(1)}B`}
                    delta={`${reservesDelta > 0 ? '+' : ''}${reservesDelta.toFixed(1)}B`}
                    trend={reservesDelta > 0 ? 'up' : 'down'}
                    icon={<Shield className="w-5 h-5 text-emerald-400" />}
                    colorClass="text-emerald-400"
                />
                <MetricCard
                    title="Net Forward Book"
                    value={`$${(latest.forward_book_net_bn || 0).toFixed(1)}B`}
                    subtext={(latest.forward_book_net_bn || 0) < 0 ? "Net Short (Selling)" : "Net Long (Buying)"}
                    icon={<ArrowRightLeft className="w-5 h-5 text-cyan-400" />}
                    colorClass={(latest.forward_book_net_bn || 0) < 0 ? "text-rose-400" : "text-cyan-400"}
                />
                <MetricCard
                    title="REER Valuation Premium"
                    value={`${(latest.valuation_premium || 0).toFixed(1)} pts`}
                    subtext={`REER: ${(latest.reer_40 || 0).toFixed(1)} | NEER: ${(latest.neer_40 || 0).toFixed(1)}`}
                    icon={<Globe className="w-5 h-5 text-fuchsia-400" />}
                    colorClass="text-fuchsia-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
                {/* Main Charts Area */}
                <div className="lg:col-span-9 p-6 relative">
                    {/* Background glow behind charts */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="formattedDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                    minTickGap={20}
                                />

                                {/* Left Y-Axis for Reserves & Forward Book */}
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                    tickFormatter={(val) => `$${val}B`}
                                    domain={['auto', 'auto']}
                                />

                                {/* Right Y-Axis for REER/NEER */}
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                    domain={[90, 110]}
                                />

                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600, color: '#94a3b8' }} />

                                {/* FX Reserves Area */}
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="fx_reserves_bn"
                                    name="Spot FX Reserves"
                                    fill="url(#colorReserves)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={0.2}
                                />
                                <defs>
                                    <linearGradient id="colorReserves" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                {/* Net Forward Book Bars */}
                                <Bar
                                    yAxisId="left"
                                    dataKey="forward_book_net_bn"
                                    name="Net Forward Book"
                                    fill="#06b6d4" // Default positive color
                                    radius={[4, 4, 0, 0]}
                                    // Make negative bars red
                                    shape={(props: any) => {
                                        const { x, y, width, height, payload } = props;
                                        const fill = payload.forward_book_net_bn < 0 ? '#f43f5e' : '#06b6d4';
                                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} opacity={0.8} />;
                                    }}
                                />

                                {/* REER vs NEER Lines */}
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="reer_40"
                                    name="REER (40-Curr)"
                                    stroke="#d946ef"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="neer_40"
                                    name="NEER (40-Curr)"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right/Bottom Sidebar: Analyst Insights */}
                <div className="lg:col-span-3 bg-white/[0.02] border-t lg:border-t-0 lg:border-l border-white/5 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Analyst Insight</h3>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-fuchsia-500 rounded-full" />
                        <p className="pl-4 text-sm text-slate-300 leading-relaxed font-medium">
                            {analystInsight}
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Defense Stance</div>
                            <div className="text-white font-bold text-sm">
                                {reservesDelta > 0 && (latest.forward_book_net_bn || 0) < 0 ? "Asymmetric (Spot Buy, Forward Sell)" : "Symmetrical Accumulation"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Sub-components

const MetricCard = ({ title, value, delta, subtext, icon, colorClass, trend }: any) => (
    <div className="p-6 bg-transparent hover:bg-white/[0.01] transition-colors group">
        <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{title}</span>
            <div className="p-2 rounded-lg bg-white/[0.03] backdrop-blur-sm border border-white/5">
                {icon}
            </div>
        </div>
        <div className="flex items-end gap-3">
            <span className={`text-4xl font-black tracking-tighter leading-none ${colorClass}`}>{value}</span>
            {delta && (
                <span className={`flex items-center text-sm font-bold mb-1 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {delta}
                </span>
            )}
        </div>
        {subtext && (
            <div className="mt-2 text-xs font-medium text-slate-500">{subtext}</div>
        )}
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl z-50 min-w-[240px]">
                <div className="text-xs font-black text-white uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
                    {label}
                </div>
                <div className="space-y-3">
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-medium flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                                {entry.name}
                            </span>
                            <span className="text-white font-mono font-bold">
                                {entry.name.includes('REER') || entry.name.includes('NEER')
                                    ? (entry.value || 0).toFixed(1)
                                    : `$${(entry.value || 0).toFixed(1)}B`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};
