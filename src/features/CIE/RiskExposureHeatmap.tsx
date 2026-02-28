import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, ShieldAlert, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
    id: string;
    ticker: string;
    name: string;
    sector: string;
    cie_macro_signals: any[];
}

export const RiskExposureHeatmap: React.FC = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'sector' | 'company'>('sector');
    const [selectedSectorPanel, setSelectedSectorPanel] = useState<any | null>(null);
    const [selectedCDSPanel, setSelectedCDSPanel] = useState<any | null>(null);

    const { data: companies, isLoading } = useQuery({
        queryKey: ['cie-heatmap-data'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_companies')
                .select('id, ticker, name, sector, cie_macro_signals(*)');

            if (error) throw error;
            return data as Company[];
        }
    });

    const sectorAverages = useMemo(() => {
        if (!companies) return [];

        const sectorGroups: Record<string, Company[]> = {};
        companies.forEach(company => {
            if (!company.sector) return;
            if (!sectorGroups[company.sector]) sectorGroups[company.sector] = [];
            sectorGroups[company.sector].push(company);
        });

        return Object.entries(sectorGroups).map(([sector, comps]) => {
            const validSignals = comps
                .map(c => c.cie_macro_signals?.[0])
                .filter(Boolean);

            if (validSignals.length === 0) return null;

            const avg = (key: string) => {
                const sum = validSignals.reduce((acc, sig) => acc + (sig[key] || 0), 0);
                return Math.round(sum / validSignals.length);
            };

            return {
                sector,
                companyCount: comps.length,
                rupeeVolatility: avg('rupee_sensitivity') || 0, // Placeholder, usually oil sensitivity proxy
                oilSensitivity: avg('oil_sensitivity') || 0,
                stateFiscalRisk: 100 - (avg('state_resilience') || 100), // Invert resilience for risk
                formalizationRisk: 100 - (avg('formalization_premium') || 100),
                liquidityRisk: avg('liquidity_transmission_lag') || 0,
                cdsRisk: avg('cds_spread_bps') || 75,
                cdsMonthlyChange: avg('cds_monthly_change') || 0,
                capexEfficiency: avg('capex_efficiency') || 0,
                macroScore: avg('macro_impact_score') || 0,
                topExposed: comps.sort((a, b) => {
                    const scoreA = a.cie_macro_signals?.[0]?.macro_impact_score || 0;
                    const scoreB = b.cie_macro_signals?.[0]?.macro_impact_score || 0;
                    return scoreA - scoreB; // Lower score = higher risk
                }).slice(0, 5)
            };
        }).filter(Boolean);
    }, [companies]);

    const getColorScore = (score: number, isOverall = false, isCDS = false) => {
        if (isOverall) {
            // Overall score: Higher is better (Green)
            if (score > 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            if (score > 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        }
        if (isCDS) {
            // CDS Risk: Lower is better (Green)
            if (score < 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            if (score <= 150) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        }
        // Standard Risk: Lower is better (Green)
        if (score > 66) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        if (score > 33) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 w-full rounded-2xl bg-white/[0.02] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-8 py-6 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white leading-tight">Macro Risk Gameboard</h2>
                        <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1">Sectoral exposure to systemic macro shocks</p>
                    </div>
                </div>

                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => setViewMode('sector')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'sector' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        Sector Averages
                    </button>
                    <button
                        onClick={() => setViewMode('company')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all opacity-30 cursor-not-allowed`}
                        disabled
                    >
                        Drill-down
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Sector Structure</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Oil Sensitivity</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Fiscal Risk</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Formalization</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Liquidity</th>
                            <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">CDS Spread</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Risk Pulse</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {sectorAverages.map((row) => {
                            if (!row) return null;
                            const handleFilterClick = () => {
                                navigate('/india-equities', { state: { filterSector: row.sector } });
                            };

                            return (
                                <tr key={row.sector} className="group hover:bg-blue-500/[0.02] transition-all cursor-pointer" onClick={handleFilterClick}>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors tracking-tight flex items-center gap-2">
                                                {row.sector}
                                                <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </span>
                                            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{row.companyCount} Equities</div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 text-center">
                                        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl border text-xs font-black italic tracking-tighter w-16 ${getColorScore(row.oilSensitivity)}`}>
                                            {row.oilSensitivity}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl border text-xs font-black italic tracking-tighter w-16 ${getColorScore(row.stateFiscalRisk)}`}>
                                            {row.stateFiscalRisk}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl border text-xs font-black italic tracking-tighter w-16 ${getColorScore(row.formalizationRisk)}`}>
                                            {row.formalizationRisk}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center" onClick={(e) => { e.stopPropagation(); setSelectedSectorPanel(row); }}>
                                        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl border text-xs font-black italic tracking-tighter w-16 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform ${getColorScore(row.liquidityRisk)}`}>
                                            {row.liquidityRisk}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center" onClick={(e) => { e.stopPropagation(); setSelectedCDSPanel(row); }}>
                                        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl border text-xs font-black italic tracking-tighter w-16 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform ${getColorScore(row.cdsRisk, false, true)}`}>
                                            {row.cdsRisk}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl border text-xs font-black italic tracking-tighter w-16 ${getColorScore(row.macroScore, true)}`}>
                                            {row.macroScore}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-dashed border-white/10 flex items-start gap-6 text-white/40">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 mt-0.5">
                    <AlertCircle size={18} className="flex-shrink-0" />
                </div>
                <div>
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Protocol Brief: Risk Gameboard Intelligence</h6>
                    <p className="text-[0.65rem] font-medium leading-relaxed max-w-4xl">
                        Higher scores (Red) indicate elevated structural risk exposure to the specified macro factor. Sectoral scores are derived from our proprietary aggregation of underlying company filings, forex sensitivity analysis, and state-level capex intensity. <span className="text-blue-400 font-bold">Interactivity:</span> Click on any sector to instantly filter the main screener. Click on Liquidity or CDS scores to view granular exposure profiles.
                    </p>
                </div>
            </div>

            {/* Liquidity Risk Side Panel */}
            <AnimatePresence>
                {selectedSectorPanel && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                            onClick={() => setSelectedSectorPanel(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#050810] border-l border-white/10 z-[101] p-12 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-y-auto no-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white leading-none tracking-tight">{selectedSectorPanel.sector}</h3>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mt-2 block">Liquidity Exposure Profile</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSectorPanel(null)} className="p-3 text-white/40 hover:text-white bg-white/5 rounded-2xl transition-all border border-white/10 hover:border-white/20">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Transmission</div>
                                        <div className={`text-4xl font-black italic tracking-tighter ${selectedSectorPanel.liquidityRisk > 66 ? 'text-rose-400' : selectedSectorPanel.liquidityRisk > 33 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                            {selectedSectorPanel.liquidityRisk}<span className="text-sm ml-1 opacity-20">/100</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Constituents</div>
                                        <div className="text-4xl font-black text-white italic tracking-tighter">{selectedSectorPanel.companyCount}</div>
                                    </div>
                                </div>

                                <div className="bg-blue-500/5 border border-blue-500/20 p-8 rounded-[2rem]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Fundamental Driver</h4>
                                    <p className="text-xs text-blue-100/60 leading-relaxed font-medium mb-6">
                                        This sector's score is computed by correlating the current banking system CD ratio and RBI LAF net injection status against the sector's historical reliance on continuous credit expansion.
                                    </p>
                                    <button
                                        onClick={() => navigate('/funding')}
                                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors group/btn"
                                    >
                                        Live Liquidity Gauge <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    </button>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6 border-b border-white/5 pb-4">High Exposure Constituents</h4>
                                    <div className="space-y-3">
                                        {selectedSectorPanel.topExposed.map((comp: any) => (
                                            <div key={comp.ticker} className="flex justify-between items-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group/comp cursor-pointer" onClick={() => navigate(`/india-equities/${comp.ticker.replace('.NS', '')}`)}>
                                                <div>
                                                    <div className="text-sm font-black text-white group-hover/comp:text-blue-400 transition-colors tracking-tight">{comp.ticker.replace('.NS', '')}</div>
                                                    <div className="text-[10px] font-medium text-white/30 truncate max-w-[200px] mt-1">{comp.name}</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                                                        RISK: {comp.cie_macro_signals?.[0]?.liquidity_transmission_lag || selectedSectorPanel.liquidityRisk}
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-white/10 group-hover/comp:text-white/80 transition-all" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* CDS Risk Side Panel */}
            <AnimatePresence>
                {selectedCDSPanel && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                            onClick={() => setSelectedCDSPanel(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#050810] border-l border-white/10 z-[101] p-12 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-y-auto no-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white leading-none tracking-tight">{selectedCDSPanel.sector}</h3>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mt-2 block">CDS Risk Profile</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCDSPanel(null)} className="p-3 text-white/40 hover:text-white bg-white/5 rounded-2xl transition-all border border-white/10 hover:border-white/20">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-10">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">5Y CDS Spread</div>
                                        <div className={`text-4xl font-black italic tracking-tighter ${selectedCDSPanel.cdsRisk > 150 ? 'text-rose-400' : selectedCDSPanel.cdsRisk > 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                            {selectedCDSPanel.cdsRisk}<span className="text-sm ml-1 opacity-20">bps</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">30D Movement</div>
                                        <div className={`text-4xl font-black italic tracking-tighter ${selectedCDSPanel.cdsMonthlyChange > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {selectedCDSPanel.cdsMonthlyChange > 0 ? '+' : ''}{selectedCDSPanel.cdsMonthlyChange}<span className="text-sm ml-1 opacity-20">bps</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-500/5 border border-purple-500/20 p-8 rounded-[2rem]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4">Market Sentiment</h4>
                                    <p className="text-xs text-purple-100/60 leading-relaxed font-medium">
                                        This spread represents the market-implied cost of protecting against default. Elevated spreads in {selectedCDSPanel.sector} indicate rising structural concerns around leverage compared to India's Sovereign 5Y CDS Benchmark (75 bps).
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6 border-b border-white/5 pb-4">Most Sensitive Constituents</h4>
                                    <div className="space-y-3">
                                        {selectedCDSPanel.topExposed.map((comp: any) => (
                                            <div key={comp.ticker} className="flex justify-between items-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group/comp cursor-pointer" onClick={() => navigate(`/india-equities/${comp.ticker.replace('.NS', '')}`)}>
                                                <div>
                                                    <div className="text-sm font-black text-white group-hover/comp:text-blue-400 transition-colors tracking-tight">{comp.ticker.replace('.NS', '')}</div>
                                                    <div className="text-[10px] font-medium text-white/30 truncate max-w-[200px] mt-1">{comp.name}</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                                                        CDS: {comp.cie_macro_signals?.[0]?.cds_spread_bps || selectedCDSPanel.cdsRisk}
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-white/10 group-hover/comp:text-white/80 transition-all" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-white/[0.01] rounded-[2rem] border border-white/5">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Linked Macro Stressors</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {['Liquidity Transmission', 'Fiscal Staleness', 'FX Volatility'].map(tag => (
                                            <span key={tag} className="px-3 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/10">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
