import React from 'react';
import { useGlobalRefiningData } from '@/hooks/useGlobalRefiningData';
import { Zap, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m } from 'framer-motion';

export const RegionalImbalanceGauge: React.FC<{ className?: string }> = ({ className }) => {
    const { data } = useGlobalRefiningData();

    const imbalance = data?.regionalImbalance || [];
    const west = imbalance.find(r => r.region === 'West');
    const east = imbalance.find(r => r.region === 'East');

    const totalCap = (west?.total_capacity || 0) + (east?.total_capacity || 0);
    const westPct = totalCap > 0 ? ((west?.total_capacity || 0) / totalCap) * 100 : 50;
    const eastPct = 100 - westPct;

    const isBreach = Math.abs(westPct - eastPct) > 30;

    return (
        <div className={cn("p-6 rounded-xl bg-background/40 border border-border backdrop-blur-sm flex flex-col h-full", className)}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-semibold text-blue-500 uppercase tracking-wider flex items-center gap-2">
                        <ArrowRightLeft size={14} /> Regional Imbalance
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-heading mt-1">West vs East Capacity Drift</p>
                </div>
                {isBreach && (
                    <div className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-500 text-xs font-semibold uppercase tracking-wider animate-pulse">
                        Critical Breach
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8">
                {/* Visual Gauge */}
                <div className="relative h-4 bg-white/5 rounded-full overflow-hidden flex">
                    <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${westPct}%` }}
                        className="h-full bg-slate-500 relative"
                    >
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-terminal-dim uppercase">West</div>
                    </m.div>
                    <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${eastPct}%` }}
                        className="h-full bg-blue-500 shadow-[0_0_15px_theme(colors.blue.500)] relative"
                    >
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white uppercase">East</div>
                    </m.div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
                            <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider block mb-1">West Closures</span>
                            <div className="text-lg font-bold text-rose-500 italic">
                                {west?.closure_count || 0} <span className="text-xs not-italic opacity-40">Assets</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-border text-right">
                            <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider block mb-1">Avg Utilization</span>
                            <div className="text-lg font-bold text-white italic">{Math.round(west?.avg_utilization || 0)}%</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <span className="text-xs font-semibold text-blue-500/50 uppercase tracking-wider block mb-1">East Expansion</span>
                            <div className="text-lg font-bold text-blue-400 italic">
                                +{east?.expansion_count || 0} <span className="text-xs not-italic opacity-40">Active</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-border text-right">
                            <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider block mb-1">Avg Utilization</span>
                            <div className="text-lg font-bold text-emerald-400 italic">{Math.round(east?.avg_utilization || 0)}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-border">
                <Zap size={14} className="text-blue-500" />
                <p className="text-xs text-white/50 font-semibold uppercase leading-tight italic">
                    East dominance accelerated by {east?.total_capacity ? (east.total_capacity / (west?.total_capacity || 1)).toFixed(1) : 1}x capacity multiplier.
                </p>
            </div>
        </div>
    );
};
