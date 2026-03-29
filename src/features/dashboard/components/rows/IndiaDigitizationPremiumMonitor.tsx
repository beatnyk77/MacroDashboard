import React, { useMemo } from 'react';
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Bar
} from 'recharts';
import { Globe, Zap, BarChart3, ShieldCheck, Info, ArrowRight } from 'lucide-react';
import { useIndiaDigitization } from '@/hooks/useIndiaDigitization';

export const IndiaDigitizationPremiumMonitor: React.FC = () => {
    const { data: rawData, loading } = useIndiaDigitization();

    const chartData = useMemo(() => {
        if (!rawData) return [];
        return rawData.map(d => ({
            ...d,
            formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            // Calculate Premium Spread
            premium_spread: Number(d.rbi_dpi_index || 0) - Number(d.g20_digital_baseline || 0)
        }));
    }, [rawData]);

    const latest = useMemo(() => chartData[chartData.length - 1], [chartData]);
    const previous = useMemo(() => chartData[chartData.length - 2], [chartData]);

    if (loading || !latest) {
        return <div className="h-[600px] w-full bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] animate-pulse" />;
    }

    const upiVolGrowth = previous?.upi_volume_bn
        ? ((Number(latest.upi_volume_bn || 0) - Number(previous.upi_volume_bn || 0)) / Number(previous.upi_volume_bn || 1)) * 100
        : 0;
    const formalizationPremium = latest.g20_digital_baseline
        ? ((Number(latest.rbi_dpi_index || 0) - Number(latest.g20_digital_baseline || 0)) / Number(latest.g20_digital_baseline || 1)) * 100
        : 0;

    return (
        <section className="w-full bg-[#0a0f1d] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl font-sans relative group">
            {/* Header Area */}
            <div className="p-8 pb-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em]">Alpha Signal: Formal Economy Scaling</span>
                            <span className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] ml-2 border-l border-white/10 pl-2">Source: RBI / NPCI / IMF</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            India Digitization & Formalization Premium
                        </h2>
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5 border-b border-white/5 bg-black/20">
                <MetricCard
                    title="Latest UPI Vol"
                    value={`${(latest.upi_volume_bn || 0).toFixed(1)}B`}
                    subtext={`${upiVolGrowth.toFixed(1)}% MoM SURGE`}
                    icon={<Zap className="w-5 h-5 text-cyan-400" />}
                    colorClass="text-cyan-400"
                />
                <MetricCard
                    title="DPI Index Score"
                    value={(latest.rbi_dpi_index || 0).toFixed(1)}
                    subtext="BASE 2018 = 100"
                    icon={<BarChart3 className="w-5 h-5 text-emerald-400" />}
                    colorClass="text-emerald-400"
                />
                <MetricCard
                    title="Formalization Premium"
                    value={`${formalizationPremium.toFixed(1)}%`}
                    subtext="VS G20 BASELINE"
                    icon={<Globe className="w-5 h-5 text-blue-400" />}
                    colorClass="text-blue-400"
                />

                {/* Alpha Signal Panel */}
                <div className="p-6 flex flex-col justify-center bg-emerald-500/5 transition-all duration-500 group-hover:bg-emerald-500/10">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-sm font-black uppercase tracking-widest text-emerald-400">Premium Active</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-tight">
                            India's DPI infrastructure is driving structural nominal GDP efficiency vs EM peers. Significant FDI narrative de-risking sovereign bonds.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                {/* Left: The Parabolic Surge */}
                <div className="p-8 relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                The Parabolic Surge <ArrowRight className="w-4 h-4 text-slate-600" />
                            </h3>
                            <p className="text-xs text-slate-500 font-bold">UPI Volume (Bn) & Value (₹ Trillion)</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUpi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="formattedDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                    tickFormatter={(val) => `₹${val}T`}
                                />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="upi_volume_bn"
                                    name="Volume (Bn)"
                                    stroke="#06b6d4"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorUpi)"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="upi_value_inr_trillion"
                                    name="Value (₹T)"
                                    stroke="#2b5bee"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#2b5bee' }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Volume</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Value</span>
                        </div>
                    </div>
                </div>

                {/* Right: The Digitization Premium */}
                <div className="p-8 relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                The Digitization Premium <ArrowRight className="w-4 h-4 text-slate-600" />
                            </h3>
                            <p className="text-xs text-slate-500 font-bold">RBI DPI Index vs. G20 EM Baseline</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="formattedDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                    domain={['auto', 'auto']}
                                />
                                <RechartsTooltip content={<CustomTooltip />} />

                                <Line
                                    type="monotone"
                                    dataKey="g20_digital_baseline"
                                    name="G20 Baseline"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rbi_dpi_index"
                                    name="India DPI"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                    animationDuration={2500}
                                />
                                <Bar
                                    dataKey="premium_spread"
                                    name="Premium Spread"
                                    fill="rgba(16, 185, 129, 0.05)"
                                    opacity={0.5}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">India DPI Index</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-0.5 border-b border-dashed border-white/40" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">G20 Baseline</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analyst Insight Footer */}
            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                            <Info className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest text-emerald-400">Structural Efficiency Narrative</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        India's digitization is no longer just about payments; it's a formalization engine. Unified Payments Interface (UPI) scale is driving tax buoyancy (GST) and credit democratization for MSMEs. This provides a structural efficiency premium over EM peers, justifying premium equity multiples and supporting sovereign debt stability.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Formalization Alpha Score</div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-6 rounded-full transition-all duration-1000 ${i <= 6
                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    : 'bg-white/5'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">Tier 1 Performance</span>
                </div>
            </div>
        </section>
    );
};

const MetricCard = ({ title, value, subtext, icon, colorClass }: any) => (
    <div className="p-6 bg-transparent hover:bg-white/[0.01] transition-colors group">
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors tracking-[0.2em]">{title}</span>
            <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                {icon}
            </div>
        </div>
        <div className="flex items-end gap-2">
            <span className={`text-3xl font-black tracking-tighter leading-none ${colorClass}`}>{value}</span>
        </div>
        {subtext && (
            <div className="mt-2 text-xs font-black tracking-widest uppercase text-slate-600 italic tracking-[0.15em]">{subtext}</div>
        )}
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-50 min-w-[200px]">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                    {label}
                </div>
                <div className="space-y-2">
                    {payload.filter((p: any) => p.dataKey !== 'premium_spread').map((entry: any) => (
                        <div key={entry.name} className="flex justify-between items-center">
                            <span className="text-xs text-slate-300 font-bold flex items-center gap-2 uppercase tracking-tighter">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}
                            </span>
                            <span className="text-white font-mono font-black text-xs">
                                {entry.name.includes('Value') ? `₹${(entry.value || 0).toFixed(2)}T` : entry.name.includes('%') ? `${(entry.value || 0).toFixed(2)}%` : (entry.value || 0).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};
