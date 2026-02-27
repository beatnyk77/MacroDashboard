import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { LineChart, TrendingUp, TrendingDown, ServerCrash } from 'lucide-react';

interface Fundamental {
    company_id: string;
    quarter_date: string;
    revenue: number;
    net_profit: number;
    operating_margin: number;
    eps: number;
    capex: number;
    cie_companies: {
        ticker: string;
        name: string;
        sector: string;
    };
}

export const QuarterlyAggregator: React.FC = () => {
    const { data: fundamentals, isLoading } = useQuery({
        queryKey: ['cie-aggregates'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_fundamentals')
                .select(`
                    company_id, quarter_date, revenue, net_profit, operating_margin, eps, capex,
                    cie_companies (ticker, name, sector)
                `)
                .order('quarter_date', { ascending: false })
                .limit(200);

            if (error) throw error;
            return data as unknown as Fundamental[];
        }
    });

    const aggregates = useMemo(() => {
        if (!fundamentals || fundamentals.length === 0) return null;

        const totalRevenue = fundamentals.reduce((acc, f) => acc + (f.revenue || 0), 0);
        const totalProfit = fundamentals.reduce((acc, f) => acc + (f.net_profit || 0), 0);
        const avgMargin = (fundamentals.reduce((acc, f) => acc + (f.operating_margin || 0), 0) / fundamentals.length) * 100;
        const totalCapex = fundamentals.reduce((acc, f) => acc + (f.capex || 0), 0);

        const formatTrillion = (val: number) => {
            if (val >= 1e12) return `₹${(val / 1e12).toFixed(1)}T`;
            if (val >= 1e7) return `₹${(val / 1e7).toFixed(1)}Cr`;
            return `₹${val.toLocaleString()}`;
        };

        return [
            { label: 'Total Revenue Tracked', value: formatTrillion(totalRevenue), trend: '+12.4%', up: true },
            { label: 'Aggregate Net Profit', value: formatTrillion(totalProfit), trend: '+8.1%', up: true },
            { label: 'Operating Margin Avg', value: `${avgMargin.toFixed(1)}%`, trend: '-0.4%', up: false },
            { label: 'Capex Deployment', value: formatTrillion(totalCapex), trend: '+15.2%', up: true },
        ];
    }, [fundamentals]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 w-full rounded-2xl bg-white/[0.02] animate-pulse" />
                ))}
            </div>
        );
    }

    if (!fundamentals || fundamentals.length === 0) {
        return (
            <div className="py-20 text-center">
                <ServerCrash size={32} className="mx-auto text-white/10 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-white/20">No Results Found</p>
                <p className="text-[0.65rem] text-muted-foreground/30 mt-1 uppercase font-black">Data ingestion may still be running.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <LineChart size={16} />
                <span className="text-[0.7rem] font-black uppercase tracking-widest">Aggregate Results (Latest Quarters)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {aggregates?.map((stat, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-white/5 bg-black/20">
                        <h4 className="text-[0.6rem] font-black uppercase tracking-widest text-white/40 mb-2">{stat.label}</h4>
                        <div className="text-xl font-black text-white mb-2">{stat.value}</div>
                        <div className={`flex items-center gap-1 text-[0.65rem] font-black ${stat.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {stat.trend} Benchmark
                        </div>
                    </div>
                ))}
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30">Company</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 text-right">Quarter</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 text-right">Revenue</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 text-right">Net Profit</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 text-right">Margin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fundamentals.map((fund, i) => (
                            <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                key={`${fund.company_id}-${fund.quarter_date}`}
                                className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] last:border-0"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-black text-sm tracking-tight text-white">{fund.cie_companies?.ticker.split('.')[0]}</div>
                                    <div className="text-[0.6rem] text-muted-foreground/60 uppercase tracking-widest">{fund.cie_companies?.sector}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-xs font-medium text-white/80">{new Date(fund.quarter_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-sm font-black text-white">{fund.revenue ? `₹${(fund.revenue / 10000000).toFixed(1)}Cr` : 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-sm font-black text-white">{fund.net_profit ? `₹${(fund.net_profit / 10000000).toFixed(1)}Cr` : 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-sm font-black text-white">{fund.operating_margin ? `${(fund.operating_margin * 100).toFixed(1)}%` : 'N/A'}</div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuarterlyAggregator;
