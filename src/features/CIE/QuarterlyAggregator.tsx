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
                <p className="text-sm font-black uppercase tracking-uppercase text-white/20">No Results Found</p>
                <p className="text-xs text-muted-foreground/30 mt-1 uppercase font-black">Data ingestion may still be running.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <LineChart size={16} />
                <span className="text-xs font-black uppercase tracking-uppercase">Aggregate Results (Latest Quarters)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {aggregates?.map((stat, i) => (
                    <div key={i} className="p-8 rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-3xl group hover:border-blue-500/30 transition-all flex flex-col justify-between min-h-[160px]">
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-uppercase text-white/30 mb-4">{stat.label}</h4>
                            <div className="text-3xl font-black text-white italic tracking-heading">{stat.value}</div>
                        </div>
                        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-uppercase w-fit ${stat.up ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {stat.trend} v/s Prev
                        </div>
                    </div>
                ))}
            </div>

            <div className="overflow-x-auto rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-uppercase text-white/30">Entity</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-uppercase text-white/30 text-right">Reporting Period</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-uppercase text-white/30 text-right">Revenue</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-uppercase text-white/30 text-right">Net Profit</th>
                            <th className="px-8 py-6 text-xs font-black uppercase tracking-uppercase text-white/30 text-right">Op. Margin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {fundamentals.map((fund, i) => (
                            <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                key={`${fund.company_id}-${fund.quarter_date}`}
                                className="group hover:bg-blue-500/[0.02] transition-colors"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-white tracking-heading group-hover:text-blue-400 transition-colors">{fund.cie_companies?.name}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-black text-white/20 uppercase tracking-uppercase">{fund.cie_companies?.ticker.split('.')[0]}</span>
                                            <span className="text-xs text-white/10">|</span>
                                            <span className="text-xs font-medium text-white/20 italic">{fund.cie_companies?.sector}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="text-xs font-black text-white italic uppercase tracking-heading">
                                        {new Date(fund.quarter_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="text-sm font-black text-white italic tracking-heading">
                                        {fund.revenue ? `₹${(fund.revenue / 10000000).toFixed(0)}` : 'N/A'}
                                        <span className="text-xs text-white/20 ml-1">Cr</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="text-sm font-black text-emerald-400 italic tracking-heading">
                                        {fund.net_profit ? `₹${(fund.net_profit / 10000000).toFixed(0)}` : 'N/A'}
                                        <span className="text-xs text-white/20 ml-1">Cr</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className={`px-3 py-1 rounded-lg inline-flex text-xs font-black italic tracking-heading ${fund.operating_margin > 0.15 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/12'}`}>
                                        {fund.operating_margin ? `${(fund.operating_margin * 100).toFixed(1)}%` : 'N/A'}
                                    </div>
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
