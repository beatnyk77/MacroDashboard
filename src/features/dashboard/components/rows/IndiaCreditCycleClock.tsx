import React, { useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceLine, ZAxis, Cell
} from 'recharts';
import {
    TrendingUp, Activity, PieChart, Clock,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useIndiaCreditCycle } from '@/hooks/useIndiaCreditCycle';

// Defining quadrant bounds for historical perspective
const Y_AXIS_MID = 14.5; // Credit Growth Midpoint
const X_AXIS_MID = 77.0; // CD Ratio Midpoint

const PHASE_COLORS = {
    'Recovery': '#10b981', // Emerald
    'Expansion': '#3b82f6', // Blue
    'Downturn': '#f59e0b', // Amber
    'Repair': '#ef4444' // Rose
};

export const IndiaCreditCycleClock: React.FC = () => {
    const { data: cycleData, loading } = useIndiaCreditCycle();

    const currentData = useMemo(() => cycleData[cycleData.length - 1], [cycleData]);

    const chartData = useMemo(() => {
        return cycleData.map((d, i) => ({
            ...d,
            // Size is larger for the most recent point
            size: i === cycleData.length - 1 ? 400 : 100,
            isCurrent: i === cycleData.length - 1
        }));
    }, [cycleData]);

    if (loading || !currentData) {
        return <div className="h-96 w-full bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />;
    }

    const { phase, credit_growth_yoy, deposit_growth_yoy, cd_ratio, date } = currentData;
    const isExpanding = phase === 'Expansion' || phase === 'Recovery';

    return (
        <section className="w-full bg-[#0a0f1d] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative font-sans">
            {/* Ambient Base Glow */}
            <div
                className={`absolute top - 0 left - 0 w - full h - 96 blur - [150px] - z - 10 transition - colors duration - 1000 opacity - 20
                    ${phase === 'Expansion' ? 'bg-blue-500' :
                        phase === 'Downturn' ? 'bg-amber-500' :
                            phase === 'Repair' ? 'bg-red-500' : 'bg-emerald-500'
                    }
`}
            />

            <div className="flex flex-col">
                {/* Header & Narrative Section */}
                <div className="p-10 md:p-16 border-b border-white/10 bg-white/[0.01]">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]">Live Macro Signal</span>
                                </div>
                                <h2 className="text-5xl font-black text-white tracking-tighter leading-tight uppercase">
                                    Credit Cycle <span className="text-blue-500">Clock</span>
                                </h2>
                                <p className="text-slate-400 text-lg font-medium max-w-2xl leading-relaxed">
                                    A proprietary telemetry gauge tracking the intersection of systemic liquidity (CD Ratio) and real-economy bank lending velocity.
                                </p>
                            </div>

                            <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-md min-w-[300px]">
                                <div className={`p - 4 rounded - xl shrink - 0 ${phase === 'Expansion' ? 'bg-blue-500/20 text-blue-400' : phase === 'Downturn' ? 'bg-amber-500/20 text-amber-400' : phase === 'Repair' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} `}>
                                    <Clock className="w-8 h-8" />
                                </div>
                                <div>
                                    <span className="text-slate-500 text-[0.6rem] font-black uppercase tracking-widest block mb-1">{new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Regime</span>
                                    <h3 className="text-3xl font-black text-white leading-none tracking-tighter uppercase">{phase}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10">
                            <p className="text-lg text-slate-300 font-medium leading-relaxed">
                                <span className="text-blue-400 font-black uppercase mr-3 tracking-widest text-xs tracking-widest">Clock Analysis:</span>
                                {phase === 'Expansion' && "Systemic credit is growing rapidly while CD ratios remain manageable. This is the optimal 'Goldilocks' phase for broad equity participation."}
                                {phase === 'Downturn' && "Credit growth has peaked and CD ratios are stretching systemic funding limits. Reserve Bank intervention or deposit mobilization is typically imminent."}
                                {phase === 'Repair' && "Banks are aggressively focusing on deposit growth to rebalance balance sheets. Credit formation is typically defensive during this phase."}
                                {phase === 'Recovery' && "Liquidity is rebuilding following a period of repair. Early stages of credit acceleration often provide the highest alpha in financial sectors."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid Section */}
                <div className="p-10 md:p-12 border-b border-white/10 bg-black/40">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <MetricCard
                                label="Systemic Credit (YoY)"
                                value={`${credit_growth_yoy}% `}
                                icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                                trend={isExpanding ? 'up' : 'down'}
                            />
                            <MetricCard
                                label="Deposit Mobilization"
                                value={`${deposit_growth_yoy}% `}
                                icon={<PieChart className="w-5 h-5 text-blue-400" />}
                                trend="neutral"
                            />
                            <MetricCard
                                label="CD Ratio (Liquidity Gauge)"
                                value={`${cd_ratio}% `}
                                icon={<Activity className="w-5 h-5 text-amber-400" />}
                                trend={cd_ratio > 78 ? 'down' : 'neutral'}
                                highlight={cd_ratio > 78}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Visualization Section (Full Width) */}
                <div className="p-10 md:p-20 relative bg-black/60 min-h-[600px]">
                    <div className="max-w-7xl mx-auto h-full flex flex-col items-center">
                        <div className="w-full text-center mb-16">
                            <h4 className="text-xs font-black text-white/20 uppercase tracking-[0.4em]">Credit Intensity vs. Systemic Liquidity</h4>
                        </div>

                        <div className="h-[500px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 20 }}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" vertical={false} />

                                    <XAxis
                                        type="number"
                                        dataKey="cd_ratio"
                                        name="CD Ratio"
                                        domain={[72, 82]}
                                        stroke="rgba(255,255,255,0.1)"
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}
                                        tickFormatter={(v) => `${v}% `}
                                        label={{ value: 'Credit-Deposit (CD) Ratio → (Tighter Liquidity)', position: 'bottom', fill: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 900, offset: 20 }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="credit_growth_yoy"
                                        name="Credit Growth"
                                        domain={[10, 18]}
                                        stroke="rgba(255,255,255,0.1)"
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}
                                        tickFormatter={(v) => `${v}% `}
                                        label={{ value: 'Credit Growth YoY % →', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 900 }}
                                    />
                                    <ZAxis type="number" dataKey="size" range={[80, 600]} />

                                    <ReferenceLine x={X_AXIS_MID} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                    <ReferenceLine y={Y_AXIS_MID} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />

                                    <RechartsTooltip
                                        content={<CustomTooltip />}
                                        cursor={{ strokeDasharray: '5 5', stroke: 'rgba(255,255,255,0.2)' }}
                                    />

                                    <Scatter data={chartData} line={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '5 5' }} shape="circle">
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell - ${index} `}
                                                fill={entry.isCurrent ? PHASE_COLORS[entry.phase as keyof typeof PHASE_COLORS] : '#1e293b'}
                                                fillOpacity={entry.isCurrent ? 1 : 0.4}
                                                stroke={entry.isCurrent ? '#ffffff' : 'rgba(255,255,255,0.1)'}
                                                strokeWidth={entry.isCurrent ? 3 : 1}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-20 flex items-center gap-8 justify-center">
                            {Object.entries(PHASE_COLORS).map(([name, color]) => (
                                <div key={name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="text-[0.65rem] font-black text-white/40 uppercase tracking-[0.2em]">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Sub-components

const MetricCard = ({ label, value, icon, trend, highlight = false }: { label: string, value: string, icon: React.ReactNode, trend: 'up' | 'down' | 'neutral', highlight?: boolean }) => (
    <div className={`bg - white / [0.02] border rounded - xl p - 4 backdrop - blur - sm transition - all
        ${highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 hover:bg-white/[0.04]'}
`}>
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
            <div className={`text - slate - 500 ${highlight ? 'text-amber-400' : ''} `}>
                {icon}
            </div>
        </div>
        <div className="flex items-end gap-2">
            <span className={`text - 2xl font - black ${highlight ? 'text-amber-400' : 'text-white'} `}>{value}</span>
            {trend !== 'neutral' && (
                <span className={`text - xs font - bold mb - 1 flex items - center
                    ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}
`}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </span>
            )}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const color = PHASE_COLORS[data.phase as keyof typeof PHASE_COLORS];

        return (
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl z-50 min-w-[200px]">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <span className="text-white font-bold">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color} 20`, color: color }}>
                        {data.phase}
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium">Credit Growth</span>
                        <span className="text-white font-mono font-bold">{data.credit_growth_yoy}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium">Dep. Growth</span>
                        <span className="text-white font-mono font-bold">{data.deposit_growth_yoy}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium">CD Ratio</span>
                        <span className="text-white font-mono font-bold">{data.cd_ratio}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
