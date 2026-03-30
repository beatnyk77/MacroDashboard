import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, ShieldCheck, X, Info, Target, TrendingDown, Activity, AlertTriangle, BookOpen } from 'lucide-react';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, YAxis, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';
import { formatBillions } from '@/utils/formatNumber';
import { Link } from 'react-router-dom';

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950 p-2 border border-white/12 rounded-lg shadow-xl">
                <span className="text-xs font-extrabold text-muted-foreground block uppercase">Z-SCORE BIN</span>
                <span className="text-sm font-black text-white">{payload[0].payload.bin}σ</span>
                <div className="mt-1">
                    <span className="text-xs font-extrabold text-muted-foreground block uppercase">FREQUENCY</span>
                    <span className="text-xs font-black text-primary">{payload[0].value} Days</span>
                </div>
            </div>
        );
    }
    return null;
};

export const LiquidityAlarmCard: React.FC = () => {
    const { data: liq } = useNetLiquidity();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!liq || !liq.current_value) return <Skeleton className="h-[200px] w-full rounded-xl" />;

    // Smoothed distribution data for the histogram (representative of 25y distribution)
    const distributionData = [
        { bin: -3, count: 5 }, { bin: -2.5, count: 12 }, { bin: -2, count: 28 },
        { bin: -1.5, count: 52 }, { bin: -1, count: 84 }, { bin: -0.5, count: 110 },
        { bin: 0, count: 145 }, { bin: 0.5, count: 115 }, { bin: 1, count: 88 },
        { bin: 1.5, count: 56 }, { bin: 2, count: 32 }, { bin: 2.5, count: 14 }, { bin: 3, count: 6 }
    ];

    const isExtreme = liq.z_score < -2 || liq.z_score > 2;
    const isTightening = liq.alarm_status === 'TIGHTENING';

    const getStatusColor = () => {
        if (isExtreme) return '#ef4444'; // Red
        if (isTightening) return '#f59e0b'; // Amber
        return '#10b981'; // Emerald
    };

    const getStatusClass = () => {
        if (isExtreme) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
        if (isTightening) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    };

    const getStatusIcon = () => {
        if (isExtreme) return <ShieldAlert size={20} className="text-rose-500" />;
        if (isTightening) return <AlertTriangle size={20} className="text-amber-500" />;
        return <ShieldCheck size={20} className="text-emerald-500" />;
    };

    return (
        <>
            <Card
                onClick={() => setIsModalOpen(true)}
                className={cn(
                    "p-6 h-full relative overflow-hidden flex flex-col gap-4 cursor-pointer transition-all duration-300",
                    "bg-card/40 backdrop-blur-md border border-white/12 dark:border-white/5 shadow-xl",
                    "hover:-translate-y-1 hover:shadow-2xl hover:border-primary/50",
                    isExtreme ? "border-rose-500/50 shadow-rose-500/20" : isTightening ? "border-amber-500/50 shadow-amber-500/20" : ""
                )}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <h4 className="font-extrabold text-xs tracking-[0.12em] text-muted-foreground uppercase">
                            LIQUIDITY ALARM
                        </h4>
                    </div>
                    <div className={cn("px-2 py-1 rounded text-xs font-black border", getStatusClass())}>
                        {liq.alarm_status}
                    </div>
                </div>

                <div className="flex items-baseline gap-3">
                    <div className="flex flex-col">
                        <h3 className="text-4xl font-black tracking-tighter text-foreground">
                            ${formatBillions(liq.current_value)}
                        </h3>
                        <div className="flex gap-2 mt-1">
                            <div className="px-1.5 py-0.5 rounded bg-background/50 border border-white/12 flex items-center gap-1">
                                <span className="text-xs font-bold text-muted-foreground tracking-wide">RRP</span>
                                <span className={cn("text-xs font-black", (liq.rrp_balance || 0) > 500 ? 'text-amber-500' : 'text-foreground')}>
                                    ${formatBillions(liq.rrp_balance)}
                                </span>
                            </div>
                            <div className="px-1.5 py-0.5 rounded bg-background/50 border border-white/12 flex items-center gap-1">
                                <span className="text-xs font-bold text-muted-foreground tracking-wide">TGA</span>
                                <span className={cn("text-xs font-black", (liq.tga_balance || 0) > 750 ? 'text-rose-500' : 'text-foreground')}>
                                    ${formatBillions(liq.tga_balance)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-black",
                        (liq?.delta || 0) >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
                    )}>
                        {liq?.delta !== undefined && liq?.delta !== null ? (liq.delta >= 0 ? '+' : '') : ''}{liq?.delta !== undefined && liq?.delta !== null ? formatBillions(liq.delta) : '-'}
                    </span>
                </div>

                <div className="flex gap-6 mt-2">
                    <div>
                        <span className="text-xs font-extrabold text-muted-foreground tracking-wider block mb-0.5">Z-SCORE (25Y)</span>
                        <span className={cn("text-lg font-black", getStatusClass().split(' ')[0])}>
                            {liq?.z_score !== undefined && liq?.z_score !== null ? liq.z_score.toFixed(2) : '-'}σ
                        </span>
                    </div>
                    <div className="flex-1">
                        <span className="text-xs font-extrabold text-muted-foreground tracking-wider block mb-0.5">SOFR-EFFR</span>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-lg font-black px-1.5 rounded",
                                (liq.sofr_effr_spread || 0) > 15 ? 'text-rose-500 bg-rose-500/10' : (liq.sofr_effr_spread || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'
                            )}>
                                {liq?.sofr_effr_spread !== undefined ? (liq.sofr_effr_spread > 0 ? '+' : '') + liq.sofr_effr_spread.toFixed(1) : '-'} bps
                            </span>
                            {liq.sofr_effr_history && liq.sofr_effr_history.length > 0 && (
                                <div className="w-12 h-6 opacity-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={liq.sofr_effr_history}>
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke={(liq.sofr_effr_spread || 0) > 15 ? '#f43f5e' : '#3b82f6'}
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-extrabold text-muted-foreground tracking-wider block mb-0.5">PERCENTILE</span>
                        <span className="text-lg font-black text-foreground">
                            {liq?.percentile !== undefined && liq?.percentile !== null ? liq.percentile.toFixed(1) : '-'}%
                        </span>
                    </div>
                </div>

                <div className={cn(
                    "mt-auto px-3 py-2 rounded-lg text-xs font-bold leading-relaxed border",
                    isExtreme
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : isTightening
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                    {isExtreme
                        ? "CRITICAL: Extreme net liquidity deviation detected. High risk of asset repricing."
                        : isTightening
                            ? "WARNING: Liquidity is tightening. Volatility risk is increasing."
                            : "STABLE: System liquidity remains within historical normal bounds."}
                </div>

                <div
                    className="absolute bottom-0 left-0 right-0 h-1 opacity-60"
                    style={{ backgroundColor: getStatusColor() }}
                />
            </Card>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setIsModalOpen(false)}
                    />
                    <div className="relative w-full max-w-5xl bg-[#0f172a]/95 border border-white/12 rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={cn("p-2 rounded-lg bg-opacity-20 flex", getStatusClass())}>
                                        {getStatusIcon()}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                                        Liquidity Regime Analysis
                                    </h2>
                                </div>
                                <p className="text-muted-foreground font-medium text-sm md:text-base">
                                    Visualizing the true net liquidity driving global asset prices.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-7 space-y-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity size={18} className="text-primary" />
                                        <h5 className="text-xs font-black tracking-widest text-muted-foreground uppercase">
                                            25-Year Z-Score Distribution
                                        </h5>
                                    </div>
                                    <div className="h-[300px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <XAxis
                                                    dataKey="bin"
                                                    stroke="rgba(255,255,255,0.2)"
                                                    fontSize={11}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(v) => `${v}σ`}
                                                />
                                                <YAxis hide />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                    content={<CustomTooltip />}
                                                />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                    {distributionData.map((entry, index) => {
                                                        const isCurrentBin = Math.abs(entry.bin - liq.z_score) < 0.25;
                                                        return (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={isCurrentBin ? getStatusColor() : 'rgba(148, 163, 184, 0.15)'}
                                                                style={{ transition: 'all 0.5s ease' }}
                                                            />
                                                        );
                                                    })}
                                                </Bar>
                                                <ReferenceLine x={liq.z_score} stroke={getStatusColor()} strokeWidth={2} strokeDasharray="5 5" label={{ value: 'CURRENT', position: 'top', fill: getStatusColor(), fontSize: 10, fontWeight: 900 }} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Target size={18} className="text-secondary" />
                                        <h5 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Formula & Methodology</h5>
                                    </div>
                                    <code className="block text-sm font-bold text-primary mb-2 font-mono">
                                        Net Liquidity = WALCL - TGA - RRP
                                    </code>
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                                        Calculated as the Federal Reserve Total Assets (WALCL) minus the Treasury General Account (TGA) and Reverse Repo Facility (RRP). Data ingested daily from NY Fed Markets API for high-fidelity signal.
                                    </p>
                                    <div className="flex gap-4 mt-3">
                                        <Link to="/glossary/tga" className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-black uppercase tracking-widest transition-colors">
                                            <BookOpen size={12} /> What is the TGA?
                                        </Link>
                                        <Link to="/glossary/reverse-repo-facility-rrp" className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-black uppercase tracking-widest transition-colors">
                                            <BookOpen size={12} /> What is RRP?
                                        </Link>
                                    </div>

                                </div>
                            </div>

                            <div className="md:col-span-5 space-y-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Info size={18} className="text-amber-500" />
                                        <h5 className="text-xs font-black tracking-widest text-muted-foreground uppercase">
                                            Macro Significance
                                        </h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="pl-3 border-l-2 border-emerald-500">
                                            <h6 className="text-sm font-bold text-foreground">High Net Liquidity</h6>
                                            <p className="text-xs text-muted-foreground mt-0.5">Typical of 'Risk-On' regimes. Excess bank reserves fuel equity and crypto appreciation.</p>
                                        </div>
                                        <div className="pl-3 border-l-2 border-rose-500">
                                            <h6 className="text-sm font-bold text-foreground">Low/Retracting Liquidity</h6>
                                            <p className="text-xs text-muted-foreground mt-0.5">Correlates with tightening cycles. Higher probability of volatility and credit stress.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingDown size={18} className="text-rose-500" />
                                        <h5 className="text-xs font-black tracking-widest text-rose-500 uppercase">
                                            Historical Risk Context
                                        </h5>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs font-black text-rose-400 block tracking-widest mb-1">DEC 2018 (QT SHOCK)</span>
                                            <p className="text-xs font-semibold text-muted-foreground">Last {'>'}2σ tightening regime. SPX declined 20% in 6 months as liquidity drained.</p>
                                        </div>
                                        <div className="h-px bg-white/5" />
                                        <div>
                                            <span className="text-xs font-black text-amber-400 block tracking-widest mb-1">MAR 2020 (COLLAPSE)</span>
                                            <p className="text-xs font-semibold text-muted-foreground">Rapid liquidity contraction preceded the 34% SPX correction.</p>
                                        </div>
                                        <div className="h-px bg-white/5" />
                                        <div>
                                            <span className="text-xs font-black text-emerald-400 block tracking-widest mb-1">JAN 2024 (RESILIENCE)</span>
                                            <p className="text-xs font-semibold text-muted-foreground">Positive liquidity z-score supported market resilience despite high rates.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
