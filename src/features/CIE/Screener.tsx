import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
    Search,
    Filter,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
    id: string;
    ticker: string;
    name: string;
    sector: string;
    industry: string;
    state_hq: string;
    cie_fundamentals: any[];
    cie_macro_signals: any[];
}

export const Screener: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        minMarketCap: 0,
        minMacroScore: 0,
        sector: 'All'
    });

    const { data: companies, isLoading } = useQuery({
        queryKey: ['cie-companies'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_companies')
                .select('*, cie_fundamentals(*), cie_macro_signals(*)')
                .order('ticker');

            if (error) throw error;
            return data as Company[];
        }
    });

    const filteredCompanies = useMemo(() => {
        if (!companies) return [];

        return companies.filter(company => {
            const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.ticker.toLowerCase().includes(searchTerm.toLowerCase());

            const latestSignal = company.cie_macro_signals?.[0];
            const matchesMacroScore = (latestSignal?.macro_impact_score || 0) >= filters.minMacroScore;

            const matchesSector = filters.sector === 'All' || company.sector === filters.sector;

            return matchesSearch && matchesMacroScore && matchesSector;
        });
    }, [companies, searchTerm, filters]);

    const sectors = useMemo(() => {
        if (!companies) return ['All'];
        const uniqueSectors = Array.from(new Set(companies.map(c => c.sector).filter(Boolean)));
        return ['All', ...uniqueSectors];
    }, [companies]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 w-full rounded-2xl bg-white/[0.02] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Ticker or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <Filter size={14} className="text-white/40" />
                        <select
                            value={filters.sector}
                            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                            className="bg-transparent text-[0.65rem] font-black uppercase tracking-widest focus:outline-none cursor-pointer"
                        >
                            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/40">Min Macro Score:</span>
                        <input
                            type="number"
                            value={filters.minMacroScore}
                            onChange={(e) => setFilters({ ...filters, minMacroScore: parseInt(e.target.value) || 0 })}
                            className="bg-transparent w-12 text-[0.65rem] font-black text-blue-400 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30">Company</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 text-center">Macro Score</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30">Fundamentals (LTM)</th>
                            <th className="px-6 py-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30">Resilience Signals</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode="popLayout">
                            {filteredCompanies.map((company) => {
                                const latestFund = company.cie_fundamentals?.[0] || {};
                                const latestSignal = company.cie_macro_signals?.[0] || {};

                                return (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={company.id}
                                        className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] last:border-0"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xs">
                                                    {company.ticker.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors uppercase">{company.ticker.split('.')[0]}</div>
                                                    <div className="text-[0.6rem] text-muted-foreground/60 uppercase tracking-widest">{company.sector || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`text-lg font-black ${latestSignal.macro_impact_score > 70 ? 'text-emerald-400' :
                                                        latestSignal.macro_impact_score > 40 ? 'text-amber-400' : 'text-rose-400'
                                                    }`}>
                                                    {latestSignal.macro_impact_score || 'N/A'}
                                                </div>
                                                <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-current opacity-60"
                                                        style={{
                                                            width: `${latestSignal.macro_impact_score || 0}%`,
                                                            color: latestSignal.macro_impact_score > 70 ? '#10b981' :
                                                                latestSignal.macro_impact_score > 40 ? '#f59e0b' : '#f43f5e'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                <div className="text-[0.6rem] text-white/30 uppercase tracking-widest font-black">Margin</div>
                                                <div className="text-[0.6rem] text-white/80 font-black">{((latestFund.operating_margin || 0) * 100).toFixed(1)}%</div>
                                                <div className="text-[0.6rem] text-white/30 uppercase tracking-widest font-black">ROE</div>
                                                <div className="text-[0.6rem] text-white/80 font-black">{((latestFund.return_on_equity || 0) * 100).toFixed(1)}%</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-2">
                                                {latestSignal.formalization_premium > 60 && (
                                                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-[0.55rem] font-black uppercase tracking-widest border border-orange-500/20">Formalization+</span>
                                                )}
                                                {latestSignal.state_resilience > 70 && (
                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[0.55rem] font-black uppercase tracking-widest border border-emerald-500/20">State Stable</span>
                                                )}
                                                {latestSignal.oil_sensitivity < 40 && (
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[0.55rem] font-black uppercase tracking-widest border border-blue-500/20">Oil Resilient</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>

                {filteredCompanies.length === 0 && (
                    <div className="py-20 text-center">
                        <Filter size={32} className="mx-auto text-white/10 mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest text-white/20">No matching equities found</p>
                        <p className="text-[0.65rem] text-muted-foreground/30 mt-1 uppercase font-black">Try loosening your macro filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};
