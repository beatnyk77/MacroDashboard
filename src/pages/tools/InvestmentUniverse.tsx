import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
    Search, 
    Filter, 
    ChevronDown, 
    ChevronUp, 
    Zap, 
    TrendingUp, 
    TrendingDown,
    Activity,
    Info,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MFUniverseItem {
    id: string;
    scheme_code: number;
    isin: string;
    name: string;
    category: string;
    fund_house: string;
    current_nav: number;
    updated_at: string;
    return_1y: number | null;
    return_3y: number | null;
    return_5y: number | null;
    macro_impact_score: number;
}

const InvestmentUniverse: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'return_3y', direction: 'desc' });

    const { data: universe, isLoading } = useQuery({
        queryKey: ['mf-universe'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_mutual_fund_universe')
                .select('*');
            if (error) throw error;
            return data as MFUniverseItem[];
        }
    });

    const filteredData = useMemo(() => {
        if (!universe) return [];
        
        let filtered = universe.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                item.scheme_code.toString().includes(searchTerm);
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        filtered.sort((a, b) => {
            let valA = (a as any)[sortConfig.key] ?? -999;
            let valB = (b as any)[sortConfig.key] ?? -999;
            
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [universe, searchTerm, categoryFilter, sortConfig]);

    const categories = useMemo(() => {
        if (!universe) return ['All'];
        const unique = Array.from(new Set(universe.map(u => u.category).filter(Boolean)));
        return ['All', ...unique].sort();
    }, [universe]);

    const requestSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-40 w-full rounded-[2.5rem] bg-white/[0.02] border border-white/5 animate-pulse" />
                <div className="h-96 w-full rounded-[2.5rem] bg-white/[0.01] border border-white/5 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen pb-20 space-y-8">
            {/* Header Section */}
            <header className="relative overflow-hidden p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 via-black to-black border border-white/5">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity size={120} className="text-blue-500" />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Institutional Terminal</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                        Bharat Investment <span className="text-blue-500">Universe</span>
                    </h1>
                    <p className="max-w-2xl text-lg font-medium text-white/40 leading-relaxed">
                        Real-time telemetry for Indian Mutual Funds. Tracking NAV deltas, trailing performance, 
                        and proprietary <span className="text-white/60 underline decoration-blue-500/30 underline-offset-4">Macro Impact Scores</span> across 5,000+ schemes.
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 mt-8">
                    <div className="px-5 py-3 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-white/60">EOD Sync Active</span>
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl flex items-center gap-3">
                        <RefreshCw size={14} className="text-white/40" />
                        <span className="text-xs font-bold text-white/60">Source: mfapi.in</span>
                    </div>
                </div>
            </header>

            {/* Controls Bar */}
            <div className="sticky top-4 z-40 flex flex-col md:flex-row gap-4 p-4 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-2xl shadow-2xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter by Scheme Name or ISIN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-white/20"
                    />
                </div>
                
                <div className="flex items-center gap-2 px-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <Filter size={16} className="text-white/30" />
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-transparent py-3 text-xs font-bold text-white focus:outline-none cursor-pointer min-w-[160px]"
                    >
                        {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-[2.5rem] border border-white/10 bg-black/40 overflow-hidden backdrop-blur-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.01]">
                                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/20 italic">#</th>
                                <th 
                                    className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Scheme Strategy
                                        {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/20 text-center">Category</th>
                                <th 
                                    className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white transition-colors text-right"
                                    onClick={() => requestSort('return_1y')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        1Y Ret
                                        {sortConfig.key === 'return_1y' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th 
                                    className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white transition-colors text-right"
                                    onClick={() => requestSort('return_3y')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        3Y Ret
                                        {sortConfig.key === 'return_3y' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th 
                                    className="px-8 py-6 text-xs font-black uppercase tracking-widest text-white/40 cursor-pointer hover:text-white transition-colors text-right"
                                    onClick={() => requestSort('return_5y')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        5Y Ret
                                        {sortConfig.key === 'return_5y' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th 
                                    className="px-8 py-6 text-xs font-black uppercase tracking-widest text-blue-400 cursor-pointer hover:text-blue-300 transition-colors text-right"
                                    onClick={() => requestSort('macro_impact_score')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Macro Score
                                        <Zap size={14} />
                                        {sortConfig.key === 'macro_impact_score' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            <AnimatePresence mode="popLayout">
                                {filteredData.map((item, idx) => (
                                    <motion.tr 
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={item.id}
                                        className="hover:bg-blue-600/[0.03] transition-all group border-l-2 border-transparent hover:border-blue-600"
                                    >
                                        <td className="px-8 py-6 text-xs font-black text-white/10 italic">{idx + 1}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white leading-tight">{item.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-white/20 whitespace-nowrap">{item.fund_house}</span>
                                                    <span className="text-[10px] text-white/10">•</span>
                                                    <span className="text-[10px] font-mono text-white/20 tracking-tighter italic">{item.isin}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <ReturnComponent val={item.return_1y} />
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <ReturnComponent val={item.return_3y} />
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <ReturnComponent val={item.return_5y} />
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className={`px-4 py-1 rounded-xl border font-black text-xs italic tracking-tighter ${
                                                    item.macro_impact_score > 70 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                    item.macro_impact_score > 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                    'bg-white/5 border-white/10 text-white/30'
                                                }`}>
                                                    {item.macro_impact_score}
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-6 rounded-full bg-white/[0.02] border border-white/5">
                                                <Search size={32} className="text-white/10" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-white uppercase tracking-widest">No strategies found</p>
                                                <p className="text-xs text-white/20">Try broadening your parameters or search term.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Context */}
            <footer className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 mx-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Info size={14} className="text-blue-500/60" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">Proprietary Scored Telemetry</span>
                    </div>
                </div>
                <div className="mt-4 md:mt-0">
                    <span className="text-[10px] font-mono text-white/20">system.v1.0.biu // graphiquestor.india</span>
                </div>
            </footer>
        </div>
    );
};

const ReturnComponent: React.FC<{ val: number | null }> = ({ val }) => {
    if (val === null) return <span className="text-xs font-black text-white/10 tracking-widest italic animate-pulse">SYNC_PENDING</span>;
    const isPos = val >= 0;
    return (
        <div className={`flex items-center justify-end gap-1 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className="text-sm font-black italic tracking-heading">{isPos ? '+' : ''}{val.toFixed(1)}%</span>
            {isPos ? <TrendingUp size={12} className="opacity-40" /> : <TrendingDown size={12} className="opacity-40" />}
        </div>
    );
};

export default InvestmentUniverse;
