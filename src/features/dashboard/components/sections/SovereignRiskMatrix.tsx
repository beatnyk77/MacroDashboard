import React, { useMemo } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
    LabelList,
    Tooltip as RechartsTooltip,
    ReferenceLine
} from 'recharts';
import { useMajorEconomies } from '@/hooks/useMajorEconomies';
import { cn } from '@/lib/utils';
import { ArrowDown, ShieldAlert, TrendingUp, Anchor, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-950 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
                <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                    <span className="text-2xl">{data.flag}</span>
                    <span className="font-black text-white text-lg uppercase tracking-tight">{data.name}</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Debt/Gold Risk</span>
                        <span className="text-sm font-black text-white font-mono">{data.x.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Real Growth</span>
                        <span className={cn("text-sm font-black font-mono", data.y >= 2 ? "text-emerald-400" : "text-rose-400")}>
                            {data.y.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Inflation (CPI)</span>
                        <span className={cn("text-sm font-black font-mono", data.cpi > 5 ? "text-amber-400" : "text-blue-400")}>
                            {data.cpi.toFixed(1)}%
                        </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Economy Size</span>
                        <span className="text-sm font-black text-white font-mono">${data.z.toFixed(1)}T</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export const SovereignRiskMatrix = React.memo(() => {
    const { data, isLoading } = useMajorEconomies();
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Process data and calculate medians for quadrants
    const { chartData, xMedian, yMedian } = useMemo(() => {
        if (!data) return { chartData: [], xMedian: 0, yMedian: 0 };

        const filtered = data
            .filter(d => d.debt_gold_ratio > 0 && d.growth !== 0)
            .map(d => ({
                name: d.name,
                code: d.code,
                x: d.debt_gold_ratio, // Risk
                y: d.growth,          // Vitality
                z: d.gdp_nominal,     // Size
                cpi: d.cpi,
                flag: d.flag
            }));

        // Calculate medians
        const xValues = filtered.map(d => d.x).sort((a, b) => a - b);
        const yValues = filtered.map(d => d.y).sort((a, b) => a - b);
        const mid = Math.floor(filtered.length / 2);

        return {
            chartData: filtered,
            xMedian: xValues[mid] || 1, // Default fallback
            yMedian: yValues[mid] || 2
        };
    }, [data]);

    if (isLoading || !data) return <div className="h-[200px] w-full animate-pulse bg-white/5 rounded-xl" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-blue-500" />
                        Sovereign Risk Matrix
                    </h3>
                    <p className="text-[0.65rem] font-black tracking-widest text-muted-foreground/50 uppercase mt-1">
                        Fiscal Vulnerability (Debt/Gold) vs Vitality (Growth)
                    </p>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                    <span className="text-[0.6rem] font-black uppercase tracking-widest text-white/80 group-hover:text-white">
                        {isExpanded ? 'Collapse View' : 'Deep Analysis'}
                    </span>
                    <Activity className="w-3 h-3 text-blue-400 group-hover:animate-pulse" />
                </button>
            </div>

            <div className={cn(
                "spa-card bg-[#0a0a0a] border-white/5 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative shadow-2xl",
                isExpanded ? "h-[600px] opacity-100 ring-1 ring-blue-500/20" : "h-[240px] opacity-90 hover:opacity-100"
            )}>
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-grid-slate-800/[0.04] bg-[size:20px_20px] pointer-events-none" />

                {!isExpanded && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-transparent to-slate-950/90 cursor-pointer group" onClick={() => setIsExpanded(true)}>
                        <div className="text-center transform transition-all duration-500 group-hover:-translate-y-2">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                                <ArrowDown className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-[0.65rem] font-black text-blue-300 uppercase tracking-[0.3em] bg-blue-950/50 px-3 py-1 rounded-full border border-blue-500/10">
                                Expand Global Risk Landscape
                            </span>
                        </div>
                    </div>
                )}

                <div className="h-full w-full p-4 relative z-10">
                    {/* Quadrant Labels (Only visible when expanded for clarity) */}
                    {isExpanded && (
                        <>
                            <div className="absolute top-4 left-16 z-0 pointer-events-none">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Anchor className="w-3 h-3 text-emerald-500/60" />
                                    <span className="text-[0.6rem] font-black text-emerald-500/60 uppercase tracking-widest">Dynamic Anchors</span>
                                </div>
                                <span className="text-[0.5rem] font-bold text-emerald-500/30 uppercase tracking-wider block">Low Risk, High Growth</span>
                            </div>

                            <div className="absolute top-4 right-8 z-0 pointer-events-none text-right">
                                <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                                    <span className="text-[0.6rem] font-black text-amber-500/60 uppercase tracking-widest">Growth at Risk</span>
                                    <TrendingUp className="w-3 h-3 text-amber-500/60" />
                                </div>
                                <span className="text-[0.5rem] font-bold text-amber-500/30 uppercase tracking-wider block">High Risk, High Growth</span>
                            </div>

                            <div className="absolute bottom-12 right-8 z-0 pointer-events-none text-right">
                                <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                                    <span className="text-[0.6rem] font-black text-rose-500/60 uppercase tracking-widest">Fiscal Trap</span>
                                    <ShieldAlert className="w-3 h-3 text-rose-500/60" />
                                </div>
                                <span className="text-[0.5rem] font-bold text-rose-500/30 uppercase tracking-wider block">High Risk, Low Growth</span>
                            </div>

                            <div className="absolute bottom-12 left-16 z-0 pointer-events-none">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Activity className="w-3 h-3 text-blue-500/60" />
                                    <span className="text-[0.6rem] font-black text-blue-500/60 uppercase tracking-widest">Stagnant Stability</span>
                                </div>
                                <span className="text-[0.5rem] font-bold text-blue-500/30 uppercase tracking-wider block">Low Risk, Low Growth</span>
                            </div>
                        </>
                    )}

                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} horizontal={false} />

                            {/* Quadrant Dividers */}
                            <ReferenceLine x={xMedian} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                            <ReferenceLine y={yMedian} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />

                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Risk"
                                unit="x"
                                domain={[0, 'auto']}
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                label={{
                                    value: 'Debt / Gold Ratio (Risk Proxy)',
                                    position: 'insideBottom',
                                    offset: -20,
                                    fill: 'rgba(255,255,255,0.3)',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '0.1em'
                                }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Vitality"
                                unit="%"
                                domain={['auto', 'auto']}
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                label={{
                                    value: 'Real GDP Growth %',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: 'rgba(255,255,255,0.3)',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '0.1em'
                                }}
                            />
                            <ZAxis type="number" dataKey="z" range={[100, 3000]} /> {/* Increased Z range for better visibility */}

                            <RechartsTooltip
                                content={<CustomTooltip />}
                                cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
                                animationDuration={200}
                            />

                            <Scatter data={chartData} animationBegin={0} animationDuration={1000}>
                                {chartData.map((entry, index) => {
                                    // Dynamic coloring based on quadrants relative to medians
                                    let color = '#3b82f6'; // Stagnant (Blue)
                                    if (entry.x > xMedian && entry.y < yMedian) color = '#f43f5e'; // Fiscal Trap (Rose)
                                    if (entry.x > xMedian && entry.y >= yMedian) color = '#f59e0b'; // Growth at Risk (Amber)
                                    if (entry.x <= xMedian && entry.y >= yMedian) color = '#10b981'; // Dynamic (Emerald)

                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={color}
                                            fillOpacity={0.6}
                                            stroke={color}
                                            strokeWidth={2}
                                        />
                                    );
                                })}
                                <LabelList
                                    dataKey="code"
                                    position="top"
                                    offset={10}
                                    style={{ fill: 'rgba(255,255,255,0.9)', fontSize: '10px', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                                />
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});
