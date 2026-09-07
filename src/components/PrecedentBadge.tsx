import React from 'react';
import { History, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getPrecedentById } from '@/config/precedentsConfig';
import { TrailLink } from '@/components/TrailLink';

interface PrecedentBadgeProps {
    precedentId?: string;
    metricId?: string;
    cohortRank?: {
        cohort: string;
        percentile: number;
    };
    className?: string;
}

export const PrecedentBadge: React.FC<PrecedentBadgeProps> = ({
    precedentId,
    metricId,
    cohortRank,
    className
}) => {
    const precedent = precedentId ? getPrecedentById(precedentId) : null;

    if (!precedent && !cohortRank) return null;

    return (
        <div className={cn("inline-flex items-center gap-1.5", className)}>
            {precedent && (
                <TooltipProvider delayDuration={150}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TrailLink
                                to={`/labs/macro-precedents?metric=${metricId || ''}&precedent=${precedent.id}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors"
                            >
                                <History size={10} className="text-blue-400" />
                                <span>Analog: {precedent.shortLabel}</span>
                            </TrailLink>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] p-2.5 bg-slate-950 border border-white/10 text-xs shadow-2xl">
                            <div className="font-bold text-white mb-1">{precedent.name}</div>
                            <div className="text-muted-foreground text-[11px] leading-relaxed mb-2">
                                {precedent.summary}
                            </div>
                            <div className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                                Click to open T=0 comparative lab &rarr;
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {cohortRank && (
                <TooltipProvider delayDuration={150}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                <TrendingUp size={10} className="text-purple-400" />
                                <span>{cohortRank.cohort}: {cohortRank.percentile}th %ile</span>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent className="p-2 bg-slate-950 border border-white/10 text-xs shadow-2xl">
                            <span className="text-muted-foreground">
                                Sits at the <strong>{cohortRank.percentile}th percentile</strong> of the {cohortRank.cohort} sovereign cohort.
                            </span>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};
