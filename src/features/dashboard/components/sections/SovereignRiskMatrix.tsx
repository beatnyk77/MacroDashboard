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
import { useG20SovereignMatrix, G20Region } from '@/hooks/useG20SovereignMatrix';
import { cn } from '@/lib/utils';
import { ArrowDown, ShieldAlert, TrendingUp, Anchor, Activity, Info } from 'lucide-react';

const REGION_COLORS: Record<G20Region, string> = {
    'G7': '#3b82f6',     // Blue
    'BRICS': '#ef4444',  // Red
    'Other': '#94a3b8',  // Slate
};

const REGION_LABELS: Record<G20Region, string> = {
    'G7': 'G7 + EU',
    'BRICS': 'BRICS',
    'Other': 'Emerging / Other',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const regionColor = REGION_COLORS[data.region as G20Region] || '#94a3b8';
        return (
            <div className="bg-slate-950 border border-white/12 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[220px]">
                <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                    <span className="text-2xl">{data.flag}</span>
                    <div>
                        <span className="font-black text-white text-base uppercase tracking-heading block">{data.name}</span>
                        <span className="text-xs font-bold uppercase tracking-uppercase" style={{ color: regionColor }}>{data.region}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Debt/GDP</span>
                        <span className={cn("text-sm font-black font-mono", data.debtGdpPct > 100 ? "text-rose-400" : "text-white")}>{data.debtGdpPct.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">GDP Growth</span>
                        <span className={cn("text-sm font-black font-mono", data.gdpGrowthPct >= 2 ? "text-emerald-400" : data.gdpGrowthPct < 0 ? "text-rose-400" : "text-amber-400")}>
                            {data.gdpGrowthPct.toFixed(1)}%
                        </span>
                    </div>
                    {data.debtGoldRatio > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Debt/Gold</span>
                            <span className="text-sm font-black text-white font-mono">{data.debtGoldRatio.toFixed(1)}x</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Gold Reserves</span>
                        <span className="text-sm font-black text-amber-400 font-mono">{data.goldTonnes.toFixed(0)}t</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Z-Score (Debt)</span>
                            <span className={cn("text-xs font-black font-mono", data.zDebt > 1 ? "text-rose-400" : data.zDebt < -1 ? "text-emerald-400" : "text-white/70")}>{data.zDebt > 0 ? '+' : ''}{data.zDebt.toFixed(2)}σ</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-uppercase">Z-Score (Growth)</span>
                            <span className={cn("text-xs font-black font-mono", data.zGrowth > 1 ? "text-emerald-400" : data.zGrowth < -1 ? "text-rose-400" : "text-white/70")}>{data.zGrowth > 0 ? '+' : ''}{data.zGrowth.toFixed(2)}σ</span>
                        </div>
                    </div>
                    {!data.dataAvailable && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5">
                            <Info className="w-3 h-3 text-amber-400" />
                            <span className="text-xs font-bold text-amber-400/80 uppercase tracking-uppercase">Partial data</span>
                        </div>
                    )}
                    {data.isStale && (
                        <div className="mt-1 flex items-center gap-1.5">
                            <ShieldAlert className="w-3 h-3 text-rose-400 animate-pulse" />
                            <span className="text-xs font-black text-rose-400 uppercase tracking-uppercase">Data Delayed</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export const SovereignRiskMatrix = React.memo(() => {
    const { data, isLoading } = useG20SovereignMatrix();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const { chartData, xMedian, yMedian, availableCount, totalCount } = useMemo(() => {
        if (!data) return { chartData: [], xMedian: 0, yMedian: 0, availableCount: 0, totalCount: 0 };

        const filtered = data
            .filter(d => d.dataAvailable && d.debtGdpPct > 0)
            .map(d => ({
                ...d,
                x: d.debtGdpPct,
                y: d.gdpGrowthPct,
                z: Math.max(d.nominalGdpUsd / 1e9, 50), // Scale for bubble size (billions)
            }));

        const xValues = filtered.map(d => d.x).sort((a, b) => a - b);
        const yValues = filtered.map(d => d.y).sort((a, b) => a - b);
        const mid = Math.floor(filtered.length / 2);

        return {
            chartData: filtered,
            xMedian: xValues[mid] || 60,
            yMedian: yValues[mid] || 2,
            availableCount: filtered.length,
            totalCount: data.length,
        };
    }, [data]);

    if (isLoading || !data) return <div className="h-[200px] w-full animate-pulse bg-white/5 rounded-xl" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-heading flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-blue-500" />
                        Sovereign Risk Matrix
                    </h3>
                    <p className="text-xs font-black tracking-uppercase text-muted-foreground/50 uppercase mt-1">
                        G20 Fiscal Vulnerability (Debt/GDP) vs Vitality (Growth) — {availableCount}/{totalCount} countries
                    </p>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/12 rounded-xl transition-all"
                >
                    <span className="text-xs font-black uppercase tracking-uppercase text-white/80 group-hover:text-white">
                        {isExpanded ? 'Collapse View' : 'Deep Analysis'}
                    </span>
                    <Activity className="w-3 h-3 text-blue-400 group-hover:animate-pulse" />
                </button>
            </div>

            <div className={cn(
                "spa-card bg-[#0a0a0a] border-white/5 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative shadow-2xl",
                isExpanded ? "h-[650px] opacity-100 ring-1 ring-blue-500/20" : "h-[240px] opacity-90 hover:opacity-100"
            )}>
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-grid-slate-800/[0.04] bg-[size:20px_20px] pointer-events-none" />

                {!isExpanded && (
                    <div role="button" tabIndex={0} aria-label="Expand global risk landscape" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(true); } }} className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-transparent to-slate-950/90 cursor-pointer group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none" onClick={() => setIsExpanded(true)}>
                        <div className="text-center transform transition-all duration-500 group-hover:-translate-y-2">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                                <ArrowDown className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-xs font-black text-blue-300 uppercase tracking-uppercase bg-blue-950/50 px-3 py-1 rounded-full border border-blue-500/10">
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
                                    <Anchor className="w-3 h-3 text-emerald-400" />
                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-uppercase">Dynamic Anchors</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-500/60 uppercase tracking-uppercase block">Low Debt, High Growth</span>
                            </div>

                            <div className="absolute top-4 right-8 z-0 pointer-events-none text-right">
                                <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                                    <span className="text-xs font-black text-amber-400 uppercase tracking-uppercase">Growth at Risk</span>
                                    <TrendingUp className="w-3 h-3 text-amber-400" />
                                </div>
                                <span className="text-xs font-bold text-amber-500/60 uppercase tracking-uppercase block">High Debt, High Growth</span>
                            </div>

                            <div className="absolute bottom-16 right-8 z-0 pointer-events-none text-right">
                                <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                                    <span className="text-xs font-black text-rose-400 uppercase tracking-uppercase">Fiscal Trap</span>
                                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                                </div>
                                <span className="text-xs font-bold text-rose-500/60 uppercase tracking-uppercase block">High Debt, Low Growth</span>
                            </div>

                            <div className="absolute bottom-16 left-16 z-0 pointer-events-none">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Activity className="w-3 h-3 text-blue-400" />
                                    <span className="text-xs font-black text-blue-400 uppercase tracking-uppercase">Stagnant Stability</span>
                                </div>
                                <span className="text-xs font-bold text-blue-500/60 uppercase tracking-uppercase block">Low Debt, Low Growth</span>
                            </div>
                        </>
                    )}

                    {/* Region Legend - Always Visible */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-5">
                        {Object.entries(REGION_LABELS).map(([key, label]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[key as G20Region] }} />
                                <span className="text-xs font-black text-white/50 uppercase tracking-uppercase">{label}</span>
                            </div>
                        ))}
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 30, right: 30, bottom: isExpanded ? 40 : 30, left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} horizontal={false} />

                            <ReferenceLine x={xMedian} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                            <ReferenceLine y={yMedian} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />

                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Debt/GDP"
                                unit="%"
                                domain={[0, 'auto']}
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                label={{
                                    value: 'Government Debt / GDP (%)',
                                    position: 'insideBottom',
                                    offset: -20,
                                    fill: 'rgba(255,255,255,0.6)',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '0.1em'
                                }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Growth"
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
                                    fill: 'rgba(255,255,255,0.6)',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '0.1em'
                                }}
                            />
                            <ZAxis type="number" dataKey="z" range={[80, 2000]} />

                            <RechartsTooltip
                                content={CustomTooltip}
                                cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
                                animationDuration={200}
                            />

                            <Scatter data={chartData} animationBegin={0} animationDuration={1000}>
                                {chartData.map((entry, index) => {
                                    const color = REGION_COLORS[entry.region as G20Region] || '#94a3b8';
                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={color}
                                            fillOpacity={entry.dataAvailable ? 0.6 : 0.2}
                                            stroke={color}
                                            strokeWidth={2}
                                        />
                                    );
                                })}
                                <LabelList
                                    dataKey="code"
                                    position="top"
                                    offset={10}
                                    style={{ fill: '#ffffff', fontSize: '11px', fontWeight: '900', textShadow: '0 1px 3px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.5)' }}
                                />
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});
