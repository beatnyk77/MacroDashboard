import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, IndianRupee } from 'lucide-react';

// Design Principle: Distinctive Typography & Bold Aesthetic
// Using a rich gradient and glassmorphism for the card

const MetricValue: React.FC<{ label: string; value: number; unit: string; trend?: number }> = ({ label, value, unit, trend }) => (
    <div className="flex flex-col">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/50 mb-1">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono tracking-tighter">
                {value.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-white/60">{unit}</span>
        </div>
        {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-[0.6rem] font-bold mt-1", trend > 0 ? "text-emerald-400" : "text-rose-400")}>
                {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span>{Math.abs(trend)}% vs last</span>
            </div>
        )}
    </div>
);

export const IndiaMacroCard: React.FC = () => {
    // Fetch specifically India metrics
    const { data: metrics } = useQuery({
        queryKey: ['india_macro_card'],
        queryFn: async () => {
            const ids = ['IN_CPI_YOY', 'IN_UNEMPLOYMENT_RATE', 'IN_GDP_GROWTH_YOY', 'IN_IIP_YOY'];
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
        <Card className="relative overflow-hidden border-0 group h-full">
            {/* Background Gradient - India Flag Inspired but Dark/Premium */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-slate-950 to-emerald-500/10 opacity-100 transition-opacity duration-500" />

            {/* Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="relative p-6 flex flex-col h-full justify-between">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🇮🇳</span>
                            <h3 className="font-black text-lg text-white tracking-tight">INDIA MACRO</h3>
                        </div>
                        <p className="text-[0.65rem] font-medium text-white/40 uppercase tracking-widest">
                            MoSPI Official Data
                        </p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg backdrop-blur-md border border-white/10">
                        <IndianRupee className="w-4 h-4 text-orange-400" />
                    </div>
                </div>

                {/* Primary Metric - Misery Index */}
                <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/5 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Activity size={64} />
                    </div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-widest text-orange-300 block mb-2">
                        Economic Misery Index
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className={cn(
                            "text-4xl font-black font-mono tracking-tighter",
                            miseryIndex > 12 ? "text-rose-500" : (miseryIndex < 8 ? "text-emerald-500" : "text-amber-500")
                        )}>
                            {miseryIndex.toFixed(1)}
                        </span>
                        <span className="text-sm text-white/50 font-medium">
                            (CPI + Unemp)
                        </span>
                    </div>
                </div>

                {/* Grid of Core Metrics */}
                <div className="grid grid-cols-2 gap-6">
                    <MetricValue
                        label="GDP Growth"
                        value={metrics['IN_GDP_GROWTH_YOY']}
                        unit="%"
                    />
                    <MetricValue
                        label="Inflation (CPI)"
                        value={metrics['IN_CPI_YOY']}
                        unit="%"
                    />
                    <MetricValue
                        label="Unemployment"
                        value={metrics['IN_UNEMPLOYMENT_RATE']}
                        unit="%"
                    />
                    <MetricValue
                        label="Industrial Prod."
                        value={metrics['IN_IIP_YOY']}
                        unit="%"
                    />
                </div>
            </div>

            {/* Border Gradient */}
            <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none" />
        </Card>
    );
};
