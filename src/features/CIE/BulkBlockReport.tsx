import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
    Briefcase,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Filter,
    Search,
    ChevronRight,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

interface Deal {
    id: string;
    date: string;
    symbol: string;
    client_name: string;
    type: 'BUY' | 'SELL';
    deal_type: 'BULK' | 'BLOCK';
    quantity: number;
    price: number;
    equity_pct: number;
}

export const BulkBlockReport: React.FC = () => {
    const { data: deals, isLoading } = useQuery({
        queryKey: ['cie-bulk-block-deals'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_bulk_block_deals')
                .select('*')
                .order('date', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as Deal[];
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/40">Fetching Institutional Moves...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Briefcase size={80} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Total Deals (30D)</h4>
                        <div className="text-3xl font-black text-white">42</div>
                        <p className="text-xs text-emerald-400 font-bold mt-2">+12% vs Prev Month</p>
                    </div>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ArrowUpRight size={80} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Institutional Buy Value</h4>
                        <div className="text-3xl font-black text-emerald-400">₹2,480 Cr</div>
                        <p className="text-xs text-white/40 font-bold mt-2">Across 18 Nifty 200 Assets</p>
                    </div>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Filter size={80} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Max Conviction Deal</h4>
                        <div className="text-3xl font-black text-blue-400">1.8% Equity</div>
                        <p className="text-xs text-white/40 font-bold mt-2">Morgan Stanley in HDFC BANK</p>
                    </div>
                </div>
            </div>

            {/* Deal Table */}
            <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black tracking-tight text-white mb-1">Top Institutional Deals</h3>
                        <p className="text-[0.65rem] text-white/40 font-medium uppercase tracking-widest">Nifty 200 Bulk & Block Activity (Real-time)</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                            <input
                                type="text"
                                placeholder="Search symbol or client..."
                                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all w-64"
                            />
                        </div>
                        <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors">
                            <Filter size={14} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto text-current">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20">Date</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20">Symbol</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20">Client Name</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20">Type</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20">Deal Type</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20 text-right">Qty</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20 text-right">Price</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20 text-right">% Equity</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {deals?.map((deal) => (
                                <tr key={deal.id} className="group hover:bg-white/[0.01] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="text-white/20" />
                                            <span className="text-xs font-medium text-white/60">{format(new Date(deal.date), 'dd MMM yyyy')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-white hover:text-blue-400 transition-colors cursor-pointer">{deal.symbol}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-white/80">{deal.client_name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${deal.type === 'BUY'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'bg-rose-500/10 text-rose-400'
                                            }`}>
                                            {deal.type === 'BUY' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                                            {deal.type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[0.65rem] font-bold ${deal.deal_type === 'BLOCK' ? 'text-blue-400' : 'text-orange-400'}`}>
                                            {deal.deal_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs font-mono text-white/60">{deal.quantity.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs font-mono text-white/60">₹{deal.price.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${deal.type === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${Math.min(100, (deal.equity_pct || 0) * 50)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-white">{(deal.equity_pct || 0).toFixed(2)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-white/20 hover:text-white">
                                            <ExternalLink size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-white/20">Showing top 50 transactions</span>
                    <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                        View Historical Archive <ChevronRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};
