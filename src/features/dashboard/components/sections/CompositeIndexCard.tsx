import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Info, Calculator, Database } from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export interface CompositeIndexCardProps {
    title: string;
    value: number | undefined | null;
    formula: string;
    sources: string[];
    status: 'safe' | 'warning' | 'danger' | 'neutral';
    trend?: number;
    history?: { date: string; value: number }[];
    icon?: React.ReactNode;
    description?: string;
    isLoading?: boolean;
    prefix?: string;
    suffix?: string;
    directionality?: string; // e.g., "Higher = better" or "Lower = better"
}

export const CompositeIndexCard: React.FC<CompositeIndexCardProps> = ({
    title,
    value,
    formula,
    sources,
    status,
    trend,
    history,
    icon,
    description,
    isLoading,
    prefix = '',
    suffix = '',
    directionality
}) => {
    const isNullValue = value === null || value === undefined || (typeof value === 'number' && isNaN(value));
    const isZeroWithNeutral = value === 0 && status === 'neutral';

    return (
        <div className={cn(
            "relative flex flex-col h-full min-h-[160px] p-5 rounded-2xl overflow-hidden group transition-all duration-300",
            "bg-slate-950/40 backdrop-blur-md border border-white/[0.08]",
            "hover:bg-slate-900/60 hover:border-white/[0.15] hover:shadow-xl hover:shadow-black/20",
            status === 'safe' && "hover:border-emerald-500/30",
            status === 'warning' && "hover:border-amber-500/30",
            status === 'danger' && "hover:border-rose-500/30"
        )}>
            {/* Status Bar Indicator (Top) */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-0.5 opacity-60 transition-opacity group-hover:opacity-100",
                status === 'safe' ? "bg-emerald-500" :
                    status === 'warning' ? "bg-amber-500" :
                        status === 'danger' ? "bg-rose-500" : "bg-slate-500"
            )} />

            {/* Background Noise/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="flex items-start gap-2.5">
                    {icon && (
                        <div className={cn(
                            "p-1.5 rounded-lg border bg-white/[0.03]",
                            status === 'safe' ? "text-emerald-400 border-emerald-500/20" :
                                status === 'warning' ? "text-amber-400 border-amber-500/20" :
                                    status === 'danger' ? "text-rose-400 border-rose-500/20" :
                                        "text-slate-400 border-white/10"
                        )}>
                            {icon}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <h4 className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-slate-300 leading-tight">
                                {title}
                            </h4>
                            {description && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info size={12} className="text-slate-500 hover:text-slate-300 transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[250px] bg-slate-900 border-slate-700 text-slate-300 text-xs">
                                            {description}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {sources.map(src => (
                                <span key={src} className="text-[0.6rem] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-0.5">
                                    <Database size={8} /> {src}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Value Area */}
            <div className="relative z-10 flex-grow flex flex-col justify-center">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-24 bg-white/10" />
                        <Skeleton className="h-3 w-16 bg-white/5" />
                    </div>
                ) : isNullValue ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-slate-500">Data pending</span>
                        <Info size={12} className="text-slate-600" />
                    </div>
                ) : isZeroWithNeutral ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-slate-600">Awaiting wiring</span>
                        <span className="text-[0.6rem] font-bold text-slate-600 uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-slate-700/30 bg-slate-800/30">Pending</span>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-2">
                        <span className={cn(
                            "text-3xl font-black font-mono tracking-tighter tabular-nums",
                            status === 'safe' ? "text-emerald-400" :
                                status === 'warning' ? "text-amber-400" :
                                    status === 'danger' ? "text-rose-400" : "text-slate-200"
                        )}>
                            {prefix}{value?.toFixed(1)}{suffix}
                        </span>
                        {trend !== undefined && (
                            <div className={cn(
                                "flex items-center gap-0.5 text-[0.65rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                                trend > 0 ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
                                    trend < 0 ? "text-rose-400 border-rose-500/20 bg-rose-500/5" :
                                        "text-slate-400 border-slate-500/20"
                            )}>
                                {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                <span>{Math.abs(trend).toFixed(1)}%</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: Sparkline & Formula */}
            <div className="relative z-10 flex items-end justify-between mt-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.05]">
                        <Calculator size={10} className="text-slate-500" />
                        <span className="text-[0.6rem] font-medium text-slate-400 font-mono">
                            {formula}
                        </span>
                    </div>
                    {directionality && (
                        <span className="text-[0.55rem] text-slate-500 italic px-2">
                            {directionality}
                        </span>
                    )}
                </div>

                {history && history.length > 0 && (
                    <div className="w-20 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Sparkline
                            data={history}
                            color={
                                status === 'safe' ? '#34d399' :
                                    status === 'warning' ? '#fbbf24' :
                                        status === 'danger' ? '#fb7185' : '#94a3b8'
                            }
                            height={32}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
