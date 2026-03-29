import React from 'react';
import { useGlobalRefiningData } from '@/hooks/useGlobalRefiningData';
import { Zap, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
        <div className={cn("p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-sm flex flex-col h-full", className)}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <ArrowRightLeft size={14} /> Regional Imbalance
                    </h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight mt-1">West vs East Capacity Drift</p>
                </div>
                {isBreach && (
                    <div className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-500 text-xs font-black uppercase tracking-widest animate-pulse">
                        Critical Breach
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8">
                {/* Visual Gauge */}
                <div className="relative h-4 bg-white/5 rounded-full overflow-hidden flex">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${westPct}%` }}
                        className="h-full bg-slate-500 relative"
                    >
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-white/40 uppercase">West</div>
                    </motion.div>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${eastPct}%` }}
                        className="h-full bg-blue-500 shadow-[0_0_15px_#3B82F6] relative"
                    >
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black text-white uppercase">East</div>
                    </motion.div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest block mb-1">West Closures</span>
                            <div className="text-lg font-black text-rose-500 italic">
                                {west?.closure_count || 0} <span className="text-xs not-italic opacity-40">Assets</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-right">
                            <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest block mb-1">Avg Utilization</span>
                            <div className="text-lg font-black text-white italic">{Math.round(west?.avg_utilization || 0)}%</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                            <span className="text-xs font-black text-blue-500/50 uppercase tracking-widest block mb-1">East Expansion</span>
                            <div className="text-lg font-black text-blue-400 italic">
                                +{east?.expansion_count || 0} <span className="text-xs not-italic opacity-40">Active</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-right">
                            <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest block mb-1">Avg Utilization</span>
                            <div className="text-lg font-black text-emerald-400 italic">{Math.round(east?.avg_utilization || 0)}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <Zap size={14} className="text-blue-500" />
                <p className="text-xs text-white/50 font-bold uppercase leading-tight italic">
                    East dominance accelerated by {east?.total_capacity ? (east.total_capacity / (west?.total_capacity || 1)).toFixed(1) : 1}x capacity multiplier.
                </p>
            </div>
        </div>
    );
};
