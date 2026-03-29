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
                .select('sector, short_interest_pct, momentum_30d_pct, cie_macro_signals(cds_spread_bps, liquidity_transmission_lag)');
            if (error) throw error;
            return data;
        }
    });

    const sectorStats = useMemo(() => {
        if (!companies) return [];
        const sectors: Record<string, { count: number, totalShort: number, totalMomentum: number, totalCDS: number, totalLiq: number }> = {};

        companies.forEach((c: any) => {
            if (!c.sector) return;
            if (!sectors[c.sector]) sectors[c.sector] = { count: 0, totalShort: 0, totalMomentum: 0, totalCDS: 0, totalLiq: 0 };

            const signal = c.cie_macro_signals?.[0] || {};
            sectors[c.sector].count += 1;
            sectors[c.sector].totalShort += (c.short_interest_pct || 0);
            sectors[c.sector].totalMomentum += (c.momentum_30d_pct || 0);
            sectors[c.sector].totalCDS += (signal.cds_spread_bps || 75);
            sectors[c.sector].totalLiq += (signal.liquidity_transmission_lag || 30);
        });

        return Object.entries(sectors).map(([name, stats]) => ({
            name,
            avgShort: stats.totalShort / stats.count,
            avgMomentum: stats.totalMomentum / stats.count,
            avgCDS: stats.totalCDS / stats.count,
            avgLiq: stats.totalLiq / stats.count,
            count: stats.count
        })).sort((a, b) => b.avgShort - a.avgShort);
    }, [companies]);

    const getSystemicRiskLabel = (avgShort: number, avgCDS: number, avgLiq: number) => {
        // Composite risk score: Weighted average of Short (40%), CDS (30%), Liquidity (30%)
        // Normalized: Short (base 10%), CDS (base 75bps), Liq (base 40)
        const shortRisk = Math.min(100, (avgShort / 20) * 100);
        const cdsRisk = Math.min(100, ((avgCDS - 75) / 100) * 100);
        const liqRisk = Math.min(100, (avgLiq / 80) * 100);

        const composite = (shortRisk * 0.4) + (cdsRisk * 0.3) + (liqRisk * 0.3);

        if (composite > 60) return 'HIGH';
        if (composite > 30) return 'MODERATE';
        return 'LOW';
    };

    if (isLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse bg-white/5 rounded-2xl" />)}
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sectorStats.map((sector, i) => {
                    const riskLabel = getSystemicRiskLabel(sector.avgShort, sector.avgCDS, sector.avgLiq);

                    return (
                        <motion.div
                            key={sector.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-8 rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-3xl hover:border-blue-500/30 transition-all cursor-default group flex flex-col justify-between min-h-[300px]"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{sector.name}</h3>
                                        <div className="text-xs font-black text-white/20 uppercase tracking-[0.2em] mt-1">{sector.count} Entities Analyzed</div>
                                    </div>
                                    <div className={`p-3 rounded-2xl border ${riskLabel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : riskLabel === 'MODERATE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                        {riskLabel === 'HIGH' ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-xs font-black uppercase tracking-widest text-white/30">Short Intensity</span>
                                            <span className={`text-lg font-black italic tracking-tighter ${sector.avgShort > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {sector.avgShort.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, sector.avgShort * 4)}%` }}
                                                className={`h-full ${sector.avgShort > 15 ? 'bg-rose-600' : sector.avgShort > 10 ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-emerald-500'}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-xs font-black uppercase tracking-widest text-white/30">30D Momentum Pulse</span>
                                            <span className={`text-lg font-black italic tracking-tighter ${sector.avgMomentum > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {sector.avgMomentum > 0 ? '+' : ''}{sector.avgMomentum.toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, Math.abs(sector.avgMomentum) * 10)}%` }}
                                                    className={`h-full ${sector.avgMomentum > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500'}`}
                                                />
                                            </div>
                                            {sector.avgMomentum > 0 && <TrendingUp size={16} className="text-emerald-400/60" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center">
                                <div className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border ${riskLabel === 'HIGH' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : riskLabel === 'MODERATE' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                                    Systemic Risk: {riskLabel}
                                </div>
                                <button className="text-xs font-black uppercase tracking-widest text-white/20 hover:text-blue-400 transition-colors">
                                    Details
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ShortSellingReport;
