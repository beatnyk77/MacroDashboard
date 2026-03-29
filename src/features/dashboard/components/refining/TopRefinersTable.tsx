import React from 'react';
import { useGlobalRefiningData } from '@/hooks/useGlobalRefiningData';
import { Trophy, ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TopRefinersTable: React.FC<{ className?: string }> = ({ className }) => {
    const { data } = useGlobalRefiningData();

    // Sort by capacity and take top 10
    const topRefiners = [...(data?.facilities || [])]
        .sort((a, b) => b.capacity_mbpd - a.capacity_mbpd)
        .slice(0, 10);

    return (
        <div className={cn("p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-sm flex flex-col", className)}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <Trophy size={14} /> Refining Alpha Ranking
                    </h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight mt-1">Top 10 Global Assets by Scale</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar -mx-2 px-2">
                <table className="w-full text-[0.65rem] font-bold uppercase tracking-wider">
                    <thead>
                        <tr className="text-muted-foreground/40 border-b border-white/5">
                            <th className="pb-3 text-left font-black">Rank</th>
                            <th className="pb-3 text-left font-black">Facility / Node</th>
                            <th className="pb-3 text-right font-black">Cap (MBPD)</th>
                            <th className="pb-3 text-right font-black text-blue-500/60">Util%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {topRefiners.map((fac, i) => (
                            <tr key={fac.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 text-white/20 font-mono">{(i + 1).toString().padStart(2, '0')}</td>
                                <td className="py-3">
                                    <div className="flex flex-col">
                                        <span className="text-white group-hover:text-blue-400 transition-colors">{fac.facility_name}</span>
                                        <span className="text-[0.55rem] text-muted-foreground/60">{fac.country}</span>
                                    </div>
                                </td>
                                <td className="py-3 text-right text-white italic">{fac.capacity_mbpd.toFixed(2)}</td>
                                <td className="py-3 text-right">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded",
                                        fac.utilization_pct > 90 ? "text-emerald-400 bg-emerald-500/10" : "text-white/60 bg-white/5"
                                    )}>
                                        {fac.utilization_pct}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-xs text-muted-foreground uppercase">Market Consolidation: HIGH</span>
                </div>
                <button className="text-xs text-blue-500/60 hover:text-blue-400 font-black uppercase flex items-center gap-1 transition-colors">
                    Detailed Report <ArrowUpRight size={10} />
                </button>
            </div>
        </div>
    );
};
