import React from 'react';
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricTrendItemProps {
    name: string;
    value: number | string;
    unit?: string;
    zScore?: number;
    change?: number;
    changePeriod?: string;
    color: string;
}

export const MetricTrendItem: React.FC<MetricTrendItemProps> = ({
    name,
    value,
    unit,
    zScore,
    change,
    changePeriod,
}) => {
    // Normalize Z-score for visualization (-3 to +3 range)
    const normalizedZ = zScore !== undefined ? Math.max(-3, Math.min(3, zScore)) : 0;
    // Offset to percentage (0% to 100%, 50% is 0)
    const zPos = ((normalizedZ + 3) / 6) * 100;

    const absZ = Math.abs(zScore || 0);
    const zColor = absZ > 2 ? 'text-rose-500' : absZ > 1.2 ? 'text-amber-500' : 'text-emerald-500';
    const zBgColor = absZ > 2 ? 'bg-rose-500' : absZ > 1.2 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="group/item relative px-4 py-4 rounded-xl transition-all hover:bg-white/[0.03] flex flex-col gap-3">
            {/* Top Row: Name and Value */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[0.65rem] font-bold text-muted-foreground/60 uppercase tracking-wider group-hover/item:text-muted-foreground transition-colors">
                        {name}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black tracking-tight text-white/90">
                            {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
                        </span>
                        <span className="text-[0.6rem] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            {unit || ''}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                    {zScore != null && (
                        <div className={cn("text-[0.7rem] font-black tracking-tighter flex items-center gap-1", zColor)}>
                            <span className="opacity-50 text-[0.6rem] font-bold">Z</span>
                            {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}σ
                        </div>
                    )}
                    {change != null && (
                        <div className={cn(
                            "text-[0.6rem] font-bold flex items-center gap-0.5",
                            change > 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {change > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {Math.abs(change).toFixed(1)}% {changePeriod}
                        </div>
                    )}
                </div>
            </div>

            {/* Z-Score Horizontal Gauge */}
            {zScore != null && (
                <div className="relative pt-1 pb-2">
                    {/* Track */}
                    <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden relative">
                        {/* Center Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20 z-10" />

                        {/* Range Indicating Deviation */}
                        <div
                            className={cn("absolute h-full transition-all duration-700 ease-out z-0 opacity-40 blur-[1px]", zBgColor)}
                            style={{
                                left: zScore >= 0 ? '50%' : `${zPos}%`,
                                width: `${Math.abs(zPos - 50)}%`
                            }}
                        />
                        {/* Solid Bar */}
                        <div
                            className={cn("absolute h-full transition-all duration-1000 ease-out z-20", zBgColor)}
                            style={{
                                left: zScore >= 0 ? '50%' : `${zPos}%`,
                                width: `${Math.abs(zPos - 50)}%`
                            }}
                        />
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between mt-1 text-[0.45rem] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
                        <span>-3σ</span>
                        <span>Median</span>
                        <span>+3σ</span>
                    </div>

                    {/* Indicator Dot */}
                    <div
                        className={cn("absolute top-0 w-2 h-2 rounded-full border border-black shadow-lg transition-all duration-1000 ease-out z-30", zBgColor)}
                        style={{
                            left: `${zPos}%`,
                            transform: 'translateX(-50%)'
                        }}
                    />
                </div>
            )}

            {/* Info Tooltip Trigger */}
            <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="text-muted-foreground hover:text-white">
                                <Info className="w-3 h-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-950 border-white/10 p-2 text-[0.6rem] text-muted-foreground max-w-[150px]">
                            Z-score shows current value vs historical distribution. High deviation flags stress.
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};
