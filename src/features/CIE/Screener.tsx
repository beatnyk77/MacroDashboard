import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import {
    Search,
    ChevronDown,
    ChevronUp
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

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'macro_impact', direction: 'desc' });

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

        let filtered = companies.filter(company => {
            const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.ticker.toLowerCase().includes(searchTerm.toLowerCase());

            const latestFund = company.cie_fundamentals?.[0] || {};
            const mcap = latestFund.metadata?.last_price ? (latestFund.revenue * latestFund.metadata.last_price / 1000) / 10000000 : 0; // rough mcap approx in Cr

            const latestSignal = company.cie_macro_signals?.[0];
            const matchesMacroScore = (latestSignal?.macro_impact_score || 0) >= filters.minMacroScore;
            const matchesMcap = mcap >= filters.minMarketCap;
            const matchesSector = filters.sector === 'All' || company.sector === filters.sector;

            return matchesSearch && matchesMacroScore && matchesSector && matchesMcap;
        });

        filtered.sort((a, b) => {
            const latestFundA = a.cie_fundamentals?.[0] || {};
            const latestSignalA = a.cie_macro_signals?.[0] || {};
            const mcapA = latestFundA.metadata?.last_price ? (latestFundA.revenue * latestFundA.metadata.last_price / 1000) / 10000000 : 0;
            const peA = latestFundA.eps ? latestFundA.metadata?.last_price / latestFundA.eps : 0;

            const latestFundB = b.cie_fundamentals?.[0] || {};
            const latestSignalB = b.cie_macro_signals?.[0] || {};
            const mcapB = latestFundB.metadata?.last_price ? (latestFundB.revenue * latestFundB.metadata.last_price / 1000) / 10000000 : 0;
            const peB = latestFundB.eps ? latestFundB.metadata?.last_price / latestFundB.eps : 0;

            let valA = 0; let valB = 0;
            if (sortConfig.key === 'name') { valA = a.name as any; valB = b.name as any; }
            if (sortConfig.key === 'mcap') { valA = mcapA; valB = mcapB; }
            if (sortConfig.key === 'pe') { valA = peA; valB = peB; }
            if (sortConfig.key === 'margin') { valA = latestFundA.operating_margin || 0; valB = latestFundB.operating_margin || 0; }
            if (sortConfig.key === 'roe') { valA = latestFundA.return_on_equity || 0; valB = latestFundB.return_on_equity || 0; }
            if (sortConfig.key === 'macro_impact') { valA = latestSignalA.macro_impact_score || 0; valB = latestSignalB.macro_impact_score || 0; }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [companies, searchTerm, filters, sortConfig]);

    const sectors = useMemo(() => {
        if (!companies) return ['All'];
        const uniqueSectors = Array.from(new Set(companies.map(c => c.sector).filter(Boolean)));
        return ['All', ...uniqueSectors];
    }, [companies]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    }

    const renderSortHeader = (label: string, sortKey: string) => (
        <th
            key={sortKey}
            className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/50 cursor-pointer hover:text-white transition-colors select-none"
            onClick={() => requestSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                {sortConfig.key === sortKey && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                )}
            </div>
        </th>
    );

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 w-full rounded bg-white/[0.02] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                        type="text"
                        placeholder="Search Company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-white/20"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
                        <span className="text-[0.6rem] uppercase tracking-wider text-white/40">Sector:</span>
                        <select
                            value={filters.sector}
                            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                            className="bg-transparent text-[0.7rem] text-white focus:outline-none cursor-pointer"
                        >
                            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
                        <span className="text-[0.6rem] uppercase tracking-wider text-white/40">Min Score:</span>
                        <input
                            type="number"
                            value={filters.minMacroScore}
                            onChange={(e) => setFilters({ ...filters, minMacroScore: parseInt(e.target.value) || 0 })}
                            className="bg-transparent w-10 text-[0.7rem] font-bold text-emerald-400 focus:outline-none text-right"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02]">
                            {renderSortHeader("S.No.", "sno")}
                            {renderSortHeader("Name", "name")}
                            <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/50">Sector</th>
                            {renderSortHeader("Market Cap", "mcap")}
                            <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/50 text-right">Price</th>
                            {renderSortHeader("P/E", "pe")}
                            {renderSortHeader("OPM (%)", "margin")}
                            {renderSortHeader("ROE (%)", "roe")}
                            {renderSortHeader("Macro Score", "macro_impact")}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredCompanies.map((company, idx) => {
                                const latestFund = company.cie_fundamentals?.[0] || {};
                                const latestSignal = company.cie_macro_signals?.[0] || {};

                                const price = latestFund.metadata?.last_price || 0;
                                const mcap = price ? (latestFund.revenue * price / 1000) / 10000000 : 0; // rough Cr approx
                                const pe = latestFund.eps && price ? price / latestFund.eps : 0;
                                const opm = (latestFund.operating_margin || 0) * 100;
                                const roe = (latestFund.return_on_equity || 0) * 100;
                                const score = latestSignal.macro_impact_score || 0;

                                return (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={company.id}
                                        className="hover:bg-white/[0.04] transition-colors group"
                                    >
                                        <td className="px-4 py-3 text-xs text-white/30">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <Link to={`/india-equities/${company.ticker.replace('.NS', '')}`} className="flex flex-col hover:text-blue-400 transition-colors">
                                                <span className="text-sm font-medium text-blue-400">{company.name}</span>
                                                <span className="text-[0.6rem] text-white/40 uppercase">{company.ticker.replace('.NS', '')}</span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-white/60">{company.sector || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-white/80">₹{mcap.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-white/80 text-right">₹{price.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-white/80">{pe > 0 ? pe.toFixed(1) : '-'}</td>
                                        <td className="px-4 py-3 text-sm text-white/80">{opm.toFixed(1)}%</td>
                                        <td className="px-4 py-3 text-sm text-white/80">{roe.toFixed(1)}%</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${score > 70 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-400'
                                                    }`}>
                                                    {score}
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
                {filteredCompanies.length === 0 && (
                    <div className="py-16 text-center text-white/30 text-sm">No companies match your filters.</div>
                )}
            </div>
        </div>
    );
};
