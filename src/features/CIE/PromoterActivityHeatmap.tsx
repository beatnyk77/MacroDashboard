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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sectorStats.map((sector, i) => (
                    <motion.div
                        key={sector.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-8 rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-3xl hover:border-blue-500/30 transition-all cursor-default group flex flex-col justify-between min-h-[280px]"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{sector.name}</h3>
                                    <div className="text-xs font-black text-white/20 uppercase tracking-[0.2em] mt-1">{sector.count} Entities Monitored</div>
                                </div>
                                <div className={`p-3 rounded-2xl border ${sector.netInsider > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : sector.netInsider < 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-white/40 border-white/12'}`}>
                                    {sector.netInsider > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-xs font-black uppercase tracking-widest text-white/30">Insider Net Velocity</span>
                                        <span className={`text-lg font-black italic tracking-tighter ${sector.netInsider >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {sector.netInsider > 0 ? '+' : ''}{sector.netInsider.toFixed(1)}
                                            <span className="text-xs ml-1 opacity-40">Cr</span>
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, Math.abs(sector.netInsider) / 5)}%` }}
                                            className={`h-full ${sector.netInsider >= 0 ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-xs font-black uppercase tracking-widest text-white/30">Avg Pledging Intensity</span>
                                        <span className={`text-lg font-black italic tracking-tighter ${sector.avgPledge > 20 ? 'text-rose-400' : sector.avgPledge > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {sector.avgPledge.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, sector.avgPledge * 2.5)}%` }}
                                            className={`h-full ${sector.avgPledge > 20 ? 'bg-rose-500' : sector.avgPledge > 10 ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
                            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/20 group-hover:text-blue-400 transition-all">
                                Analyze Leaders <Activity size={14} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
