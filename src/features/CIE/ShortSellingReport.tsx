import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';

export const ShortSellingReport: React.FC = () => {
    const { data: companies, isLoading } = useQuery({
        queryKey: ['cie-companies-short-selling-heatmap'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_companies')
                .select('sector, short_interest_pct, short_interest_delta_30d');
            if (error) throw error;
            return data;
        }
    });

    const sectorStats = useMemo(() => {
        if (!companies) return [];
        const sectors: Record<string, { count: number, totalShort: number, totalDelta: number }> = {};

        companies.forEach(c => {
            if (!c.sector) return;
            if (!sectors[c.sector]) sectors[c.sector] = { count: 0, totalShort: 0, totalDelta: 0 };
            sectors[c.sector].count += 1;
            sectors[c.sector].totalShort += (c.short_interest_pct || 0);
            sectors[c.sector].totalDelta += (c.short_interest_delta_30d || 0);
        });

        return Object.entries(sectors).map(([name, stats]) => ({
            name,
            avgShort: stats.totalShort / stats.count,
            avgDelta: stats.totalDelta / stats.count,
            count: stats.count
        })).sort((a, b) => b.avgShort - a.avgShort);
    }, [companies]);

    if (isLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse bg-white/5 rounded-2xl" />)}
        </div>
    );

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
                            <div className={`p-2 rounded-lg ${sector.avgShort > 10 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {sector.avgShort > 10 ? <AlertTriangle size={16} /> : <ShieldAlert size={16} />}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[0.6rem] uppercase font-black tracking-widest text-white/30 mb-1">
                                    <span>Avg Short Interest</span>
                                    <span className={sector.avgShort > 10 ? 'text-rose-400' : 'text-emerald-400'}>
                                        {sector.avgShort.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${sector.avgShort > 15 ? 'bg-rose-600' : sector.avgShort > 10 ? 'bg-rose-400' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, sector.avgShort * 4)}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[0.6rem] uppercase font-black tracking-widest text-white/30 mb-1">
                                    <span>30D Momentum</span>
                                    <span className={sector.avgDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                        {sector.avgDelta > 0 ? '+' : ''}{sector.avgDelta.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${sector.avgDelta > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(100, Math.abs(sector.avgDelta) * 10)}%` }}
                                        />
                                    </div>
                                    {sector.avgDelta > 0 && <TrendingUp size={12} className="text-rose-400 animate-pulse" />}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[0.6rem] font-medium text-white/20">
                            <span>{sector.count} Companies Analyzed</span>
                            <div className="text-white/40 group-hover:text-rose-400 transition-colors">
                                Systemic Risk: {sector.avgShort > 15 ? 'HIGH' : sector.avgShort > 8 ? 'MODERATE' : 'LOW'}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
