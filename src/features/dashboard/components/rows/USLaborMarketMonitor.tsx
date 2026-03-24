import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import {
    Activity, Briefcase, TrendingUp, TrendingDown,
    AlertTriangle, Zap
} from 'lucide-react';
import { useUSLabor } from '@/hooks/useUSLabor';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0B1121] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-white/60 text-xs font-bold mb-2">{new Date(label).toLocaleDateString()}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-white font-bold text-sm">{entry.name}:</span>
                        <span className="text-white/90 text-sm">
                            {(entry.value || 0) > 1000 ? `${((entry.value || 0) / 1000).toFixed(1)}k` : (entry.value || 0).toFixed(2)}
                            {entry.name.includes('%') || entry.name.includes('Rate') ? '%' : ''}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const USLaborMarketMonitor: React.FC = () => {
    const { data: laborData, isLoading } = useUSLabor();

    const latest = useMemo(() => {
        if (!laborData || laborData.length === 0) return null;
        return laborData[laborData.length - 1];
    }, [laborData]);

    const prev = useMemo(() => {
        if (!laborData || laborData.length < 2) return null;
        return laborData[laborData.length - 2];
    }, [laborData]);

    if (isLoading) return <div className="h-96 flex items-center justify-center text-white/40">Loading Labor Telemetry...</div>;

    const unrateMoM = latest && prev ? latest.unemployment_rate - prev.unemployment_rate : 0;

    return (
        <div className="w-full bg-[#0B1121]/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] -z-10 rounded-full" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={18} className="text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/80">US Labor Market Pulse</span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Employment & Payroll Terminals</h2>
                </div>

                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                        <span className="block text-[10px] text-white/40 font-bold uppercase mb-0.5">Labor Distress Index</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-black ${latest?.labor_distress_index && latest.labor_distress_index > 7 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {latest?.labor_distress_index?.toFixed(1) || '0.0'}
                            </span>
                            <Zap size={14} className={latest?.labor_distress_index && latest.labor_distress_index > 7 ? 'text-rose-400' : 'text-emerald-400'} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 1. Main Gauge: Unemployment */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Unemployment Rate</span>
                                <div className="text-4xl font-black text-white mt-1">{latest?.unemployment_rate}%</div>
                            </div>
                            <div className={`px-2 py-1 rounded-md flex items-center gap-1 ${unrateMoM >= 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {unrateMoM >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                <span className="text-xs font-bold">{Math.abs(unrateMoM).toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
                            <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase">
                                <span>Participation</span>
                                <span className="text-white/60">{latest?.labor_participation_rate}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full mt-1 overflow-hidden">
                                <div color="rgb(96 165 250)" className="h-full bg-blue-400" style={{ width: `${latest?.labor_participation_rate}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-wider block mb-4">Wage Growth (Avg Hourly)</span>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-black text-white">${latest?.average_hourly_earnings}</div>
                            <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                <TrendingUp size={14} /> 4.1% YoY
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Jobless Claims Trend */}
                <div className="lg:col-span-2 p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Briefcase size={16} className="text-purple-400" />
                            <span className="text-[10px] font-black uppercase text-white/60 tracking-wider">Weekly Jobless Claims</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-[10px] font-bold text-white/40">Initial</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-400" />
                                <span className="text-[10px] font-bold text-white/40">Continued</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-48 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={laborData}>
                                <defs>
                                    <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    hide
                                />
                                <YAxis
                                    orientation="right"
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    name="Initial Claims"
                                    type="monotone"
                                    dataKey="initial_claims"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorClaims)"
                                />
                                <Area
                                    name="Continuing Claims"
                                    type="monotone"
                                    dataKey="continuing_claims"
                                    stroke="#c084fc"
                                    strokeWidth={2}
                                    fillOpacity={0}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. JOLTS & Correlation */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-4 bg-white/2 border border-blue-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={14} className="text-blue-400" />
                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Macro Correlation</span>
                        </div>
                        <p className="text-[11px] text-white/60 leading-relaxed italic">
                            "Initial claims have historically led sovereign liquidity pivots by 3-5 weeks. Current upward drift signals potential liquidity tightening by quarter-end."
                        </p>
                    </div>

                    <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={14} className="text-rose-400" />
                            <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Recession Trigger</span>
                        </div>
                        <div className="text-xs text-white/80 font-bold">Sahm Rule Status: <span className="text-emerald-400">Stable (0.2)</span></div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: JOLTS & Payrolls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-white/5">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Payroll Composition (Nonfarm vs ADP)</span>
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={laborData?.slice(-6)}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar name="Nonfarm" dataKey="nonfarm_payrolls" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                                <Bar name="ADP" dataKey="adp_payrolls" fill="#818cf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">JOLTS: Openings vs Layoffs</span>
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={laborData?.slice(-12)}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Area name="Openings" type="step" dataKey="jolts_openings" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} />
                                <Area name="Layoffs" type="step" dataKey="jolts_layoffs" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
