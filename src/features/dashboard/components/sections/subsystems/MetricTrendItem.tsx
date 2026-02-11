import React from 'react';
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Info, Activity } from 'lucide-react';
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
    const zColor = absZ > 2.0 ? 'text-rose-500' : absZ > 1.2 ? 'text-amber-500' : 'text-emerald-500';
    const zBgColor = absZ > 2.0 ? 'bg-rose-500' : absZ > 1.2 ? 'bg-amber-500' : 'bg-emerald-500';

    const getRegimeDescription = (z: number) => {
        const abs = Math.abs(z);
        if (abs > 2.0) return "EXTREME REGIME: Systemic stress or bubble conditions. High probability of mean reversion or structural breaking.";
        if (abs > 1.2) return "ALERT REGIME: Significant deviation from historical norm. Transition phase active.";
        return "NORMAL REGIME: System operating within standard historical parameters.";
    };

    return (
        <div className="group/item relative px-4 py-5 rounded-2xl transition-all duration-500 hover:bg-white/[0.04] border border-transparent hover:border-white/5 flex flex-col gap-4">
            {/* Top Row: Name and Value */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em] group-hover/item:text-blue-400/60 transition-colors">
                        {name}
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black tracking-tighter text-white/90 tabular-nums">
                            {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
                        </span>
                        <span className="text-[0.55rem] font-black text-muted-foreground/30 uppercase tracking-widest">
                            {unit || ''}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {zScore != null && (
                        <div className={cn("px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[0.7rem] font-black tracking-tight flex items-center gap-1.5 shadow-inner", zColor)}>
                            <span className="opacity-40 text-[0.55rem] font-black uppercase tracking-tighter">STAT-Z</span>
                            {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}σ
                        </div>
                    )}
                    {change != null && (
                        <div className={cn(
                            "text-[0.65rem] font-bold flex items-center gap-1",
                            change > 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(change).toFixed(1)}% <span className="text-[0.55rem] opacity-40 uppercase">{changePeriod}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Z-Score Horizontal Gauge */}
            {zScore != null && (
                <div className="relative pt-1 pb-2">
                    {/* Track */}
                    <div className="h-2 w-full bg-slate-900/60 rounded-full border border-white/5 overflow-hidden relative shadow-inner">
                        {/* Critical Zones Overlay */}
                        <div className="absolute left-0 top-0 bottom-0 w-[16.6%] bg-rose-500/5 border-r border-white-[0.03]" /> {/* -3 to -2 */}
                        <div className="absolute right-0 top-0 bottom-0 w-[16.6%] bg-rose-500/5 border-l border-white-[0.03]" /> {/* +2 to +3 */}

                        {/* Center Line (Median) */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/10 z-10 shadow-[0_0_8px_rgba(255,255,255,0.1)]" />

                        {/* Deviation Bar */}
                        <div
                            className={cn(
                                "absolute h-full transition-all duration-1000 ease-out z-20 shadow-[0_0_12px_rgba(0,0,0,0.5)]",
                                zBgColor,
                                absZ > 2.0 && "animate-pulse"
                            )}
                            style={{
                                left: zScore >= 0 ? '50%' : `${zPos}%`,
                                width: `${Math.abs(zPos - 50)}%`,
                                filter: `brightness(${1.2 + (absZ * 0.1)})`
                            }}
                        />
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between mt-1.5 px-0.5 text-[0.5rem] font-black text-white/10 uppercase tracking-[0.25em]">
                        <span className={cn(zScore < -2 && "text-rose-500/40")}>Tail</span>
                        <span>Median</span>
                        <span className={cn(zScore > 2 && "text-rose-500/40")}>Tail</span>
                    </div>

                    {/* Indicator Dot */}
                    <div
                        className={cn(
                            "absolute -top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-1000 ease-out z-30",
                            zBgColor
                        )}
                        style={{
                            left: `${zPos}%`,
                            transform: 'translateX(-50%)',
                            boxShadow: `0 0 20px ${zScore > 2 ? 'rgba(244,63,94,0.4)' : zScore < -2 ? 'rgba(244,63,94,0.4)' : 'transparent'}`
                        }}
                    >
                        <div className="w-full h-full rounded-full bg-white/20 animate-ping opacity-20" />
                    </div>
                </div>
            )}

            {/* Info Tooltip Trigger */}
            <div className="absolute top-3 right-3 opacity-0 group-hover/item:opacity-100 transition-all duration-300 translate-x-2 group-hover/item:translate-x-0">
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="text-muted-foreground/40 hover:text-blue-400 p-1 rounded-lg hover:bg-white/5 transition-colors">
                                <Info className="w-3.5 h-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="end" className="bg-slate-950/90 backdrop-blur-xl border-white/10 p-4 shadow-2xl overflow-hidden max-w-[240px]">
                            <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
                            <div className="relative space-y-2">
                                <div className="text-[0.6rem] font-black uppercase text-blue-400 tracking-widest border-b border-white/5 pb-1 flex items-center justify-between">
                                    <span>Engine Interpretation</span>
                                    <span className={cn("text-[0.5rem] px-1 rounded", zScore && Math.abs(zScore) > 2 ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500')}>
                                        {zScore && Math.abs(zScore) > 2 ? 'High Impact' : 'Monitoring'}
                                    </span>
                                </div>
                                <p className="text-[0.7rem] font-medium leading-relaxed text-white/80">
                                    {zScore != null ? getRegimeDescription(zScore) : 'Data currently under ingestion.'}
                                </p>
                                <div className="pt-1 flex items-center gap-2 text-[0.6rem] text-muted-foreground italic font-medium">
                                    <Activity className="w-3 h-3" />
                                    Model: Statistical Z-Score (12M Window)
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};
