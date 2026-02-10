import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceArea } from 'recharts';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-slate-950/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
            <p className="text-xs font-mono text-muted-foreground mb-2">
                {new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="space-y-2">
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-bold text-white/90">{entry.name}</span>
                        </div>
                        <div className="text-right">
                            <div className={cn(
                                "text-xs font-black",
                                Math.abs(entry.value) > 1.5 ? "text-amber-400" : "text-emerald-400"
                            )}>
                                {entry.value > 0 ? '+' : ''}{entry.value.toFixed(2)}σ
                            </div>
                            <div className="text-[0.6rem] text-muted-foreground font-mono">
                                Raw: {entry.payload[`${entry.dataKey}_raw`]?.toFixed(2)}
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

    // Data Preparation: Calculate Z-Scores for history and normalize
    const chartData = useMemo(() => {
        if (!ratios) return [];

        // 1. Calculate Mean and StdDev for each ratio's history
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

        // 2. Get all unique dates
        const dateSet = new Set<string>();
        ratios.forEach(r => {
            r.history?.forEach(h => dateSet.add(h.date));
        });

        const sortedDates = Array.from(dateSet).sort();
        // Take last 500 points for approx 2 years of daily data or equivalent
        const recentDates = sortedDates.slice(-500);

        return recentDates.map(date => {
            const point: any = { date };
            ratios.forEach(r => {
                const historyPoint = r.history?.find(h => h.date === date);
                if (historyPoint) {
                    const s = stats[r.ratio_name];
                    // Store Z-Score for plotting
                    point[r.ratio_name] = s && s.stdDev !== 0 ? (historyPoint.value - s.mean) / s.stdDev : 0;
                    // Store Raw Value for tooltip
                    point[`${r.ratio_name}_raw`] = historyPoint.value;
                }
            });
            return point;
        });
    }, [ratios]);

    if (isLoading) {
        return (
            <Card className="p-6 h-[400px] flex flex-col gap-4 bg-card/40 backdrop-blur-md border border-white/10">
                <Skeleton className="h-8 w-[40%]" />
                <Skeleton className="h-full w-full rounded-xl" />
            </Card>
        );
    }

    const series = [
        { key: 'M2/Gold', color: '#3b82f6', label: 'Monetary Supply (M2)' },
        { key: 'SPX/Gold', color: '#10b981', label: 'Equities (S&P 500)' },
        { key: 'DEBT/Gold', color: '#ef4444', label: 'Public Debt' }
    ];

    const regimes = [
        { y1: -10, y2: -1.5, label: 'Deep Value (Hard Money)', fill: '#10b981', opacity: 0.1 },
        { y1: -1.5, y2: 1.5, label: 'Normal Volatility', fill: '#64748b', opacity: 0.05 },
        { y1: 1.5, y2: 10, label: 'Fiat Extension (Risk)', fill: '#f59e0b', opacity: 0.1 }
    ];


    return (
        <Card className="p-6 bg-[#0a1929]/80 backdrop-blur-md border border-blue-500/20 rounded-xl mb-8 overflow-hidden relative shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                    <span className="block text-[0.65rem] font-black text-blue-500 tracking-[0.15em] uppercase mb-1">
                        UNIFIED VALUATION ANCHOR
                    </span>
                    <h2 className="text-2xl font-serif text-foreground">
                        The Gold Ratio Ribbon
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                        Standardized deviation (Z-Score) of key macro assets priced in Gold.
                        Validates if current fiat prices are supported by hard money reality.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <Info className="w-3 h-3 text-blue-400" />
                    <span className="text-[0.6rem] font-bold text-blue-300 uppercase tracking-wider">
                        Live Regime Tracking
                    </span>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

                        {/* Regime Zones */}
                        {regimes.map(r => (
                            <ReferenceArea
                                key={r.label}
                                y1={r.y1}
                                y2={r.y2}
                                fill={r.fill}
                                fillOpacity={r.opacity}
                            />
                        ))}

                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={10}
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { year: '2-digit', month: 'short' })}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={10}
                            domain={[-3, 3]} // Fixed domain for Z-scores usually
                            allowDataOverflow={false} // Let it scale if extreme
                            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}σ`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 600 }}
                        />

                        {series.map(s => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Metric Footer */}
            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                {ratios?.filter(r => series.some(s => s.key === r.ratio_name)).map(ratio => (
                    <div key={ratio.ratio_name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                {ratio.ratio_name}
                            </span>
                            <span className="text-sm font-black text-white">
                                {ratio.current_value.toFixed(2)}
                            </span>
                        </div>
                        <div className={cn(
                            "px-2 py-1 rounded text-[0.65rem] font-black uppercase tracking-wider",
                            Math.abs(ratio.z_score) > 1.5
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        )}>
                            {ratio.z_score > 0 ? '+' : ''}{ratio.z_score.toFixed(2)}σ
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
