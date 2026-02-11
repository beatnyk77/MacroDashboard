import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Info, Globe, AlertTriangle, Zap } from 'lucide-react';
import { usePreciousDivergence, PreciousDivergenceData } from '@/hooks/usePreciousDivergence';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
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
    const widthPercent = Math.min(Math.abs(spread) * 20, 100);

    return (
        <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-3xl p-6 border border-white/5 overflow-hidden">
            {/* Background Glow */}
            <div className={cn(
                "absolute -top-12 -right-12 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-10 transition-opacity",
                isPremium ? "bg-emerald-500" : "bg-rose-500"
            )} />

            <div className="flex flex-col xl:flex-row gap-8 items-stretch xl:items-center">
                {/* Header Info - Ticker Style */}
                <div className="xl:w-1/3 flex items-start gap-4">
                    <div className={cn("p-3 rounded-2xl bg-white/5 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500", iconColor)}>
                        <Globe className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                            {title} Arbitrage
                        </h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-col">
                                <span className="text-[0.6rem] font-bold text-muted-foreground/30 uppercase tracking-tighter">COMEX (West)</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg font-black text-white/90 font-mono">${comexMetric?.value?.toLocaleString()}</span>
                                    <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse" />
                                </div>
                            </div>
                            <div className="w-[1px] h-8 bg-white/5 hidden sm:block" />
                            <div className="flex flex-col">
                                <span className="text-[0.6rem] font-bold text-muted-foreground/30 uppercase tracking-tighter">SHANGHAI (East)</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg font-black text-emerald-400 font-mono">${shanghaiMetric?.value?.toLocaleString()}</span>
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spread Management */}
                <div className="xl:flex-1 flex flex-col justify-center gap-3">
                    <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-2">
                            <span className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5">
                                Global Spread
                            </span>
                            {Math.abs(spread) > 1.2 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[0.6rem] font-black text-amber-500 uppercase animate-in zoom-in">
                                    <Zap className="w-2.5 h-2.5 fill-amber-500" />
                                    Flow Divergence
                                </div>
                            )}
                        </div>
                        <div className={cn(
                            "text-3xl font-black tracking-tighter tabular-nums",
                            isPremium ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {isPremium ? '+' : ''}{spread.toFixed(2)}%
                        </div>
                    </div>

                    {/* Gauged Bar */}
                    <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/20 z-10" />
                        <div
                            className={cn(
                                "absolute top-0 bottom-0 transition-all duration-1000 ease-out",
                                isPremium ? "left-1/2 bg-gradient-to-r from-emerald-500/50 to-emerald-500" : "right-1/2 bg-gradient-to-l from-rose-500/50 to-rose-500"
                            )}
                            style={{ width: `${widthPercent / 2}%` }}
                        />
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                </div>

                {/* Narrative Spark */}
                <div className="xl:w-1/4 h-[80px] group-hover:scale-105 transition-transform duration-500">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spreadMetric.history?.slice(-30) || []}>
                            <defs>
                                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPremium ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isPremium ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPremium ? '#10b981' : '#f43f5e'}
                                fill={`url(#grad-${title})`}
                                strokeWidth={3}
                                isAnimationActive={true}
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
        return <Skeleton className="h-[400px] w-full rounded-[2.5rem] bg-white/5" />;
    }

    const goldSpread = divergenceData?.find(d => d.metric_id === 'GOLD_COMEX_SHANGHAI_SPREAD_PCT');
    const silverSpread = divergenceData?.find(d => d.metric_id === 'SILVER_COMEX_SHANGHAI_SPREAD_PCT');

    const goldComex = divergenceData?.find(d => d.metric_id === 'GOLD_COMEX_USD');
    const goldShanghai = divergenceData?.find(d => d.metric_id === 'GOLD_SHANGHAI_USD');

    const silverComex = divergenceData?.find(d => d.metric_id === 'SILVER_COMEX_USD');
    const silverShanghai = divergenceData?.find(d => d.metric_id === 'SILVER_SHANGHAI_USD');

    return (
        <Card className="p-8 bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden rounded-[2.5rem]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <TrendingUp className="text-emerald-500 w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                            Shanghai <span className="text-emerald-500">Divergence</span> Engine
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                        East-West price tracking of physical arbitrage. Persistent <span className="text-white font-bold">Shanghai Premiums</span> signal metal drainage from LBMA/COMEX vaults toward Asian central banks and retail.
                    </p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-[0.15em]">Live Vault Signals</span>
                </div>
            </div>

            <div className="space-y-8">
                <ArbitrageRow
                    title="Gold (XAU)"
                    spreadMetric={goldSpread}
                    comexMetric={goldComex}
                    shanghaiMetric={goldShanghai}
                    iconColor="text-amber-500"
                />

                <ArbitrageRow
                    title="Silver (XAG)"
                    spreadMetric={silverSpread}
                    comexMetric={silverComex}
                    shanghaiMetric={silverShanghai}
                    iconColor="text-slate-400"
                />
            </div>

            {/* Bottom Insight Bar */}
            <div className="mt-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-emerald-500/20">
                        <AlertTriangle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xs leading-relaxed text-muted-foreground">
                        <span className="text-emerald-400 font-bold uppercase tracking-wider mr-2">Market Interpretation:</span>
                        {goldSpread && goldSpread.value > 0.5
                            ? "Significant premium detected. High incentive for physical metal migration to the East."
                            : "Standard equilibrium. Macro flows are normalized between major global exchanges."}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                    {[
                        { label: 'Vault Drainage', content: 'Premiums > 1% signal aggressive metal removal from COMEX to SGE.' },
                        { label: 'Basis Rotation', content: 'Narrowing spread suggests cooling Asian demand or stronger USD.' },
                        { label: 'Liquidity Arbitrage', content: 'Incentivizes global bullion banks to move physical bar stock.' }
                    ].map((bullet, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/40">{bullet.label}</div>
                            <p className="text-[0.65rem] text-muted-foreground italic leading-tight">{bullet.content}</p>
                        </div>
                    ))}
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <Info className="w-4 h-4 text-muted-foreground/30" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-950 border-white/10 p-3 max-w-[200px]">
                            <p className="text-[0.6rem] text-muted-foreground leading-relaxed">
                                Spread is calculated as ((Shanghai / USDCNY) - COMEX) / COMEX * 100.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </Card>
    );
};
