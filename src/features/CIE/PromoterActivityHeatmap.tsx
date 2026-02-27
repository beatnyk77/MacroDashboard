import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export const PromoterActivityHeatmap: React.FC = () => {
    const { data: companies, isLoading } = useQuery({
        queryKey: ['cie-companies-promoter-heatmap'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_companies')
                .select('sector, promoter_pledge_pct, insider_buy_sell_net');
            if (error) throw error;
            return data;
        }
    });

    const sectorStats = useMemo(() => {
        if (!companies) return [];
        const sectors: Record<string, { count: number, totalPledge: number, totalInsider: number }> = {};

        companies.forEach(c => {
            if (!c.sector) return;
            if (!sectors[c.sector]) sectors[c.sector] = { count: 0, totalPledge: 0, totalInsider: 0 };
            sectors[c.sector].count += 1;
            sectors[c.sector].totalPledge += (c.promoter_pledge_pct || 0);
            sectors[c.sector].totalInsider += (c.insider_buy_sell_net || 0);
        });

        return Object.entries(sectors).map(([name, stats]) => ({
            name,
            avgPledge: stats.totalPledge / stats.count,
            netInsider: stats.totalInsider,
            count: stats.count
        })).sort((a, b) => b.netInsider - a.netInsider);
    }, [companies]);

    if (isLoading) return <div className="h-64 animate-pulse bg-white/5 rounded-2xl" />;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectorStats.map((sector) => (
                    <motion.div
                        key={sector.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 rounded-2xl border border-white/5 bg-black/20 hover:bg-black/40 transition-all cursor-default group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/50">{sector.name}</h3>
                            <div className={`p-2 rounded-lg ${sector.netInsider > 0 ? 'bg-emerald-500/10 text-emerald-400' : sector.netInsider < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-white/40'}`}>
                                {sector.netInsider > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[0.6rem] uppercase font-black tracking-widest text-white/30 mb-1">
                                    <span>Insider Net (Cr)</span>
                                    <span className={sector.netInsider >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                        {sector.netInsider > 0 ? '+' : ''}{sector.netInsider.toFixed(1)}
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${sector.netInsider >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                        style={{ width: `${Math.min(100, Math.abs(sector.netInsider) / 5)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[0.6rem] uppercase font-black tracking-widest text-white/30 mb-1">
                                    <span>Avg Pledging (%)</span>
                                    <span className={sector.avgPledge > 20 ? 'text-rose-400' : sector.avgPledge > 10 ? 'text-amber-400' : 'text-emerald-400'}>
                                        {sector.avgPledge.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${sector.avgPledge > 20 ? 'bg-rose-500' : sector.avgPledge > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, sector.avgPledge * 2)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[0.6rem] font-medium text-white/20">
                            <span>{sector.count} Companies Monitored</span>
                            <div className="flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                                View Leaders <Activity size={10} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
