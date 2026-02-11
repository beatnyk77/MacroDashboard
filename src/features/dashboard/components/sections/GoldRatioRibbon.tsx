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
                <div className="h-[450px] w-full relative">
                    <div className="absolute inset-0 bg-white/[0.01] rounded-3xl -m-4 border border-white/[0.02]" />
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />

                            {/* Central Pivot Area */}
                            <ReferenceArea y1={-1} y2={1} fill="#64748b" fillOpacity={0.03} />

                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { year: '2-digit', month: 'short' })}
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                domain={[-3.5, 3.5]}
                                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}σ`}
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            />

                            {series.map(s => (
                                <Line
                                    key={s.key}
                                    type="monotone"
                                    dataKey={s.key}
                                    name={s.label}
                                    stroke={s.color}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Individual Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ratios?.filter(r => series.some(s => s.key === r.ratio_name)).map(ratio => {
                        const sConfig = series.find(s => s.key === ratio.ratio_name);
                        return (
                            <div key={ratio.ratio_name} className="group/metric p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] transition-colors group-hover/metric:text-muted-foreground">
                                            {ratio.ratio_name}
                                        </span>
                                        <span className="text-lg font-black text-white/90">
                                            {ratio.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div
                                        className="w-2 h-8 rounded-full opacity-20 group-hover/metric:opacity-40 transition-opacity"
                                        style={{ backgroundColor: sConfig?.color }}
                                    />
                                </div>
                                <div className={cn(
                                    "px-3 py-1.5 rounded-xl text-[0.7rem] font-black uppercase tracking-tight flex items-center justify-between",
                                    Math.abs(ratio.z_score) > 2 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                                        Math.abs(ratio.z_score) > 1.2 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                            "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                )}>
                                    <span>Z-Score</span>
                                    <span>{ratio.z_score != null ? (ratio.z_score > 0 ? '+' : '') + ratio.z_score.toFixed(2) + 'σ' : 'N/A'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};
