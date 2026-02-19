import React from 'react';
import { useKalshiFomc, KalshiFomcProbability } from '@/hooks/useKalshiFomc';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Target, Zap, Info, ArrowRightCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const KalshiFedFundsCard: React.FC = () => {
    const { data, isLoading } = useKalshiFomc();

    if (isLoading) return <Skeleton className="h-[200px] w-full rounded-2xl" />;
    if (!data || data.length === 0) return null;

    // Group by meeting date (take the nearest one)
    const nearestMeetingDate = data[0].meeting_date;
    const meetingOutcomes = data.filter(d => d.meeting_date === nearestMeetingDate);

    const getOutcomeColor = (outcome: string) => {
        const lower = outcome.toLowerCase();
        if (lower.includes('hike')) return 'text-rose-400 bg-rose-400/10';
        if (lower.includes('cut')) return 'text-emerald-400 bg-emerald-400/10';
        return 'text-blue-400 bg-blue-400/10';
    };

    const getBarColor = (outcome: string) => {
        const lower = outcome.toLowerCase();
        if (lower.includes('hike')) return '#fb7185';
        if (lower.includes('cut')) return '#34d399';
        return '#60a5fa';
    };

    return (
        <Card className="p-8 bg-white/[0.02] border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] relative group animate-in fade-in duration-700">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] -mr-20 -mt-20 opacity-[0.03] bg-blue-500/20" />

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                <Target size={18} />
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tight">
                                Fed Funds Prediction Market
                            </h3>
                        </div>
                        <p className="text-[0.65rem] text-muted-foreground/60 font-medium uppercase tracking-[0.2em]">
                            Implied Probabilities for {new Date(nearestMeetingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} FOMC
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
                        <Zap size={14} className="text-amber-400" />
                        <span className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-widest">Live Signals</span>
                    </div>
                </div>

                {/* Probability Rail */}
                <div className="space-y-6">
                    <div className="flex h-12 w-full rounded-2xl overflow-hidden bg-white/[0.05] border border-white/5 p-1 gap-1">
                        {meetingOutcomes.map((obs) => (
                            <TooltipProvider key={obs.ticker}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="h-full transition-all duration-500 hover:brightness-125 cursor-help first:rounded-l-xl last:rounded-r-xl"
                                            style={{
                                                width: `${obs.probability}%`,
                                                backgroundColor: getBarColor(obs.outcome),
                                                opacity: obs.probability > 5 ? 1 : 0.4
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContentSide obs={obs} />
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {meetingOutcomes.map((obs) => (
                            <div key={obs.ticker} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group/item">
                                <div>
                                    <div className={cn(
                                        "inline-flex items-center px-1.5 py-0.5 rounded-md text-[0.55rem] font-black uppercase tracking-widest mb-2",
                                        getOutcomeColor(obs.outcome)
                                    )}>
                                        {obs.outcome.split('-')[0].trim()}
                                    </div>
                                    <div className="text-2xl font-black text-white tabular-nums">
                                        {obs.probability}%
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-tighter">Volume</span>
                                        <span className="text-[0.65rem] font-black text-white/40">{obs.volume_contracts.toLocaleString()} contracts</span>
                                    </div>
                                    {obs.prev_day_probability !== null && (
                                        <DeltaBadge current={obs.probability} prev={obs.prev_day_probability} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer attribution */}
                <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Info size={14} className="text-muted-foreground/40" />
                        <span className="text-[0.6rem] font-medium text-muted-foreground/40 italic">
                            Per FEDS 2026-010, prediction prices often precede survey-based shifts.
                        </span>
                    </div>
                    <a
                        href="https://kalshi.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 group/link"
                    >
                        <span className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-widest group-hover/link:text-primary transition-colors">Powered by Kalshi</span>
                        <ArrowRightCircle size={14} className="text-muted-foreground/20 group-hover/link:text-primary transition-colors" />
                    </a>
                </div>
            </div>
        </Card>
    );
};

const TooltipContentSide = ({ obs }: { obs: KalshiFomcProbability }) => (
    <TooltipContent className="bg-slate-950 border-white/10 p-4 shadow-2xl rounded-xl">
        <div className="space-y-2">
            <div className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">MARKET OUTCOME</div>
            <div className="text-sm font-black text-white">{obs.outcome}</div>
            <div className="flex gap-4 pt-2">
                <div>
                    <span className="text-[0.55rem] font-bold text-muted-foreground/40 block">PROBABILITY</span>
                    <span className="text-xs font-black text-primary">{obs.probability}%</span>
                </div>
                <div>
                    <span className="text-[0.55rem] font-bold text-muted-foreground/40 block">TICKER</span>
                    <span className="text-[0.6rem] font-mono text-white/50">{obs.ticker}</span>
                </div>
            </div>
        </div>
    </TooltipContent>
);

const DeltaBadge = ({ current, prev }: { current: number, prev: number }) => {
    const delta = current - prev;
    if (Math.abs(delta) < 0.1) return null;

    const isPositive = delta > 0;
    return (
        <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[0.6rem] font-black",
            isPositive ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
        )}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(delta).toFixed(1)}%
        </div>
    );
};
