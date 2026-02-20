import React, { useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, LabelList, Cell
} from 'recharts';
import { AlertCircle, ShieldCheck, Zap, Info, LayoutGrid } from 'lucide-react';
import { useStateFiscalHealth } from '@/hooks/useStateFiscalHealth';

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
            case 'fortress': return '#10b981'; // Emerald
            case 'trap': return '#f43f5e'; // Rose
            case 'debt-driven': return '#f59e0b'; // Amber
            case 'growth-driven': return '#3b82f6'; // Blue
            default: return '#64748b';
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] w-full bg-white/[0.02] border border-white/5 animate-pulse rounded-[3rem] flex items-center justify-center">
                <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Mapping Fiscal Matrix...</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Scatter Matrix */}
            <div className="lg:col-span-2 p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <LayoutGrid size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">State Fiscal Health Matrix</h3>
                            <p className="text-[0.6rem] text-muted-foreground/60 font-medium">Outstanding Debt vs. Fiscal Deficit (% GSDP)</p>
                        </div>
                    </div>
                </div>

                <div className="h-[450px] w-full relative">
                    {/* Quadrant Labels Overlay */}
                    <div className="absolute top-4 left-16 text-[0.5rem] font-black text-white/20 uppercase tracking-[0.2em]">Debt-Driven</div>
                    <div className="absolute top-4 right-4 text-[0.5rem] font-black text-rose-500/30 uppercase tracking-[0.2em]">Fiscal Trap (Stress)</div>
                    <div className="absolute bottom-12 left-16 text-[0.5rem] font-black text-emerald-500/30 uppercase tracking-[0.2em]">Fiscal Fortress</div>
                    <div className="absolute bottom-12 right-4 text-[0.5rem] font-black text-white/20 uppercase tracking-[0.2em]">Growth-Driven</div>

                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="GFD %"
                                domain={[0, 10]}
                                unit="%"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }}
                                label={{ value: 'Gross Fiscal Deficit (%)', position: 'bottom', offset: 20, fill: '#475569', fontSize: 10, fontWeight: 800 }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Debt %"
                                domain={[0, 50]}
                                unit="%"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }}
                                label={{ value: 'Outstanding Debt (%)', angle: -90, position: 'left', fill: '#475569', fontSize: 10, fontWeight: 800 }}
                            />
                            <ZAxis type="number" range={[400, 400]} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />

                            <ReferenceLine x={3.5} stroke="rgba(244, 63, 94, 0.4)" strokeDasharray="5 5" strokeWidth={2} />
                            <ReferenceLine y={30} stroke="rgba(244, 63, 94, 0.4)" strokeDasharray="5 5" strokeWidth={2} />

                            <Scatter name="States" data={chartData}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColor(entry.x, entry.y)} />
                                ))}
                                <LabelList dataKey="name" position="top" style={{ fill: '#fff', fontSize: 10, fontWeight: 900, opacity: 0.8 }} offset={10} />
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Right: Alpha Narrative */}
            <div className="flex flex-col gap-6">
                <div className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 flex-1 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Zap size={18} className="text-blue-500" />
                        </div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest italic">SDL Spread Narrative</h4>
                    </div>

                    <div className="space-y-6">
                        <p className="text-[0.7rem] text-muted-foreground/80 leading-relaxed">
                            Market analysts trade the <span className="text-white font-bold italic">SDL-G-Sec spreads</span> based on relative fiscal slippage.
                        </p>

                        <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-rose-500" />
                                <span className="text-[0.6rem] font-black text-rose-500 uppercase tracking-widest">Stress Signal</span>
                            </div>
                            <p className="text-[0.65rem] text-rose-200/60 leading-relaxed italic">
                                States in the <span className="text-rose-400 font-bold">Top-Right Trap</span> (GFD &gt; 3.5%, Debt &gt; 30%) are primary candidates for spread widening. Market demands higher liquidity premiums for these issuances.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[0.6rem] font-black text-emerald-500 uppercase tracking-widest">Solvency Alpha</span>
                            </div>
                            <p className="text-[0.65rem] text-emerald-200/60 leading-relaxed italic">
                                <span className="text-emerald-400 font-bold">Fiscal Fortresses</span> (Bottom-Left) typically trade at the tightest spreads to 10Y G-Sec, reflecting institutional confidence and superior treasury management.
                            </p>
                        </div>
                    </div>

                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 blur-[50px] rounded-full group-hover:bg-blue-500/10 transition-colors" />
                </div>

                {/* Source Data Info */}
                <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Info size={14} className="text-muted-foreground/40" />
                        <span className="text-[0.6rem] font-bold text-muted-foreground/40 uppercase tracking-widest">Source: RBI State Finances 2024-25</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest italic">Live Spread Pulse</span>
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
            <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-3xl">
                <div className="text-[0.7rem] font-black text-white italic mb-1 border-b border-white/5 pb-2 uppercase tracking-widest">
                    {data.state_name} ({data.state_code})
                </div>
                <div className="space-y-2 mt-3">
                    <div className="flex justify-between gap-8">
                        <span className="text-[0.65rem] text-muted-foreground/60">Debt/GSDP:</span>
                        <span className="text-[0.7rem] font-black text-white tabular-nums">{data.y}%</span>
                    </div>
                    <div className="flex justify-between gap-8">
                        <span className="text-[0.65rem] text-muted-foreground/60">GFD/GSDP:</span>
                        <span className="text-[0.7rem] font-black text-rose-400 tabular-nums">{data.x}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
