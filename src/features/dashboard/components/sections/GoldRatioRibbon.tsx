import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceArea } from 'recharts';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { cn } from '@/lib/utils';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-slate-950/95 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
            <p className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3">
                {new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
            <div className="space-y-2.5">
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[0.7rem] font-bold text-white/80 tracking-tight">{entry.name}</span>
                        </div>
                        <div className="text-right">
                            <div className={cn(
                                "text-[0.7rem] font-black",
                                entry.value != null ? (Math.abs(entry.value) > 2 ? "text-rose-400" : Math.abs(entry.value) > 1.2 ? "text-amber-400" : "text-emerald-400") : "text-muted-foreground"
                            )}>
                                {entry.value != null ? (entry.value > 0 ? '+' : '') + entry.value.toFixed(2) + 'σ' : 'N/A'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GoldRatioRibbon: React.FC = () => {
    const { data: ratios, isLoading } = useGoldRatios();

    const chartData = useMemo(() => {
        if (!ratios) return [];

        const stats = ratios.reduce((acc, r) => {
            if (!r.history || r.history.length === 0) return acc;
            const values = r.history.map(h => h.value);
            const sum = values.reduce((a, b) => a + b, 0);
            const mean = sum / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            acc[r.ratio_name] = { mean, stdDev };
            return acc;
        }, {} as Record<string, { mean: number; stdDev: number }>);

        const dateSet = new Set<string>();
        ratios.forEach(r => r.history?.forEach(h => dateSet.add(h.date)));

        const sortedDates = Array.from(dateSet).sort();
        const recentDates = sortedDates.slice(-750); // ~3 years of data

        return recentDates.map(date => {
            const point: any = { date };
            ratios.forEach(r => {
                const historyPoint = r.history?.find(h => h.date === date);
                if (historyPoint) {
                    const s = stats[r.ratio_name];
                    point[r.ratio_name] = s && s.stdDev !== 0 ? (historyPoint.value - s.mean) / s.stdDev : 0;
                }
            });
            return point;
        });
    }, [ratios]);

    if (isLoading) {
        return <Skeleton className="h-[500px] w-full rounded-3xl bg-white/5" />;
    }

    const series = [
        { key: 'M2/Gold', color: '#3b82f6', label: 'Fiat Liquidity (M2)' },
        { key: 'SPX/Gold', color: '#10b981', label: 'Equity Valuation (S&P)' },
        { key: 'DEBT/Gold', color: '#ef4444', label: 'Public Debt Load' },
        { key: 'Gold/Silver', color: '#f59e0b', label: 'Hard Money Ratio (GSR)' }
    ];

    // Determine current regime based on average Z-score
    const activeSeries = ratios?.filter(r => series.some(s => s.key === r.ratio_name)) || [];
    const avgZ = activeSeries.length > 0 ? activeSeries.reduce((acc, r) => acc + r.z_score, 0) / activeSeries.length : 0;

    let regimeTitle = 'Neutral Balanced';
    let regimeDesc = 'Ratios are within historical normalization bands. No extreme undervaluation or bubble dynamics detected.';
    let regimeIcon = ShieldCheck;
    let regimeColor = 'text-emerald-400';

    if (avgZ > 1.5) {
        regimeTitle = 'Fiat Overextension';
        regimeDesc = 'Asset prices and debt levels are severely decoupled from hard money benchmarks. High risk of regime shift.';
        regimeIcon = AlertTriangle;
        regimeColor = 'text-amber-500';
    } else if (avgZ < -1.5) {
        regimeTitle = 'Hard Asset Undervaluation';
        regimeDesc = 'Gold is significantly overvalued relative to assets, or asset prices are extremely depressed. Capitulation signal.';
        regimeIcon = Zap;
        regimeColor = 'text-blue-400';
    }

    return (
        <Card className="p-8 bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] relative group">
            {/* Ambient Background Radial */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-blue-500/10 transition-colors duration-1000" />

            <div className="relative z-10 space-y-8">
                {/* Header Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
                                <Zap className="text-amber-500 w-5 h-5 fill-amber-500/20" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                                Unified <span className="text-amber-500">Gold</span> Ratio Ribbon
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                            Standardized deviation (Z-Score) of key macro assets priced in Gold.
                            The "Ribbon" visualizes the convergence or divergence of fiat reality from historical hard-money anchors.
                        </p>
                    </div>

                    {/* Regime Status Box */}
                    <div className={cn(
                        "p-5 rounded-3xl border flex items-start gap-4 transition-all duration-500",
                        avgZ > 1.5 ? "bg-amber-500/5 border-amber-500/20" : avgZ < -1.5 ? "bg-blue-500/5 border-blue-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                    )}>
                        <div className={cn("p-2 rounded-xl bg-white/5", regimeColor)}>
                            {React.createElement(regimeIcon, { className: "w-5 h-5" })}
                        </div>
                        <div className="space-y-1">
                            <div className={cn("text-xs font-black uppercase tracking-widest", regimeColor)}>
                                {regimeTitle}
                            </div>
                            <p className="text-[0.65rem] leading-tight text-muted-foreground font-medium italic">
                                {regimeDesc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Chart Area */}
                <div className="h-[480px] w-full relative">
                    <div className="absolute inset-0 bg-white/[0.01] rounded-[2.5rem] -m-4 border border-white/[0.02]" />
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />

                            {/* Regime Shading - Institutional Zones */}
                            <ReferenceArea y1={2} y2={4} fill="rgba(244,63,94,0.05)" /> {/* Extreme High */}
                            <ReferenceArea y1={1.2} y2={2} fill="rgba(245,158,11,0.03)" /> {/* Warning High */}
                            <ReferenceArea y1={-1.2} y2={1.2} fill="rgba(16,185,129,0.02)" /> {/* Equilibrium */}
                            <ReferenceArea y1={-2} y2={-1.2} fill="rgba(245,158,11,0.03)" /> {/* Warning Low */}
                            <ReferenceArea y1={-4} y2={-2} fill="rgba(244,63,94,0.05)" /> {/* Extreme Low */}

                            {/* Center Pivot */}
                            <ReferenceArea y1={-0.05} y2={0.05} fill="#fff" fillOpacity={0.1} />

                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={9}
                                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { year: '2-digit', month: 'short' })}
                                tick={{ fill: 'rgba(255,255,255,0.25)', fontWeight: 800 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={9}
                                domain={[-3.5, 3.5]}
                                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}σ`}
                                tick={{ fill: 'rgba(255,255,255,0.25)', fontWeight: 800 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="top"
                                align="left"
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{
                                    paddingBottom: '40px',
                                    fontSize: '9px',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2em',
                                    opacity: 0.6
                                }}
                            />

                            {series.map(s => (
                                <Line
                                    key={s.key}
                                    type="monotone"
                                    dataKey={s.key}
                                    name={s.label}
                                    stroke={s.color}
                                    strokeWidth={s.key === 'M2/Gold' ? 4 : 2.5}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                                    strokeOpacity={0.8}
                                    animationDuration={2000}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Individual Metric Cards Grid - Simplified */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/5">
                    {ratios?.filter(r => series.some(s => s.key === r.ratio_name)).map(ratio => {
                        const sConfig = series.find(s => s.key === ratio.ratio_name);
                        const isExtreme = Math.abs(ratio.z_score) > 2.0;
                        return (
                            <div key={ratio.ratio_name} className="group/metric relative p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all duration-300">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sConfig?.color }} />
                                        <span className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-widest">
                                            {ratio.ratio_name}
                                        </span>
                                    </div>
                                    {isExtreme && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-xl font-black text-white/90 tabular-nums tracking-tighter">
                                        {ratio.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                    <div className={cn(
                                        "text-[0.7rem] font-black tabular-nums tracking-tight",
                                        isExtreme ? "text-rose-500" : Math.abs(ratio.z_score) > 1.2 ? "text-amber-500" : "text-emerald-500"
                                    )}>
                                        {ratio.z_score != null ? (ratio.z_score > 0 ? '+' : '') + ratio.z_score.toFixed(2) + 'σ' : '--'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};
