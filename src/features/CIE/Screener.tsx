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
    governance_risk_score?: number;
    promoter_pledge_pct?: number;
    insider_buy_sell_net?: number;
    last_sebi_action?: string;
    pledge_delta?: number;
    recent_deal_pct?: number;
}

export const Screener: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        minMarketCap: 0,
        minMacroScore: 0,
        sector: 'All',
        minStateResilience: 0,
        minCapexEfficiency: 0,
        minFormalization: 0,
        maxOilSensitivity: 100,
        maxGovRisk: 100,
        minInsiderNet: -1000,
        onlyRisingPledge: false,
        minInstitutionalBuy: 0
    });

    const [savedViews, setSavedViews] = useState<{ name: string; filters: any }[]>(() => {
        const saved = localStorage.getItem('cie_saved_views');
        return saved ? JSON.parse(saved) : [];
    });

    const saveView = (name: string) => {
        if (!name) return;
        const newViews = [...savedViews, { name, filters }];
        setSavedViews(newViews);
        localStorage.setItem('cie_saved_views', JSON.stringify(newViews));
    };


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
            const mcap = latestFund.metadata?.last_price ? (latestFund.revenue * latestFund.metadata.last_price / 1000) / 10000000 : 0;

            const latestSignal = company.cie_macro_signals?.[0] || {};
            const matchesMacroScore = (latestSignal?.macro_impact_score || 0) >= filters.minMacroScore;
            const matchesMcap = mcap >= filters.minMarketCap;
            const matchesSector = filters.sector === 'All' || company.sector === filters.sector;

            const matchesState = (latestSignal?.state_resilience || 0) >= filters.minStateResilience;
            const matchesCapex = (latestSignal?.capex_efficiency || 0) >= filters.minCapexEfficiency;
            const matchesFormalization = (latestSignal?.formalization_premium || 0) >= filters.minFormalization;
            const matchesOil = (latestSignal?.oil_sensitivity || 0) <= filters.maxOilSensitivity;
            const matchesGov = (company.governance_risk_score || 0) <= filters.maxGovRisk;
            const matchesInsider = (company.insider_buy_sell_net || 0) >= filters.minInsiderNet;
            const matchesRising = !filters.onlyRisingPledge || (company.pledge_delta || 0) > 0;
            const matchesInst = (company.recent_deal_pct || 0) >= filters.minInstitutionalBuy;

            return matchesSearch && matchesMacroScore && matchesSector && matchesMcap &&
                matchesState && matchesCapex && matchesFormalization && matchesOil && matchesGov && matchesInsider && matchesRising && matchesInst;
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
            if (sortConfig.key === 'gov_risk') { valA = a.governance_risk_score || 0; valB = b.governance_risk_score || 0; }
            if (sortConfig.key === 'insider') { valA = a.insider_buy_sell_net || 0; valB = b.insider_buy_sell_net || 0; }

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

    const [showMacroFilters, setShowMacroFilters] = useState(false);
    const [viewName, setViewName] = useState('');

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
            {/* Filter Bar */}
            <div className="flex flex-col gap-6 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input
                            type="text"
                            placeholder="Search Name or Symbol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-white/20"
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
                            <span className="text-[0.6rem] uppercase tracking-wider text-white/40">Saved Views:</span>
                            <div className="flex items-center gap-1">
                                <select
                                    onChange={(e) => {
                                        const view = savedViews.find(v => v.name === e.target.value);
                                        if (view) setFilters(view.filters);
                                    }}
                                    className="bg-transparent text-[0.7rem] text-blue-400 font-bold focus:outline-none cursor-pointer"
                                >
                                    <option value="">Select View</option>
                                    {savedViews.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowMacroFilters(!showMacroFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[0.65rem] font-bold uppercase tracking-widest transition-all ${showMacroFilters ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                        >
                            Macro Filters {showMacroFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showMacroFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/5">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-[0.6rem] uppercase font-black text-white/40">Min State Resilience</label>
                                        <span className="text-[0.65rem] font-bold text-emerald-400">{filters.minStateResilience}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100"
                                        value={filters.minStateResilience}
                                        onChange={(e) => setFilters({ ...filters, minStateResilience: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-[0.6rem] uppercase font-black text-white/40">Min Capex Efficiency</label>
                                        <span className="text-[0.65rem] font-bold text-blue-400">{filters.minCapexEfficiency}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100"
                                        value={filters.minCapexEfficiency}
                                        onChange={(e) => setFilters({ ...filters, minCapexEfficiency: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-[0.6rem] uppercase font-black text-white/40">Min Insider Net</label>
                                        <span className={`text-[0.65rem] font-bold ${filters.minInsiderNet > 0 ? 'text-emerald-400' : 'text-blue-400'}`}>{filters.minInsiderNet} Cr</span>
                                    </div>
                                    <input
                                        type="range" min="-100" max="100" step="5"
                                        value={filters.minInsiderNet}
                                        onChange={(e) => setFilters({ ...filters, minInsiderNet: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[0.6rem] uppercase font-black text-white/40 block mb-2">Promoter Stress</label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={filters.onlyRisingPledge}
                                            onChange={(e) => setFilters({ ...filters, onlyRisingPledge: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/10 bg-black/40 checked:bg-blue-500 focus:ring-0 transition-all"
                                        />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-[0.6rem] uppercase font-black text-white/40">Min Institutional Buy (30D)</label>
                                        <span className="text-[0.65rem] font-bold text-emerald-400">{filters.minInstitutionalBuy}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="5" step="0.1"
                                        value={filters.minInstitutionalBuy}
                                        onChange={(e) => setFilters({ ...filters, minInstitutionalBuy: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                <div className="lg:col-span-4 flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="View Name..."
                                            value={viewName}
                                            onChange={(e) => setViewName(e.target.value)}
                                            className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[0.7rem] text-white focus:outline-none"
                                        />
                                        <button
                                            onClick={() => { saveView(viewName); setViewName(''); }}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[0.65rem] font-black uppercase tracking-widest text-white/60"
                                        >
                                            Save Current View
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setFilters({
                                            minMarketCap: 0, minMacroScore: 0, sector: 'All',
                                            minStateResilience: 0, minCapexEfficiency: 0, minFormalization: 0, maxOilSensitivity: 100, maxGovRisk: 100,
                                            minInsiderNet: -1000, onlyRisingPledge: false, minInstitutionalBuy: 0
                                        })}
                                        className="text-[0.6rem] uppercase font-black text-rose-400/60 hover:text-rose-400 transition-colors"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02]">
                            {renderSortHeader("S.No.", "sno")}
                            {renderSortHeader("Name", "name")}
                            <th className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/50">Sector</th>
                            {renderSortHeader("Market Cap", "mcap")}
                            {renderSortHeader("Macro Score", "macro_impact")}
                            {renderSortHeader("Insider Net", "insider")}
                            {renderSortHeader("Gov Risk", "gov_risk")}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredCompanies.map((company, idx) => {
                                const latestSignal = company.cie_macro_signals?.[0] || {};
                                const score = latestSignal.macro_impact_score || 0;
                                const govRisk = company.governance_risk_score || 0;
                                const insider = company.insider_buy_sell_net || 0;
                                const pDelta = company.pledge_delta || 0;

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
                                        <td className="px-4 py-3 text-sm text-white/80">₹{((company.cie_fundamentals?.[0]?.revenue || 0) * (company.cie_fundamentals?.[0]?.metadata?.last_price || 0) / 1000 / 10000000).toFixed(2)}Cr</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-bold ${score > 70 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                {score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-bold ${insider > 0 ? 'text-emerald-400' : insider < 0 ? 'text-rose-400' : 'text-white/40'}`}>
                                                    {insider > 0 ? '+' : ''}{insider} Cr
                                                </span>
                                                {pDelta !== 0 && (
                                                    <span className={`text-[0.6rem] ${pDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {pDelta > 0 ? '▲' : '▼'} {Math.abs(pDelta).toFixed(1)}% Pledge
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[0.7rem] font-black px-2 py-0.5 rounded-md ${govRisk < 30 ? 'bg-emerald-500/10 text-emerald-400' :
                                                govRisk < 60 ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-rose-500/10 text-rose-400'
                                                }`}>
                                                {govRisk}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Screener;
