import React from 'react';
import { cn } from '@/lib/utils';
import { useChinaEnergyGrid } from '@/hooks/useChinaMacro';
import {
    AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Zap, Wind, Leaf } from 'lucide-react';

const ENERGY_COLORS = {
    coal: '#78716c',
    solar: '#facc15',
    wind: '#60a5fa',
    hydro: '#22d3ee',
    nuclear: '#a78bfa',
    other: '#f97316',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-950 border border-white/10 rounded-xl p-3 text-[0.65rem] shadow-xl">
            <p className="text-muted-foreground mb-2 font-black uppercase tracking-widest">{label || payload[0]?.name}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex justify-between gap-4">
                    <span style={{ color: p.color ?? '#fff' }}>{p.name}</span>
                    <span className="text-white font-black">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}%</span>
                </div>
            ))}
        </div>
    );
};

const CarbonScoreGauge: React.FC<{ intensity: number }> = ({ intensity }) => {
    // Lower is better. China: ~560. Global avg: ~473. Green: <400.
    const score = Math.max(0, Math.min(100, ((700 - intensity) / 400) * 100));
    const color = intensity < 450 ? '#34d399' : intensity < 560 ? '#fbbf24' : '#f87171';
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke={color} strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${score * 2.51} 251`}
                        className="transition-all duration-700"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white tabular-nums">{intensity}</span>
                    <span className="text-[0.45rem] text-muted-foreground/50 uppercase tracking-widest">gCO₂/kWh</span>
                </div>
            </div>
            <span className="text-[0.55rem] font-black uppercase tracking-widest" style={{ color }}>
                {intensity < 450 ? 'Clean' : intensity < 560 ? 'Moderate' : 'Heavy'}
            </span>
        </div>
    );
};

export const ChinaEnergyGridPanel: React.FC = () => {
    const { data: energyData, isLoading } = useChinaEnergyGrid();

    const latest = energyData?.[0];
    const historical = [...(energyData ?? [])].reverse(); // chronological

    // Pie dat for latest year
    const pieData = latest ? [
        { name: 'Coal', value: latest.coal_share_pct, color: ENERGY_COLORS.coal },
        { name: 'Solar', value: latest.solar_share_pct, color: ENERGY_COLORS.solar },
        { name: 'Wind', value: latest.wind_share_pct, color: ENERGY_COLORS.wind },
        { name: 'Hydro', value: latest.hydro_share_pct, color: ENERGY_COLORS.hydro },
        { name: 'Nuclear', value: latest.nuclear_share_pct, color: ENERGY_COLORS.nuclear },
    ] : [];

    // Carbon-adjusted Energy Security Score: higher renewables & lower intensity = higher score
    const energySecScore = latest
        ? Math.round(((latest.renewables_share_pct / 40) * 50) + ((700 - latest.carbon_intensity_gco2kwh) / 400 * 50))
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                    <Leaf className="text-green-400 w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-tight text-white uppercase">
                        Energy &amp; <span className="text-green-400">Transition Risk</span>
                    </h3>
                    <p className="text-muted-foreground text-xs mt-0.5">Grid carbon intensity · Coal share · Renewable growth · Energy security</p>
                </div>
            </div>

            {isLoading ? (
                <div className="h-48 rounded-2xl bg-white/[0.02] animate-pulse" />
            ) : (
                <>
                    {/* KPI Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Coal Share', value: latest?.coal_share_pct, unit: '%', color: 'text-stone-400', desc: `${latest?.year} data` },
                            { label: 'Renewables', value: latest?.renewables_share_pct, unit: '%', color: 'text-green-400', desc: 'Wind+Solar+Hydro' },
                            { label: 'Solar Share', value: latest?.solar_share_pct, unit: '%', color: 'text-yellow-400', desc: 'Growing fastest' },
                            { label: 'Wind Share', value: latest?.wind_share_pct, unit: '%', color: 'text-blue-400', desc: 'Installed capacity #1 global' },
                        ].map(({ label, value, unit, color, desc }) => (
                            <div key={label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                <p className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">{label}</p>
                                <p className="text-[0.5rem] text-muted-foreground/30 mb-2">{desc}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn('text-2xl font-black tabular-nums tracking-tighter', color)}>
                                        {value != null ? value.toFixed(1) : '--'}
                                    </span>
                                    <span className="text-[0.6rem] text-white/20 uppercase">{unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Carbon Gauge + Donut + Security Score */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Carbon Intensity Gauge */}
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-2">
                            <p className="text-[0.6rem] font-black text-white/50 uppercase tracking-widest">Grid Carbon Intensity</p>
                            {latest && <CarbonScoreGauge intensity={latest.carbon_intensity_gco2kwh} />}
                            <p className="text-[0.5rem] text-muted-foreground/30 text-center">
                                Global avg ≈ 473 gCO₂/kWh (2024)
                            </p>
                        </div>

                        {/* Generation Mix Donut */}
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                            <p className="text-[0.6rem] font-black text-white/50 uppercase tracking-widest mb-1">Generation Mix {latest?.year}</p>
                            <div className="flex items-center gap-4">
                                <PieChart width={110} height={110}>
                                    <Pie data={pieData} cx={55} cy={55} innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                                        {pieData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                                <div className="space-y-1.5 flex-1">
                                    {pieData.map(({ name, value, color }) => (
                                        <div key={name} className="flex justify-between items-center">
                                            <span className="flex items-center gap-1.5 text-[0.55rem] text-muted-foreground/60">
                                                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                                {name}
                                            </span>
                                            <span className="text-[0.55rem] font-black text-white/70">{value?.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Carbon-adjusted Energy Security Score */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/5 border border-green-500/20 flex flex-col items-center justify-center gap-3">
                            <Zap size={20} className="text-green-400" />
                            <p className="text-[0.6rem] font-black text-white/50 uppercase tracking-widest text-center">Carbon-Adj. Energy Security Score</p>
                            <p className="text-5xl font-black text-green-400 tabular-nums">{energySecScore ?? '--'}</p>
                            <p className="text-[0.55rem] text-muted-foreground/40 text-center">/ 100 · Rising = transition progress</p>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all"
                                    style={{ width: `${energySecScore ?? 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Historical Trend */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-[0.65rem] font-black text-white/60 uppercase tracking-widest mb-4">
                            Energy Transition Trajectory (2015–{latest?.year})
                        </p>
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={historical}>
                                <defs>
                                    <linearGradient id="coalGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#78716c" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#78716c" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="renewGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="coal_share_pct" stroke={ENERGY_COLORS.coal} strokeWidth={2} fill="url(#coalGrad)" name="Coal %" />
                                <Area type="monotone" dataKey="renewables_share_pct" stroke="#34d399" strokeWidth={2} fill="url(#renewGrad)" name="Renewables %" />
                                <Legend iconType="line" wrapperStyle={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Insight */}
                    <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                        <div className="flex items-start gap-3">
                            <Wind size={14} className="text-green-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[0.6rem] font-black text-green-400 uppercase tracking-widest mb-1">Transition Alpha Signal</p>
                                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                                    China is the world's largest renewable energy installer. Every 1% shift from coal to renewables reduces the carbon intensity by ~7 gCO₂/kWh. The trajectory indicates China will cross the global average threshold around 2028–2030 — a key milestone for ESG qualification of Chinese sovereign debt.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
