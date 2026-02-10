import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Info, Globe, AlertTriangle } from 'lucide-react';
import { usePreciousDivergence, PreciousDivergenceData } from '@/hooks/usePreciousDivergence';
import { ResponsiveContainer, AreaChart, Area, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface ArbitrageRowProps {
    title: string;
    spreadMetric?: PreciousDivergenceData;
    comexMetric?: PreciousDivergenceData;
    shanghaiMetric?: PreciousDivergenceData;
    iconColor: string;
}

const ArbitrageRow: React.FC<ArbitrageRowProps> = ({
    title,
    spreadMetric,
    comexMetric,
    shanghaiMetric,
    iconColor
}) => {
    if (!spreadMetric) return null;

    const spread = spreadMetric.value;
    const isPremium = spread > 0;
    const widthPercent = Math.min(Math.abs(spread) * 20, 100); // Scale: 5% spread fills bar

    return (
        <div className="group relative bg-black/20 hover:bg-black/30 transition-all rounded-lg p-4 border border-white/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Header Info - Spans 4 cols */}
                <div className="lg:col-span-4 flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-lg bg-white/5 shrink-0", iconColor)}>
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-serif text-lg text-white leading-tight">{title} Arbitrage</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-1">
                            <div className="flex flex-col sm:flex-row sm:gap-2">
                                <span>COMEX: <span className="text-white font-bold">${comexMetric?.value?.toLocaleString()}</span></span>
                                <span className="hidden sm:inline text-muted-foreground/30">|</span>
                                <span>SHANGHAI: <span className="text-emerald-400 font-bold">${shanghaiMetric?.value?.toLocaleString()}</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spread Bar & Value - Spans 5 cols */}
                <div className="lg:col-span-4 flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-wider">
                            Premium / Discount
                        </span>
                        <div className={cn(
                            "text-xl font-black tracking-tighter flex items-center gap-2",
                            isPremium ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {isPremium ? '+' : ''}{spread.toFixed(2)}%
                            {Math.abs(spread) > 1.0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-amber-950 border-amber-500/20 text-amber-200 text-xs font-bold">
                                            High arbitrage incentive! Physical drainage risk.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/30 z-10" />
                        <div
                            className={cn(
                                "absolute top-0 bottom-0 transition-all duration-1000 ease-out rounded-full",
                                isPremium ? "left-1/2 bg-emerald-500" : "right-1/2 bg-rose-500"
                            )}
                            style={{ width: `${widthPercent / 2}%` }}
                        />
                    </div>
                </div>

                {/* Sparkline - Spans 3 cols */}
                <div className="lg:col-span-4 h-[50px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spreadMetric.history || []}>
                            <defs>
                                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPremium ? '#10b981' : '#f43f5e'} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={isPremium ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: isPremium ? '#10b981' : '#f43f5e' }}
                                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Spread']}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPremium ? '#10b981' : '#f43f5e'}
                                fill={`url(#grad-${title})`}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export const PreciousDivergenceCard: React.FC = () => {
    const { data: divergenceData, isLoading } = usePreciousDivergence();

    if (isLoading) {
        return (
            <Card className="p-6 h-[300px] flex flex-col gap-4 bg-card/40 backdrop-blur-md border border-white/10">
                <Skeleton className="h-8 w-[60%]" />
                <Skeleton className="h-[200px] w-full rounded-xl" />
            </Card>
        );
    }

    const goldSpread = divergenceData?.find(d => d.metric_id === 'GOLD_COMEX_SHANGHAI_SPREAD_PCT');
    const silverSpread = divergenceData?.find(d => d.metric_id === 'SILVER_COMEX_SHANGHAI_SPREAD_PCT');

    const goldComex = divergenceData?.find(d => d.metric_id === 'GOLD_COMEX_USD');
    const goldShanghai = divergenceData?.find(d => d.metric_id === 'GOLD_SHANGHAI_USD');

    const silverComex = divergenceData?.find(d => d.metric_id === 'SILVER_COMEX_USD');
    const silverShanghai = divergenceData?.find(d => d.metric_id === 'SILVER_SHANGHAI_USD');

    return (
        <Card className="p-5 bg-[#0a1929]/80 backdrop-blur-md border border-amber-500/20 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="block text-[0.65rem] font-black text-amber-500 tracking-[0.15em] uppercase mb-1">
                        EAST-WEST ARBITRAGE
                    </span>
                    <h2 className="text-xl font-serif text-foreground flex items-center gap-2">
                        Shanghai Premium
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-4 h-4 text-muted-foreground/50 hover:text-amber-400 transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs bg-slate-950 border-white/10">
                                    <p className="text-xs text-muted-foreground">
                                        Price difference between Shanghai Gold Exchange (SGE) and COMEX.
                                        A persistent positive spread signals physical metal migration from West to East.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </h2>
                </div>
            </div>

            <div className="space-y-6">
                <ArbitrageRow
                    title="Gold"
                    spreadMetric={goldSpread}
                    comexMetric={goldComex}
                    shanghaiMetric={goldShanghai}
                    iconColor="text-amber-400"
                />

                <ArbitrageRow
                    title="Silver"
                    spreadMetric={silverSpread}
                    comexMetric={silverComex}
                    shanghaiMetric={silverShanghai}
                    iconColor="text-slate-300"
                />
            </div>

            {/* Insight */}
            <div className="mt-6 pt-4 border-t border-white/5">
                <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mt-1" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="text-emerald-400 font-bold">Arbitrage Signal:</span>
                        {goldSpread && goldSpread.value > 0.5
                            ? " Strong incentive for physical delivery in Shanghai. Bullish for physical demand."
                            : " Markets are relatively balanced. Neutral flow signal."}
                    </p>
                </div>
            </div>
        </Card>
    );
};
