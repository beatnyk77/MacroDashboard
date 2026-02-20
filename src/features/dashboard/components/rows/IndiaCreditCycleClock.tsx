import React, { useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceArea, ReferenceLine, ZAxis, Cell
} from 'recharts';
import {
    TrendingUp, Activity, PieChart, Clock, ChevronRight,
    ArrowUpRight, ArrowDownRight, Compass
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
                className={`absolute top-0 left-0 w-full h-96 blur-[150px] -z-10 transition-colors duration-1000 opacity-20
                    ${phase === 'Expansion' ? 'bg-blue-500' :
                        phase === 'Downturn' ? 'bg-amber-500' :
                            phase === 'Repair' ? 'bg-red-500' : 'bg-emerald-500'}
                `}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Left Panel: Status & Metrics (4 columns on lg) */}
                <div className="lg:col-span-4 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative bg-white/[0.01]">
                    <div className="space-y-8">
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Live Signal</span>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">
                                Credit Cycle Clock
                            </h2>
                            <p className="text-slate-400 text-sm font-medium">
                                Tracking systemic liquidity and bank lending expansion in the Indian economy.
                            </p>
                        </div>

                        {/* Current Phase Indicator */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl blur-xl transition-all duration-500 group-hover:from-blue-500/20" />
                            <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Compass className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Current Phase</span>
                                    </div>
                                    <span className="text-slate-500 text-xs font-mono">{new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-xl shrink-0
                                        ${phase === 'Expansion' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                            phase === 'Downturn' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                phase === 'Repair' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}
                                    `}>
                                        <Clock className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white leading-none tracking-tight">{phase}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium leading-tight max-w-[180px]">
                                            {phase === 'Expansion' && "Credit is growing rapidly; structural liquidity is supportive."}
                                            {phase === 'Downturn' && "Credit growth peaks; CD ratios stretch systemic funding limits."}
                                            {phase === 'Repair' && "Banks focus on deposit mobilization; credit growth tempers."}
                                            {phase === 'Recovery' && "Liquidity rebuilding; early stages of new credit formation."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard
                                label="Bank Credit (YoY)"
                                value={`${credit_growth_yoy}%`}
                                icon={<TrendingUp className="w-4 h-4" />}
                                trend={isExpanding ? 'up' : 'down'}
                            />
                            <MetricCard
                                label="Deposit Growth"
                                value={`${deposit_growth_yoy}%`}
                                icon={<PieChart className="w-4 h-4" />}
                                trend="neutral"
                            />
                            <div className="col-span-2">
                                <MetricCard
                                    label="Credit-Deposit (CD) Ratio"
                                    value={`${cd_ratio}%`}
                                    icon={<Activity className="w-4 h-4" />}
                                    trend={cd_ratio > 78 ? 'down' : 'neutral'} // High CD is a warning
                                    highlight={cd_ratio > 78}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Source: RBI DBIE</span>
                            <button className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white font-bold transition-colors">
                                View Methodology <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Visualization (8 columns on lg) */}
                <div className="lg:col-span-8 p-6 md:p-10 relative bg-black/20">
                    {/* Quadrant Labels inside chart area */}
                    <div className="absolute inset-8 md:inset-12 pointer-events-none z-0 hidden md:block">
                        <div className="absolute top-4 left-4 text-emerald-500/20 font-black text-2xl uppercase tracking-widest pl-4">Recovery</div>
                        <div className="absolute top-4 right-4 text-blue-500/20 font-black text-2xl uppercase tracking-widest text-right pr-4">Expansion</div>
                        <div className="absolute bottom-12 right-4 text-amber-500/20 font-black text-2xl uppercase tracking-widest text-right pr-4">Downturn</div>
                        <div className="absolute bottom-12 left-4 text-red-500/20 font-black text-2xl uppercase tracking-widest pl-4">Repair</div>
                    </div>

                    <div className="h-[400px] md:h-[500px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

                                {/* Background Quadrant Colors */}
                                <ReferenceArea x1={70} x2={X_AXIS_MID} y1={Y_AXIS_MID} y2={18} fill="rgba(16, 185, 129, 0.02)" />
                                <ReferenceArea x1={X_AXIS_MID} x2={85} y1={Y_AXIS_MID} y2={18} fill="rgba(59, 130, 246, 0.02)" />
                                <ReferenceArea x1={X_AXIS_MID} x2={85} y1={10} y2={Y_AXIS_MID} fill="rgba(245, 158, 11, 0.02)" />
                                <ReferenceArea x1={70} x2={X_AXIS_MID} y1={10} y2={Y_AXIS_MID} fill="rgba(239, 68, 68, 0.02)" />

                                {/* Axes & Midlines */}
                                <XAxis
                                    type="number"
                                    dataKey="cd_ratio"
                                    name="CD Ratio"
                                    domain={[72, 82]}
                                    stroke="#475569"
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                    tickFormatter={(v) => `${v}%`}
                                >
                                    <Label value="Credit-Deposit (CD) Ratio → (Tighter Liquidity)" position="bottom" fill="#64748b" fontSize={11} fontWeight={700} offset={0} />
                                </XAxis>
                                <YAxis
                                    type="number"
                                    dataKey="credit_growth_yoy"
                                    name="Credit Growth"
                                    domain={[10, 18]}
                                    stroke="#475569"
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                    tickFormatter={(v) => `${v}%`}
                                >
                                    <Label value="Credit Growth YoY % →" angle={-90} position="insideLeft" fill="#64748b" fontSize={11} fontWeight={700} style={{ textAnchor: 'middle' }} />
                                </YAxis>
                                <ZAxis type="number" dataKey="size" range={[50, 400]} />

                                <ReferenceLine x={X_AXIS_MID} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                                <ReferenceLine y={Y_AXIS_MID} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />

                                <RechartsTooltip
                                    content={<CustomTooltip />}
                                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                                />

                                {/* Main Data Path */}
                                <Scatter data={chartData} line={{ stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '3 3' }} shape="circle">
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.isCurrent ? PHASE_COLORS[entry.phase as keyof typeof PHASE_COLORS] : '#334155'}
                                            fillOpacity={entry.isCurrent ? 1 : 0.6}
                                            stroke={entry.isCurrent ? '#ffffff' : 'none'}
                                            strokeWidth={entry.isCurrent ? 2 : 0}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Sub-components
import { Label } from 'recharts';

const MetricCard = ({ label, value, icon, trend, highlight = false }: { label: string, value: string, icon: React.ReactNode, trend: 'up' | 'down' | 'neutral', highlight?: boolean }) => (
    <div className={`bg-white/[0.02] border rounded-xl p-4 backdrop-blur-sm transition-all
        ${highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 hover:bg-white/[0.04]'}
    `}>
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
            <div className={`text-slate-500 ${highlight ? 'text-amber-400' : ''}`}>
                {icon}
            </div>
        </div>
        <div className="flex items-end gap-2">
            <span className={`text-2xl font-black ${highlight ? 'text-amber-400' : 'text-white'}`}>{value}</span>
            {trend !== 'neutral' && (
                <span className={`text-xs font-bold mb-1 flex items-center
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
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color: color }}>
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
