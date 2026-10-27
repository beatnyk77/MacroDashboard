import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine, LabelList, Cell } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';
import { AlertCircle, ShieldCheck, Zap, Info, LayoutGrid } from 'lucide-react';
import { useStateFiscalHealth } from '@/hooks/useStateFiscalHealth';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const StateFiscalHeatmap: React.FC = () => {
    const { data, loading } = useStateFiscalHealth();

    const chartData = useMemo(() => {
        return data.map(item => ({
            ...item,
            x: item.gfd_to_gsdp,
            y: item.debt_to_gsdp,
            name: item.state_code || item.state_name.substring(0, 2).toUpperCase()
        }));
    }, [data]);

    const getQuadrant = (x: number, y: number) => {
        if (x <= 3.5 && y <= 30) return 'fortress';
        if (x > 3.5 && y > 30) return 'trap';
        if (x <= 3.5 && y > 30) return 'debt-driven';
        return 'growth-driven';
    };

    const getColor = (x: number, y: number) => {
        const quadrant = getQuadrant(x, y);
        switch (quadrant) {
            case 'fortress': return CHART_COLORS.expansion; // Emerald
            case 'trap': return CHART_COLORS.east; // Rose
            case 'debt-driven': return CHART_COLORS.gold; // Amber
            case 'growth-driven': return CHART_COLORS.west; // Blue
            default: return CHART_COLORS.tick;
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] w-full bg-white/[0.02] border border-border animate-pulse rounded-xl flex items-center justify-center">
                <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">Mapping Fiscal Matrix...</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Scatter Matrix */}
            <div className="lg:col-span-2 p-8 rounded-xl bg-white/[0.02] border border-border relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <LayoutGrid size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider italic">State Fiscal Health Matrix</h3>
                            <p className="text-xs text-muted-foreground font-medium">Outstanding Debt vs. Fiscal Deficit (% GSDP)</p>
                        </div>
                    </div>
                </div>

                <div className="h-[450px] w-full relative">
                    {/* Quadrant Labels Overlay */}
                    <div className="absolute top-4 left-16 text-xs font-semibold text-white/20 uppercase tracking-wider">Debt-Driven</div>
                    <div className="absolute top-4 right-4 text-xs font-semibold text-rose-500/30 uppercase tracking-wider">Fiscal Trap (Stress)</div>
                    <div className="absolute bottom-12 left-16 text-xs font-semibold text-emerald-500/30 uppercase tracking-wider">Fiscal Fortress</div>
                    <div className="absolute bottom-12 right-4 text-xs font-semibold text-white/20 uppercase tracking-wider">Growth-Driven</div>

                    <MacroChartContainer height="fill">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                            <XAxis
                                {...DEFAULT_XAXIS_PROPS}
                                type="number"
                                dataKey="x"
                                name="GFD %"
                                domain={[0, 10]}
                                unit="%"
                                axisLine={false}
                                label={{ value: 'Gross Fiscal Deficit (%)', position: 'bottom', offset: 20, fill: CHART_COLORS.slate, fontSize: 11, fontWeight: 700 }}
                            />
                            <YAxis
                                {...DEFAULT_YAXIS_PROPS}
                                width={60}
                                type="number"
                                dataKey="y"
                                name="Debt %"
                                domain={[0, 50]}
                                unit="%"
                                axisLine={false}
                                label={{ value: 'Outstanding Debt (%)', angle: -90, position: 'left', fill: CHART_COLORS.slate, fontSize: 11, fontWeight: 700 }}
                            />
                            <ZAxis type="number" range={[400, 400]} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: WHITE_ALPHA.line }} />

                            <ReferenceLine x={3.5} stroke={alpha(CHART_COLORS.east, 0.4)} strokeDasharray="5 5" strokeWidth={2} />
                            <ReferenceLine y={30} stroke={alpha(CHART_COLORS.east, 0.4)} strokeDasharray="5 5" strokeWidth={2} />

                            <Scatter name="States" data={chartData}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColor(entry.x, entry.y)} />
                                ))}
                                <LabelList dataKey="name" position="top" style={{ fill: '#fff', fontSize: 11, fontWeight: 700, opacity: 0.8 }} offset={10} />
                            </Scatter>
                        </ScatterChart>
                    </MacroChartContainer>
                </div>
            </div>

            {/* Right: Alpha Narrative */}
            <div className="flex flex-col gap-6">
                <div className="p-8 rounded-xl bg-white/[0.02] border border-border flex-1 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Zap size={18} className="text-blue-500" />
                        </div>
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider italic">SDL Spread Narrative</h4>
                    </div>

                    <div className="space-y-6">
                        <p className="text-xs text-muted-foreground/80 leading-relaxed">
                            Market analysts trade the <span className="text-white font-bold italic">SDL-G-Sec spreads</span> based on relative fiscal slippage.
                        </p>

                        <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-rose-500" />
                                <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Stress Signal</span>
                            </div>
                            <p className="text-xs text-rose-200/60 leading-relaxed italic">
                                States in the <span className="text-rose-400 font-bold">Top-Right Trap</span> (GFD &gt; 3.5%, Debt &gt; 30%) are primary candidates for spread widening. Market demands higher liquidity premiums for these issuances.
                            </p>
                        </div>

                        <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Solvency Alpha</span>
                            </div>
                            <p className="text-xs text-emerald-200/60 leading-relaxed italic">
                                <span className="text-emerald-400 font-bold">Fiscal Fortresses</span> (Bottom-Left) typically trade at the tightest spreads to 10Y G-Sec, reflecting institutional confidence and superior treasury management.
                            </p>
                        </div>
                    </div>

                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 blur-[50px] rounded-full group-hover:bg-blue-500/10 transition-colors" />
                </div>

                {/* Source Data Info */}
                <div className="p-6 rounded-xl bg-white/[0.01] border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Info size={14} className="text-terminal-dim" />
                        <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">Source: RBI State Finances 2024-25</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-white/20 uppercase tracking-wider italic">Live Spread Pulse</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className={TOOLTIP_SHELL_CLASS}>
                <div className="text-xs font-semibold text-slate-100 mb-1 border-b border-border pb-2 uppercase tracking-wider">
                    {data.state_name} ({data.state_code})
                </div>
                <div className="space-y-2 mt-3">
                    <div className="flex justify-between gap-8">
                        <span className="text-xs text-slate-400">Debt/GSDP:</span>
                        <span className="text-xs font-semibold text-slate-100 font-mono tabular-nums">{data.y}%</span>
                    </div>
                    <div className="flex justify-between gap-8">
                        <span className="text-xs text-slate-400">GFD/GSDP:</span>
                        <span className="text-xs font-semibold text-rose-400 font-mono tabular-nums">{data.x}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
