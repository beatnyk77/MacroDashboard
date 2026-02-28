import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    ExternalLink,
    Info,
    Search,
    AlertTriangle,
    ShieldCheck,
    Zap,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface IPO {
    id: string;
    company_name: string;
    issue_size_cr: number | null;
    price_band_min: number | null;
    price_band_max: number | null;
    open_date: string | null;
    close_date: string | null;
    listing_date: string | null;
    sector: string | null;
    macro_risk_score: number;
    exchange: string | null;
    status: string;
    draft_prospectus_url: string | null;
}

export const UpcomingIPOs: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Open' | 'Closed'>('All');
    const [sectorFilter, setSectorFilter] = useState('All');

    const { data: ipos, isLoading } = useQuery({
        queryKey: ['cie-upcoming-ipos'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_upcoming_ipos')
                .select('*')
                .order('open_date', { ascending: true });
            if (error) throw error;
            return data as IPO[];
        }
    });

    const sectors = useMemo(() => {
        if (!ipos) return ['All'];
        const uniqueSectors = Array.from(new Set(ipos.map(i => i.sector).filter(Boolean)));
        return ['All', ...uniqueSectors];
    }, [ipos]);

    const filteredIPOs = useMemo(() => {
        if (!ipos) return [];
        return ipos.filter(i => {
            const matchesSearch = i.company_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
            const matchesSector = sectorFilter === 'All' || i.sector === sectorFilter;
            return matchesSearch && matchesStatus && matchesSector;
        });
    }, [ipos, searchTerm, statusFilter, sectorFilter]);

    if (isLoading) return (
        <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 animate-pulse bg-white/5 rounded-xl block" />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl">
                <div className="relative w-full md:w-[400px]">
                    <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                        type="text"
                        placeholder="Search IPO candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-16 pr-6 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
                    />
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 focus:outline-none focus:border-blue-500/50 appearance-none hover:text-white/60 transition-colors cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 focus:outline-none focus:border-blue-500/50 appearance-none hover:text-white/60 transition-colors cursor-pointer"
                    >
                        {sectors.map(s => <option key={s ?? 'All'} value={s ?? 'All'}>{s ?? 'All'}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Company</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Sector</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Size (Cr)</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Price Band</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Dates</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Macro Risk</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Status</th>
                            <th className="px-8 py-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        <AnimatePresence mode="popLayout">
                            {filteredIPOs.map((ipo, i) => (
                                <motion.tr
                                    key={ipo.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="hover:bg-blue-500/[0.02] transition-colors group cursor-default"
                                >
                                    <td className="px-8 py-6">
                                        <div className="font-black text-white text-sm tracking-tight group-hover:text-blue-400 transition-colors">{ipo.company_name}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">{ipo.exchange}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 bg-blue-400/5 px-3 py-1.5 rounded-full border border-blue-400/10">
                                            {ipo.sector}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="text-sm font-black text-emerald-400 italic tracking-tighter">
                                            ₹{ipo.issue_size_cr?.toLocaleString()}
                                            <span className="text-[10px] text-white/20 ml-1">Cr</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="text-xs font-black text-white/80 italic tracking-tighter">
                                            ₹{ipo.price_band_min} - {ipo.price_band_max}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-white/60 uppercase italic">
                                            <Calendar size={12} className="text-white/20" />
                                            {ipo.open_date ? format(new Date(ipo.open_date), 'dd MMM') : '--'} - {ipo.close_date ? format(new Date(ipo.close_date), 'dd MMM') : '--'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${ipo.macro_risk_score < 40 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                            ipo.macro_risk_score < 70 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                            }`}>
                                            {ipo.macro_risk_score < 40 ? <ShieldCheck size={12} /> :
                                                ipo.macro_risk_score < 70 ? <Info size={12} /> : <AlertTriangle size={12} />}
                                            Score: {ipo.macro_risk_score}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${ipo.status === 'Open' ? 'text-emerald-400 animate-pulse' :
                                            ipo.status === 'Upcoming' ? 'text-blue-400' :
                                                'text-white/20'
                                            }`}>
                                            {ipo.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {ipo.draft_prospectus_url && (
                                            <a
                                                href={ipo.draft_prospectus_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all inline-block group/link"
                                                title="View DRHP"
                                            >
                                                <ExternalLink size={16} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                            </a>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                {filteredIPOs.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="inline-flex p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 text-white/10 mb-6">
                            <TrendingUp size={48} />
                        </div>
                        <h3 className="text-white/30 font-black uppercase tracking-widest text-[10px]">No matching IPO candidates detected</h3>
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="p-8 rounded-[2.5rem] bg-orange-500/5 border border-orange-500/10 flex items-start gap-6 backdrop-blur-sm group">
                <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:scale-105 transition-transform">
                    <Zap size={24} />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">Protocol Overlay: Macro Risk Intelligence</h4>
                    <p className="text-[0.65rem] text-muted-foreground/60 leading-relaxed font-medium max-w-4xl">
                        The "Macro Risk Score" is calculated based on our proprietary India Macro Pulse signals (GFCF levels, formalization premiums, and state-capex resilience) applied to the candidate's primary sector and geographical exposure. This is an intelligence overlay and does not constitute financial advice.
                    </p>
                </div>
            </div>
        </div>
    );
};
