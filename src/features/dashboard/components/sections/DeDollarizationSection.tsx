import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, AlertTriangle, DollarSign, Coins } from 'lucide-react'; // Coins icon for Gold
import { useDeDollarization, useDeDollarizationHistory } from '@/hooks/useDeDollarization';
import { ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/SectionHeader';

export const DeDollarizationSection: React.FC = () => {
    const { data: metrics } = useDeDollarization();
    const { data: usdHistory, isLoading: isLoadingUsd } = useDeDollarizationHistory('GLOBAL_USD_SHARE_PCT');
    const { data: goldHistory, isLoading: isLoadingGold } = useDeDollarizationHistory('GLOBAL_GOLD_SHARE_PCT');

    const usdShare = metrics?.usdShare;
    const goldShare = metrics?.goldShare;

    const isLoading = !metrics || isLoadingUsd || isLoadingGold;

    if (isLoading) {
        return (
            <div className="mb-6">
                <SectionHeader title="De-Dollarization Tracker" subtitle="Global reserve currency composition" />
                <Card className="p-6 h-[300px] flex flex-col gap-4 bg-card/40 backdrop-blur-md border border-white/10">
                    <Skeleton className="h-8 w-[40%]" />
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <Skeleton className="h-full rounded-xl" />
                        <Skeleton className="h-full rounded-xl" />
                    </div>
                </Card>
            </div>
        );
    }

    // Signals
    const isDeDollarizing = (usdShare?.delta_qoq || 0) < 0;
    const isGoldAccumulating = (goldShare?.delta_yoy_pct || 0) > 5;

    const MetricPanel = ({
        title,
        metric,
        history,
        color,
        icon: Icon,
        trendLabel,
        isInverse = false
    }: {
        title: string,
        metric: any,
        history: any[],
        color: string,
        icon: any,
        trendLabel: string,
        isInverse?: boolean
    }) => {
        const isPositive = (metric?.delta_qoq || 0) > 0;
        const isGood = isInverse ? !isPositive : isPositive;
        const trendColor = isGood ? 'text-emerald-400' : 'text-rose-400';

        // Dynamic gradient ID
        const gradId = `grad-${title.replace(/\s+/g, '')}`;

        return (
            <div className="flex-1 bg-black/20 rounded-xl p-5 border border-white/5 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-white/5", `text-${color}-400`)}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-serif text-lg text-white">{title}</h3>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-2xl font-black tracking-tighter", `text-${color}-400`)}>
                                    {metric?.value?.toFixed(2)}%
                                </span>
                                <div className={cn("flex items-center text-xs font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10", trendColor)}>
                                    {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                    {Math.abs(metric?.delta_qoq || 0).toFixed(2)}pp
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[120px] w-full -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color === 'amber' ? '#fbbf24' : '#60a5fa'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color === 'amber' ? '#fbbf24' : '#60a5fa'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                                formatter={(value: number) => [`${value.toFixed(2)}%`, title]}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color === 'amber' ? '#fbbf24' : '#60a5fa'}
                                fill={`url(#${gradId})`}
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-2 text-[10px] text-muted-foreground font-mono uppercase tracking-wider flex justify-between">
                    <span>{trendLabel}</span>
                    <span>Last: {metric?.as_of_date}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="mb-8">
            <SectionHeader
                title="De-Dollarization Tracker"
                subtitle="Global reserve currency composition and gold accumulation trends (IMF COFER)"
            />

            <Card className="p-6 bg-[#0a1929]/80 backdrop-blur-md border border-white/10 rounded-xl relative overflow-hidden shadow-2xl">
                <div className="flex flex-col md:flex-row gap-6">
                    <MetricPanel
                        title="USD Share"
                        metric={usdShare}
                        history={usdHistory || []}
                        color="blue"
                        icon={DollarSign}
                        trendLabel="IMF COFER Reserves"
                        isInverse={true} // Lower is "good" for de-dollarization thesis context, but usually we just show trend
                    />

                    <MetricPanel
                        title="Gold Share"
                        metric={goldShare}
                        history={goldHistory || []}
                        color="amber"
                        icon={Coins}
                        trendLabel="Central Bank Gold"
                    />
                </div>

                {/* Synthesis / Insight */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-start gap-4">
                    <div className={cn("p-2 rounded-full mt-1", isDeDollarizing && isGoldAccumulating ? "bg-amber-500/10 text-amber-500" : "bg-slate-800 text-slate-400")}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">Regime Shift Signal</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                            {isDeDollarizing && isGoldAccumulating
                                ? "Active De-Dollarization: Central banks are simultaneously reducing USD exposure and rotating into physical gold. This divergence marks a structural shift in the global monetary order."
                                : "Mixed Signal: While some rotation is occurring, the data does not yet confirm a decisive break from the USD-centric reserve system."}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};
