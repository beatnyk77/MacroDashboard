import React from 'react';
import { useGlobalRefiningData } from '@/hooks/useGlobalRefiningData';
import { Shield, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const FocusCard: React.FC<{
    country: string;
    correlation: number;
    utilization: number;
    median: number;
}> = ({ country, correlation, utilization, median }) => {
    const isOverMedian = utilization > median;

    return (
        <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-white uppercase tracking-tighter">{country} <span className="text-blue-500">Focus</span></h4>
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Shield size={16} className="text-blue-500" />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest block mb-2">Import Dependency Correlation</span>
                    <div className="flex items-end gap-2">
                        <div className="text-3xl font-black text-white italic leading-none">{correlation.toFixed(2)}</div>
                        <div className="text-xs font-bold text-emerald-400 uppercase pb-1 flex items-center gap-1">
                            <TrendingUp size={10} /> CRITICAL
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest">Cap Utilization</span>
                        <span className={cn(
                            "text-xs font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                            isOverMedian ? "text-blue-400 bg-blue-500/10" : "text-amber-400 bg-amber-500/10"
                        )}>
                            {isOverMedian ? "Above Median" : "Below Median"}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${utilization}%` }}
                                className="h-full bg-blue-500 shadow-[0_0_10px_#3B82F6]"
                            />
                        </div>
                        <div className="text-sm font-black text-white italic">{utilization}%</div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-xs font-bold text-muted-foreground/40 uppercase">Median: {median}%</span>
                        <BarChart3 size={12} className="text-white/20" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const RefiningFocusCards: React.FC<{ className?: string }> = ({ className }) => {
    const { data } = useGlobalRefiningData();

    const india = data?.facilities.find(f => f.country === 'India' && f.is_top_10);
    const china = data?.facilities.find(f => f.country === 'China' && f.is_top_10);

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
            <FocusCard
                country="China"
                correlation={china?.import_dependency_correlation || 0.88}
                utilization={china?.utilization_pct || 82}
                median={china?.historical_median_pct || 84}
            />
            <FocusCard
                country="India"
                correlation={india?.import_dependency_correlation || 0.94}
                utilization={india?.utilization_pct || 96}
                median={india?.historical_median_pct || 92}
            />
        </div>
    );
};
