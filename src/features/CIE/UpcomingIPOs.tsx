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
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                        type="text"
                        placeholder="Search IPO candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium text-white focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-white/[0.03] border border-white/5 rounded-xl py-2 px-4 text-[0.65rem] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-blue-500/50"
                    >
                        <option value="All">All Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        className="bg-white/[0.03] border border-white/5 rounded-xl py-2 px-4 text-[0.65rem] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-blue-500/50"
                    >
                        {sectors.map(s => <option key={s ?? 'All'} value={s ?? 'All'}>{s ?? 'All'}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-widest text-white/30">Company</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-widest text-white/30">Sector</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-widest text-white/30 text-right">Size (Cr)</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-widest text-white/30 text-right">Price Band</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-widest text-white/30">Dates</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-widest text-white/30 text-center">Macro Risk</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-widest text-white/30 text-center">Status</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        <AnimatePresence>
                            {filteredIPOs.map((ipo) => (
                                <motion.tr
                                    key={ipo.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-white/[0.02] transition-all group cursor-default"
                                >
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-white text-sm tracking-tight">{ipo.company_name}</div>
                                        <div className="text-[0.6rem] font-black uppercase tracking-widest text-white/20 mt-1">{ipo.exchange}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[0.65rem] font-black uppercase tracking-widest text-blue-400/80 bg-blue-400/5 px-2 py-1 rounded-md border border-blue-400/10">
                                            {ipo.sector}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono text-emerald-400 text-sm">
                                        ₹{ipo.issue_size_cr?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-right flex flex-col items-end">
                                        <div className="font-mono text-white/80 text-xs">₹{ipo.price_band_min} - {ipo.price_band_max}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-[0.65rem] font-black tracking-widest text-white/60">
                                            <Calendar size={12} className="text-white/20" />
                                            {ipo.open_date ? format(new Date(ipo.open_date), 'dd MMM') : '--'} - {ipo.close_date ? format(new Date(ipo.close_date), 'dd MMM') : '--'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest border ${ipo.macro_risk_score < 40 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                            ipo.macro_risk_score < 70 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                            }`}>
                                            {ipo.macro_risk_score < 40 ? <ShieldCheck size={10} /> :
                                                ipo.macro_risk_score < 70 ? <Info size={10} /> : <AlertTriangle size={10} />}
                                            Score: {ipo.macro_risk_score}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`text-[0.6rem] font-black uppercase tracking-widest ${ipo.status === 'Open' ? 'text-emerald-400' :
                                            ipo.status === 'Upcoming' ? 'text-blue-400' :
                                                'text-white/20'
                                            }`}>
                                            {ipo.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        {ipo.draft_prospectus_url && (
                                            <a
                                                href={ipo.draft_prospectus_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all inline-block"
                                                title="View DRHP"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                {filteredIPOs.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="inline-flex p-4 rounded-full bg-white/5 text-white/10 mb-4">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-white/40 font-black uppercase tracking-widest text-xs">No matching IPO candidates</h3>
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex gap-4">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 h-fit">
                    <Zap size={20} />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-1">Macro Risk Overlay</h4>
                    <p className="text-[0.65rem] text-muted-foreground/60 leading-relaxed font-medium">
                        The "Macro Risk Score" is calculated based on our proprietary India Macro Pulse signals (GFCF levels, formalization premiums, and state-capex resilience) applied to the candidate's primary sector and geographical exposure. This is NOT investment advice.
                    </p>
                </div>
            </div>
        </div>
    );
};
