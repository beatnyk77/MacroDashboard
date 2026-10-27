import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, IndianRupee } from 'lucide-react';

const MetricValue: React.FC<{ label: string; value: number | undefined | null; unit: string; trend?: number }> = ({ label, value, unit, trend }) => (
    <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-terminal-dim mb-1.5">{label}</span>
        <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white font-mono tracking-heading">
                {value !== undefined && value !== null ? value.toFixed(1) : '---'}
            </span>
            <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">{unit}</span>
        </div>
        {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs font-semibold mt-1.5 uppercase tracking-wider", trend > 0 ? "text-emerald-400" : "text-rose-400")}>
                {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span>{Math.abs(trend)}% vs PREV</span>
            </div>
        )}
    </div>
);

export const IndiaMacroCard: React.FC = () => {
    const { data: metrics } = useQuery({
        queryKey: ['india_macro_card'],
        queryFn: async () => {
            const ids = ['IN_CPI_YOY', 'IN_UNEMPLOYMENT_RATE', 'IN_GDP_GROWTH_YOY', 'IN_IIP_GROWTH_YOY'];
            const { data } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .in('metric_id', ids);

            return ids.reduce((acc, id) => {
                acc[id] = data?.find(m => m.metric_id === id)?.value || 0;
                return acc;
            }, {} as Record<string, number>);
        }
    });

    if (!metrics) return null;

    const miseryIndex = (metrics['IN_CPI_YOY'] || 0) + (metrics['IN_UNEMPLOYMENT_RATE'] || 0);

    return (
        <div className="spa-card relative overflow-hidden group min-h-[400px] flex flex-col justify-between p-0 border-0">
            {/* ... */}
            {/* Background Layering */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.08] via-slate-950 to-emerald-500/[0.08] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />

            <div className="relative p-8 lg:p-10 flex flex-col h-full">

                {/* Header Section */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-lg shadow-orange-500/5">
                                <IndianRupee className="w-5 h-5 text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-heading">INDIA MACRO</h3>
                        </div>
                        <p className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                            MoSPI Institutional Feed
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-border backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider">Live Signal</span>
                    </div>
                </div>

                {/* Economic Misery Index - Hero Metric */}
                <div className="mb-10 p-6 lg:p-8 rounded-xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md relative overflow-hidden group/hero">
                    <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover/hero:opacity-[0.06] transition-opacity duration-700">
                        <Activity className="w-48 h-48 text-white rotate-12" />
                    </div>

                    <span className="text-xs font-semibold uppercase tracking-wider text-orange-400/60 block mb-4">
                        Economic Misery Index
                    </span>
                    <div className="flex items-baseline gap-4">
                        <span className={cn(
                            "text-6xl font-bold font-mono tracking-heading",
                            miseryIndex > 12 ? "text-rose-500" : (miseryIndex < 8 ? "text-emerald-500" : "text-amber-500")
                        )}>
                            {miseryIndex.toFixed(1)}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Aggregated</span>
                            <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">(CPI + Unemp)</span>
                        </div>
                    </div>
                </div>

                {/* Secondary Metrics Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                    <MetricValue
                        label="GDP Growth YOY"
                        value={metrics?.['IN_GDP_GROWTH_YOY']}
                        unit="%"
                    />
                    <MetricValue
                        label="Consumer Inflation"
                        value={metrics?.['IN_CPI_YOY']}
                        unit="%"
                    />
                    <MetricValue
                        label="Unemployment Rate"
                        value={metrics?.['IN_UNEMPLOYMENT_RATE']}
                        unit="%"
                    />
                    <MetricValue
                        label="Industrial Output"
                        value={metrics?.['IN_IIP_GROWTH_YOY']} // Fixed ID match
                        unit="%"
                    />
                </div>
            </div>

            {/* Premium Glow Border */}
            <div className="absolute inset-0 border border-border rounded-xl pointer-events-none group-hover:border-white/20 transition-colors duration-500" />
        </div>
    );
};
