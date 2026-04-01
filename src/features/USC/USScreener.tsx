import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';


export const USScreener: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: companies, isLoading } = useQuery({
        queryKey: ['us-screener-data'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_companies')
                .select('*, us_fundamentals(*)');

            if (error) throw error;

            // Map latest fundamentals to each company
            return data.map((c: any) => {
                const latest = [...(c.us_fundamentals || [])].sort((a, b) =>
                    new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
                )[0] || {};
                return { ...c, latest };
            }).sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
        }
    });

    const filtered = companies?.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ticker.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-20 w-full rounded-2xl bg-white/[0.02] border border-white/5" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex gap-4 p-6 rounded-2xl bg-white/[0.01] border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-white/5" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-white/10 rounded w-1/3" />
                                <div className="h-3 bg-white/5 rounded w-1/4" />
                            </div>
                            <div className="w-24 h-4 bg-white/5 rounded self-center" />
                            <div className="w-24 h-4 bg-white/5 rounded self-center" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Ticker or Company Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/40 border border-white/12 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-white/20 font-medium"
                    />
                </div>
                <button className="px-6 py-4 rounded-2xl bg-white/5 border border-white/12 text-blue-400 hover:bg-white/10 transition-colors">
                    <Filter size={20} />
                </button>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-black/40 overflow-hidden">
                <table className="w-full text-left order-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                            <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-white/20">Company</th>
                            <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-white/20 text-right">P/E</th>
                            <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-white/20 text-right">P/B</th>
                            <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-white/20 text-right">EV/EBITDA</th>
                            <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-white/20 text-right text-emerald-400/80">ROE</th>
                            <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-white/20 text-right">OP Margin</th>
                            <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-white/20 text-right text-blue-400/80">FCF Yield</th>
                            <th className="px-6 py-6 text-xs font-black uppercase tracking-widest text-white/20 text-right">Debt/Eq</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {filtered?.map((c: any) => (
                            <tr key={c.id} className="group hover:bg-blue-500/[0.02] transition-colors">
                                <td className="px-6 py-6">
                                    <Link to={`/us-equities/equity/${c.ticker}`} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-[0.7rem] text-blue-400/80 tracking-tighter shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                            {c.ticker}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{c.name}</div>
                                            <div className="text-[0.6rem] font-bold text-white/20 uppercase tracking-widest mt-0.5">{c.sector}</div>
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <span className="text-sm font-black italic text-white/80">{c.latest.pe_ratio?.toFixed(1) || '—'}</span>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <span className="text-sm font-bold text-white/60">{c.latest.pb_ratio?.toFixed(1) || '—'}</span>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <span className="text-sm font-bold text-white/60">{c.latest.ev_ebitda?.toFixed(1) || '—'}</span>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <span className={`text-sm font-black italic ${ (c.latest.roe || 0) > 0.15 ? 'text-emerald-400' : 'text-white/40'}`}>
                                        {c.latest.roe ? `${(c.latest.roe * 100).toFixed(1)}%` : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <span className="text-sm font-bold text-white/40">
                                        {c.latest.operating_margin ? `${(c.latest.operating_margin * 100).toFixed(1)}%` : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <span className="text-sm font-black italic text-blue-400/80">
                                        {c.latest.fcf_yield ? `${(c.latest.fcf_yield * 100).toFixed(1)}%` : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <span className={`text-sm font-bold ${ (c.latest.debt_equity || 0) > 1.5 ? 'text-rose-400' : 'text-white/30'}`}>
                                        {c.latest.debt_equity?.toFixed(2) || '—'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered?.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="p-5 rounded-full bg-white/[0.02] border border-white/5 w-fit mx-auto mb-4">
                            <Search size={24} className="text-white/20" />
                        </div>
                        <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Zero Securities Matched</h4>
                        <button 
                            onClick={() => setSearch('')}
                            className="mt-4 text-[0.6rem] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Reset Search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

