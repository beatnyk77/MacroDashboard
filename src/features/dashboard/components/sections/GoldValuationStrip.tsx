import React from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { useIngestionStatus } from '@/hooks/useIngestionStatus';
import { useGoldRatioHistory } from '@/hooks/useGoldRatioHistory';
import { Sparkline } from '@/components/Sparkline';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const GoldValuationStrip: React.FC = () => {
    const { data: ratios } = useGoldRatios();
    const { data: gold } = useLatestMetric('GOLD_PRICE_USD');
    const { data: status } = useIngestionStatus();
    const { data: history } = useGoldRatioHistory(90);

    const getRatio = (name: string) => ratios?.find((r: any) => r.ratio_name === name);
    const m2Gold = getRatio('M2/Gold');
    const spxGold = getRatio('SPX/Gold');
    const debtGold = getRatio('DEBT/Gold');
    const goldSilver = getRatio('Gold/Silver');

    const getRatioHistory = (name: string) => {
        if (!history) return [];
        return history.map(d => ({
            date: d.date,
            value: d.ratios.find(r => r.ratio_name === name)?.value || 0
        })).filter(v => v.value !== 0);
    };

    const getZColorClass = (z?: number) => {
        if (!z) return 'text-muted-foreground/50';
        if (z > 1.5) return 'text-rose-500 bg-rose-500/15';
        if (z < -1.5) return 'text-emerald-500 bg-emerald-500/15';
        return 'text-muted-foreground';
    };

    const getZSeriesColor = (z?: number) => {
        if (!z) return '#9ca3af';
        if (z > 1.5) return '#ef4444';
        if (z < -1.5) return '#10b981';
        return '#9ca3af';
    };

    return (
        <div className="sticky bottom-0 left-0 z-[1100] w-full bg-slate-950/95 backdrop-blur-md border-t-2 border-amber-400/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] py-2 px-6 flex items-center justify-between">
            <div className="flex items-center gap-6 md:gap-12 overflow-x-auto no-scrollbar">
                <div className="shrink-0 flex flex-col justify-center">
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="text-[0.6rem] font-black text-primary tracking-[0.15em] uppercase">
                            LIVE ANCHOR
                        </span>
                        <div className="bg-blue-500/10 px-1 rounded-[2px] border border-blue-500/20">
                            <span className="text-[0.5rem] font-black text-primary block leading-tight">25Y CYCLE</span>
                        </div>
                    </div>
                    <span className="text-base md:text-lg font-black text-foreground tracking-tight">
                        GOLD ${gold?.value.toLocaleString() || '-'}
                    </span>
                </div>

                <div className="hidden sm:block w-px h-8 bg-border" />

                {[
                    { label: 'M2/GOLD', data: m2Gold, name: 'M2/Gold' },
                    { label: 'SPX/GOLD', data: spxGold, name: 'SPX/Gold' },
                    { label: 'DEBT/GOLD', data: debtGold, name: 'DEBT/Gold' },
                    { label: 'GOLD/SILVER', data: goldSilver, name: 'Gold/Silver' }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[0.6rem] font-bold text-muted-foreground tracking-[0.08em] uppercase">
                                    {item.label}
                                </span>
                                {item.name === 'Gold/Silver' && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info size={10} className="text-muted-foreground/50 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Historical context: 50y average around 60. Current relative to 25y window.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm md:text-base font-extrabold text-foreground">
                                    {item.data?.current_value.toFixed(2) || '-'}
                                </span>
                                {item.data?.z_score !== undefined && (
                                    <span className={cn(
                                        "text-[0.65rem] font-black px-1 rounded-[2px]",
                                        getZColorClass(item.data.z_score)
                                    )}>
                                        Z: {item.data.z_score > 0 ? '+' : ''}{item.data.z_score.toFixed(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="hidden md:block w-10 h-5 mt-1 opacity-80">
                            <Sparkline data={getRatioHistory(item.name)} color={getZSeriesColor(item.data?.z_score)} height={20} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden md:flex items-center gap-4 shrink-0 border-l border-white/5 pl-6">
                <div className="text-right">
                    <span className="block text-[0.6rem] font-bold text-muted-foreground/50 tracking-[0.05em] uppercase mb-0.5">
                        SYSTEM HEARTBEAT (UTC)
                    </span>
                    <div className="flex items-center gap-2 justify-end">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                            status?.last_ingestion_at
                                ? "bg-emerald-500 shadow-emerald-500/50"
                                : "bg-rose-500 shadow-rose-500/50"
                        )} />
                        <span className="text-[0.65rem] font-bold text-muted-foreground">
                            {status?.last_ingestion_at ? new Date(status.last_ingestion_at).toUTCString().replace('GMT', 'UTC') : 'CONNECTING...'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
