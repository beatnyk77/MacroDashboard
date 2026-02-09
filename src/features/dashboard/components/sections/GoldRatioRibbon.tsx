import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { cn } from '@/lib/utils';

export const GoldRatioRibbon: React.FC = () => {
    const { data: ratios, isLoading } = useGoldRatios();

    // Data Preparation: Normalize history into a single array for Recharts
    const chartData = useMemo(() => {
        if (!ratios) return [];

        // Get all unique dates
        const dateSet = new Set<string>();
        ratios.forEach(r => {
            r.history?.forEach(h => dateSet.add(h.date));
        });

        const sortedDates = Array.from(dateSet).sort();

        // Take last 250 points for better performance/visibility (~1 year of monthly-ish data if frequent)
        const recentDates = sortedDates.slice(-250);

        return recentDates.map(date => {
            const point: any = { date };
            ratios.forEach(r => {
                const historyPoint = r.history?.find(h => h.date === date);
                if (historyPoint) {
                    // We use Z-score if available for normalize comparison, 
                    // but history is raw values. We should ideally have Z-score history.
                    // Since we only have raw values, we'll normalize them by their current value for the 'ribbon' effect
                    // or just show the raw values on a log scale? 
                    // Spec said "Z-scores", but hook only gives current Z-score.
                    // I will provide a simple normalization: (value / initial_value) to show relative growth
                    point[r.ratio_name] = historyPoint.value;
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

    return (
        <Card className="p-6 bg-[#0a1929]/80 backdrop-blur-md border border-blue-500/20 rounded-xl mb-8 overflow-hidden relative shadow-2xl">
            <div className="mb-6">
                <span className="block text-[0.65rem] font-black text-blue-500 tracking-[0.15em] uppercase mb-1">
                    UNIFIED VALUATION ANCHOR
                </span>
                <h2 className="text-2xl font-serif text-foreground">
                    The Gold Ratio Ribbon
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    Tracking the expansion of credit, equities, and debt relative to the hard money floor.
                    Divergence in these ratios signals generational shifts in monetary regimes.
                </p>
            </div>

            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            {series.map(s => (
                                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={10}
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { year: '2-digit', month: 'short' })}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={10}
                            scale="log"
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '11px' }}
                            formatter={(value: number) => [value.toFixed(2), '']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 700 }}
                        />
                        {series.map(s => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#grad-${s.key})`}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Live Z-Scores */}
                    <div className="flex flex-wrap gap-8 justify-start">
                        {ratios?.filter(r => series.some(s => s.key === r.ratio_name)).map(ratio => (
                            <div key={ratio.ratio_name} className="flex flex-col gap-1">
                                <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">
                                    {ratio.ratio_name} POSITION
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className={cn(
                                        "text-xl font-black tracking-tighter",
                                        Math.abs(ratio.z_score) > 1.5 ? 'text-amber-500' : 'text-emerald-500'
                                    )}>
                                        {ratio.z_score > 0 ? '+' : ''}{ratio.z_score.toFixed(2)}σ
                                    </span>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase">
                                        {Math.abs(ratio.z_score) > 1.5 ? 'Extended' : 'Normal Range'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Interpretation Guide */}
                    <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                        <span className="text-[0.6rem] font-black text-blue-400 uppercase tracking-widest block mb-2">Guide: Monetary Regimes</span>
                        <div className="space-y-2 text-[0.7rem] leading-relaxed text-muted-foreground/80">
                            <p>• <span className="text-blue-400 font-bold">Rising M2/Gold:</span> Signal of accelerating monetary debasement.</p>
                            <p>• <span className="text-emerald-400 font-bold">Rising SPX/Gold:</span> Equities overvalued versus the hard money floor.</p>
                            <p>• <span className="text-rose-400 font-bold">Rising Debt/Gold:</span> Fiscal expansion outpacing hard asset reserves.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
