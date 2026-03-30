import React, { useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceLine, ZAxis, Cell
} from 'recharts';
import {
    TrendingUp, Activity, PieChart, Clock,
    ArrowUpRight, ArrowDownRight, Info
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
            size: i === cycleData.length - 1 ? 600 : 120, // Increased size for better contrast
            isCurrent: i === cycleData.length - 1
        }));
    }, [cycleData]);

    if (loading || !currentData) {
        return <div className="h-96 w-full bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />;
    }

    const { phase, credit_growth_yoy, deposit_growth_yoy, cd_ratio, date } = currentData;
    const isExpanding = phase === 'Expansion' || phase === 'Recovery';

    return (
        <section className="w-full bg-[#070b14] rounded-[2.5rem] border border-white/12 overflow-hidden shadow-2xl relative font-sans">
            {/* Background Glow */}
            <div
                className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] -z-10 opacity-10 transition-colors duration-1000
                    ${phase === 'Expansion' ? 'bg-blue-600' :
                        phase === 'Downturn' ? 'bg-amber-600' :
                            phase === 'Repair' ? 'bg-red-600' : 'bg-emerald-600'
                    }
                `}
            />

            <div className="flex flex-col">
                {/* Header Section */}
                <div className="px-8 pt-10 pb-6 md:px-12 md:pt-12">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-blue-400 text-xs font-black uppercase tracking-[0.3em]">Proprietary RBI Signal</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-1">
                            Credit Cycle <span className="text-blue-500">Clock</span>
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl">
                            Where we are in the RBI credit cycle based on lending growth vs systemic liquidity.
                        </p>
                    </div>
                </div>

                {/* Metrics Grid Section - 3 Card Row */}
                <div className="px-8 md:px-12 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <MetricCard
                            label="Systemic Credit (YoY)"
                            value={`${credit_growth_yoy}%`}
                            caption="Higher = Stronger real-economy lending"
                            icon={<TrendingUp className="w-5 h-5" />}
                            colorClass="text-emerald-400"
                            trend={isExpanding ? 'up' : 'down'}
                        />
                        <MetricCard
                            label="Deposit Mobilization"
                            value={`${deposit_growth_yoy}%`}
                            caption="Higher = Improving systemic funding"
                            icon={<PieChart className="w-5 h-5" />}
                            colorClass="text-blue-400"
                            trend="neutral"
                        />
                        <MetricCard
                            label="CD Ratio"
                            value={`${cd_ratio}%`}
                            caption="Higher = Tighter banking liquidity"
                            icon={<Activity className="w-5 h-5" />}
                            colorClass="text-amber-400"
                            trend={cd_ratio > 78 ? 'down' : 'neutral'}
                            highlight={cd_ratio > 78}
                        />
                    </div>
                </div>

                {/* Main Visualization & Narrative Container */}
                <div className="flex flex-col lg:flex-row p-8 md:p-12 gap-12 bg-black/20">
                    {/* Narrative / Context */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/12 backdrop-blur-md">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`p-3 rounded-2xl ${phase === 'Expansion' ? 'bg-blue-500/20 text-blue-400' : phase === 'Downturn' ? 'bg-amber-500/20 text-amber-400' : phase === 'Repair' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-slate-500 text-xs font-black uppercase tracking-widest block">{new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Regime</span>
                                    <h3 className="text-2xl font-black text-white leading-none tracking-tight uppercase">{phase}</h3>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                {phase === 'Expansion' && "Systemic credit is growing rapidly while CD ratios remain manageable. This is the optimal phase for broad equity participation."}
                                {phase === 'Downturn' && "Credit growth has peaked and CD ratios are stretching systemic funding limits. Reserve Bank intervention is typically expected."}
                                {phase === 'Repair' && "Banks are aggressively focusing on deposit growth to rebalance sheets. Credit formation is typically defensive during this phase."}
                                {phase === 'Recovery' && "Liquidity is rebuilding following a period of repair. Early stages of credit acceleration often provide high alpha opportunities."}
                            </p>
                        </div>

                        <div className="space-y-3 opacity-60">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-400 leading-tight">
                                    <span className="text-slate-200 font-bold">Note:</span> Quadrant boundaries are calibrated to 10-year RBI reporting averages (Mid: 14.5% Credit YoY, 77% CD Ratio).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Highly Crisp Quadrant Chart */}
                    <div className="w-full lg:w-2/3 h-[450px] md:h-[550px] relative bg-black/40 rounded-[2rem] border border-white/5 p-6 shadow-inner">
                        {/* High-Contrast Labels for Quadrants */}
                        <div className="absolute top-8 right-8 text-blue-500/40 font-black text-xs md:text-xs uppercase tracking-[0.2em] pointer-events-none">Expansion</div>
                        <div className="absolute top-8 left-8 text-emerald-500/40 font-black text-xs md:text-xs uppercase tracking-[0.2em] pointer-events-none">Recovery</div>
                        <div className="absolute bottom-8 right-8 text-amber-500/40 font-black text-xs md:text-xs uppercase tracking-[0.2em] pointer-events-none">Downturn</div>
                        <div className="absolute bottom-8 left-8 text-red-500/40 font-black text-xs md:text-xs uppercase tracking-[0.2em] pointer-events-none">Repair</div>

                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 10 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" vertical={false} />

                                <XAxis
                                    type="number"
                                    dataKey="cd_ratio"
                                    name="CD Ratio"
                                    domain={[72, 82]}
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 800 }}
                                    tickFormatter={(v) => `${v}%`}
                                    label={{ value: 'Credit-Deposit (CD) Ratio → (Systemic Liquidity)', position: 'bottom', fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900, offset: 20 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="credit_growth_yoy"
                                    name="Credit Growth"
                                    domain={[8, 18]}
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 800 }}
                                    tickFormatter={(v) => `${v}%`}
                                    label={{ value: 'Credit Growth YoY % →', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900, offset: 10 }}
                                />
                                <ZAxis type="number" dataKey="size" range={[120, 600]} />

                                <ReferenceLine x={X_AXIS_MID} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                                <ReferenceLine y={Y_AXIS_MID} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />

                                <RechartsTooltip
                                    content={<CustomTooltip />}
                                    cursor={{ strokeDasharray: '4 4', stroke: 'rgba(255,255,255,0.3)' }}
                                />

                                <Scatter
                                    data={chartData}
                                    line={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 2, strokeDasharray: '8 4' }}
                                    shape="circle"
                                    isAnimationActive={false}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.isCurrent ? PHASE_COLORS[entry.phase as keyof typeof PHASE_COLORS] : '#1e293b'}
                                            fillOpacity={entry.isCurrent ? 1 : 0.3}
                                            stroke={entry.isCurrent ? '#ffffff' : 'rgba(255,255,255,0.2)'}
                                            strokeWidth={entry.isCurrent ? 5 : 1}
                                            className={entry.isCurrent ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" : ""}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Legend Section */}
                <div className="bg-black/40 border-t border-white/5 py-6 px-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                    {Object.entries(PHASE_COLORS).map(([name, color]) => (
                        <div key={name} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,1)]" style={{ backgroundColor: color }} />
                            <span className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">{name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Sub-components

interface MetricCardProps {
    label: string;
    value: string;
    caption: string;
    icon: React.ReactNode;
    colorClass: string;
    trend: 'up' | 'down' | 'neutral';
    highlight?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, caption, icon, trend, colorClass, highlight = false }) => (
    <div className={`bg-white/[0.03] border border-white/12 rounded-2xl p-5 backdrop-blur-sm transition-all flex flex-col justify-between min-h-[140px]
        ${highlight ? 'ring-1 ring-amber-500/40 bg-amber-500/[0.03]' : 'hover:bg-white/[0.06] hover:border-white/20 hover:scale-[1.02]'}
    `}>
        <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-black uppercase tracking-widest">{label}</span>
            <div className={`${colorClass} opacity-80`}>
                {icon}
            </div>
        </div>
        <div className="space-y-1">
            <div className="flex items-end gap-2">
                <span className={`text-4xl font-black tracking-tighter text-white`}>{value}</span>
                {trend !== 'neutral' && (
                    <div className={`flex items-center h-8 mb-1 px-2 rounded-lg bg-black/40 text-xs font-black ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                        {trend === 'up' ? 'ACCEL' : 'DECEL'}
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-500 font-bold leading-tight italic">
                {caption}
            </p>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const color = PHASE_COLORS[data.phase as keyof typeof PHASE_COLORS];

        return (
            <div className="bg-slate-900 border border-white/20 p-5 rounded-2xl shadow-2xl z-50 min-w-[220px]">
                <div className="flex items-center justify-between mb-4 border-b border-white/12 pb-3">
                    <span className="text-white font-black uppercase text-xs tracking-tight">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} Report</span>
                    <span className="text-[9.5px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${color}40`, color: color }}>
                        {data.phase}
                    </span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Credit YoY</span>
                        <span className="text-white font-black text-sm">{data.credit_growth_yoy}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Dep. YoY</span>
                        <span className="text-white font-black text-sm">{data.deposit_growth_yoy}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-blue-400 text-xs font-black uppercase tracking-widest">CD Ratio</span>
                        <span className="text-white font-black text-base">{data.cd_ratio}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
