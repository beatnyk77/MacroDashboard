import React, { useMemo } from 'react';
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Activity, Wind, Anchor, Info, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useIndiaInflation } from '@/hooks/useIndiaInflation';

export const IndiaInflationPulseMonitor: React.FC = () => {
    const { data: rawData, loading } = useIndiaInflation();

    const chartData = useMemo(() => {
        if (!rawData) return [];
        return rawData.map(d => ({
            ...d,
            formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            // Corridor values for Area chart
            corridor_bottom: 2,
            corridor_top: 6,
            corridor_range: [2, 6]
        }));
    }, [rawData]);

    const latest = useMemo(() => chartData[chartData.length - 1], [chartData]);
    const previous = useMemo(() => chartData[chartData.length - 2], [chartData]);

    if (loading || !latest) {
        return <div className="h-[500px] w-full bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] animate-pulse" />;
    }

    const stickyDivergence = latest.cpi_sticky_yoy - latest.cpi_headline_yoy;
    const stickyTrend = latest.cpi_sticky_yoy > previous.cpi_sticky_yoy ? 'ACCELERATING' : 'COOLING';
    const flexibleVol = Math.abs(latest.cpi_flexible_yoy - previous.cpi_flexible_yoy);

    return (
        <section className="w-full bg-[#0a0f1d] rounded-[2.5rem] border border-white/12 overflow-hidden shadow-2xl font-sans relative group">
            {/* Header Area */}
            <div className="p-8 pb-6 border-b border-white/5 bg-white/[0.01]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-2 w-2 relative">
                                <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full ${stickyTrend === 'ACCELERATING' ? 'bg-fuchsia-400' : 'bg-emerald-400'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${stickyTrend === 'ACCELERATING' ? 'bg-fuchsia-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            <span className={`${stickyTrend === 'ACCELERATING' ? 'text-fuchsia-400' : 'text-emerald-400'} text-xs font-black uppercase tracking-[0.2em]`}>
                                Sticky Trend: {stickyTrend}
                            </span>
                            <span className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] ml-2 border-l border-white/12 pl-2">Alpha Signal: Structural Trend Monitor</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            India Inflation Pulse: Sticky vs Flexible
                        </h2>
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5 border-b border-white/5 bg-black/20">
                <MetricCard
                    title="Headline CPI"
                    value={`${latest.cpi_headline_yoy.toFixed(2)}%`}
                    subtext="YEAR-OVER-YEAR"
                    icon={<Activity className="w-5 h-5 text-white/50" />}
                    colorClass="text-white"
                />
                <MetricCard
                    title="Sticky Divergence"
                    value={`${(stickyDivergence > 0 ? '+' : '')}${stickyDivergence.toFixed(2)}%`}
                    subtext="VS HEADLINE"
                    icon={<Anchor className={`w-5 h-5 ${stickyDivergence > 0 ? 'text-fuchsia-400' : 'text-emerald-400'}`} />}
                    colorClass={stickyDivergence > 0 ? "text-fuchsia-400" : "text-emerald-400"}
                />
                <MetricCard
                    title="Flexible Volatility"
                    value={`${flexibleVol.toFixed(2)}%`}
                    subtext="MONTHLY SWING"
                    icon={<Wind className="w-5 h-5 text-cyan-400" />}
                    colorClass="text-cyan-400"
                />

                {/* Alpha Signal Panel */}
                <div className={`p-6 flex flex-col justify-center transition-all duration-500 ${stickyTrend === 'ACCELERATING' ? 'bg-fuchsia-500/10' : 'bg-emerald-500/5'}`}>
                    <div className="flex flex-col gap-2">
                        <div className={`flex items-center gap-2 ${stickyTrend === 'ACCELERATING' ? 'text-fuchsia-500' : 'text-emerald-500'}`}>
                            {stickyTrend === 'ACCELERATING' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            <span className="text-sm font-black uppercase tracking-widest">Structural Signal</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-tight">
                            {stickyTrend === 'ACCELERATING'
                                ? "Sticky inflation rising suggests structural demand pressure. RBI stance likely hawk."
                                : "Sticky inflation cooling confirms underlying disinflation trend. Room for easing."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="p-8 pb-12 relative">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-6">
                        <LegendItem color="#ffffff" label="Headline CPI" />
                        <LegendItem color="#d946ef" label="Sticky (Structural)" thick />
                        <LegendItem color="#06b6d4" label="Flexible (Volatile)" dashed />
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full capitalize">
                        <span className="text-xs font-black text-slate-500 tracking-wider">RBI Corridor: 2% - 6%</span>
                    </div>
                </div>

                <div className="h-[380px] w-full">
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
                                tickFormatter={(val) => `${val}%`}
                                domain={[0, 'auto']}
                            />
                            <RechartsTooltip content={<CustomTooltip />} />

                            {/* RBI Target Corridor */}
                            <Area
                                type="monotone"
                                dataKey="corridor_range"
                                stroke="none"
                                fill="rgba(255,255,255,0.02)"
                                baseValue={2}
                            />
                            <ReferenceLine y={4} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="3 3" label={{ value: 'RBI TARGET (4%)', position: 'insideRight', fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 900 }} />

                            {/* Lines */}
                            <Line
                                type="monotone"
                                dataKey="cpi_flexible_yoy"
                                name="Flexible CPI"
                                stroke="#06b6d4"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="cpi_headline_yoy"
                                name="Headline CPI"
                                stroke="rgba(255,255,255,0.4)"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="cpi_sticky_yoy"
                                name="Sticky CPI"
                                stroke="#d946ef"
                                strokeWidth={4}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#d946ef' }}
                                animationDuration={2000}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Analyst Insight Footer */}
            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/20">
                            <Info className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Macro Analyst Insight</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {stickyDivergence > 0
                            ? "Flexible inflation cooling on monsoon/fuel tailwinds, but the Sticky component remains lodge above headline levels. This signals structural demand-side heat in services and housing, likely forcing the RBI to maintain a 'Higher for Longer' stance despite optics of a falling headline rate."
                            : "Structural disinflation is finally taking hold as Sticky CPI converges toward the 4% target. This clears the runway for a neutral liquidity stance and potential pivot in the coming quarters, regardless of near-term flexible price shocks."}
                    </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 px-6 py-4 rounded-3xl bg-white/[0.02] border border-white/5 group-hover:border-fuchsia-500/20 transition-all duration-500">
                    <div className="flex flex-col gap-1 items-end">
                        <span className="text-xs font-black text-fuchsia-400 tracking-widest uppercase italic">The Divergence</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white">{(stickyDivergence * 100).toFixed(0)}</span>
                            <span className="text-xs font-black text-slate-500">BPS</span>
                        </div>
                    </div>
                    <div className="p-2 rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
                        <ArrowRight className="w-5 h-5" />
                    </div>
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

const LegendItem = ({ color, label, thick, dashed }: any) => (
    <div className="flex items-center gap-2">
        <div className={`h-1 rounded-full ${thick ? 'w-6 h-1.5' : 'w-4 h-1'}`} style={{ backgroundColor: color, borderBottom: dashed ? `2px dashed ${color}` : 'none' }} />
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/12 p-4 rounded-2xl shadow-2xl z-50 min-w-[200px]">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 italic">
                    {label}
                </div>
                <div className="space-y-2">
                    {payload.filter((p: any) => p.dataKey !== 'corridor_range').map((entry: any) => (
                        <div key={entry.name} className="flex justify-between items-center">
                            <span className="text-xs text-slate-300 font-bold flex items-center gap-2 uppercase tracking-tighter">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}
                            </span>
                            <span className="text-white font-mono font-black text-xs">
                                {entry.value.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};
