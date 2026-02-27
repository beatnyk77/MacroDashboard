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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                        <ShieldAlert size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">Macro Risk Gameboard</h2>
                        <p className="text-[0.65rem] text-muted-foreground/60 font-medium">Sectoral exposure to systemic macro risks</p>
                    </div>
                </div>

                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setViewMode('sector')}
                        className={`px-4 py-1.5 rounded-lg text-[0.65rem] font-bold uppercase tracking-wider transition-all ${viewMode === 'sector' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Sector Averages
                    </button>
                    <button
                        onClick={() => setViewMode('company')}
                        className={`px-4 py-1.5 rounded-lg text-[0.65rem] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-not-allowed`}
                        disabled
                        title="Coming soon"
                    >
                        Company Drill-down
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border border-white/5 rounded-3xl bg-black/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="p-4 text-[0.65rem] font-black uppercase tracking-widest text-white/40 max-w-[200px]">Sector</th>
                            <th className="p-4 text-[0.65rem] font-black uppercase tracking-widest text-white/40 text-center">Oil Sensitivity</th>
                            <th className="p-4 text-[0.65rem] font-black uppercase tracking-widest text-white/40 text-center">State Fiscal Risk</th>
                            <th className="p-4 text-[0.65rem] font-black uppercase tracking-widest text-white/40 text-center">Formalization Risk</th>
                            <th className="p-4 text-[0.65rem] font-black uppercase tracking-widest text-white/40 text-center">Liquidity Transmission</th>
                            <th className="p-4 text-[0.65rem] font-black uppercase tracking-widest text-white/40 text-center">CDS Risk Premium</th>
                            <th className="p-4 text-[0.65rem] font-black uppercase tracking-widest text-white/40 text-center">Overall Risk (Inverse Score)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sectorAverages.map((row) => {
                            if (!row) return null;
                            const handleFilterClick = () => {
                                // Navigate to screener with this sector selected
                                // Using state to pass filters could be done, or URL params
                                // For now, we can write to localStorage view or just navigate
                                navigate('/india-equities', { state: { filterSector: row.sector } });
                            };

                            return (
                                <tr key={row.sector} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={handleFilterClick}>
                                    <td className="p-4">
                                        <div className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                            {row.sector}
                                            <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-[0.65rem] text-white/40">{row.companyCount} Equities</div>
                                    </td>

                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg border text-xs font-black w-14 ${getColorScore(row.oilSensitivity)}`}>
                                            {row.oilSensitivity}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg border text-xs font-black w-14 ${getColorScore(row.stateFiscalRisk)}`}>
                                            {row.stateFiscalRisk}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg border text-xs font-black w-14 ${getColorScore(row.formalizationRisk)}`}>
                                            {row.formalizationRisk}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedSectorPanel(row); }}>
                                        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg border text-xs font-black w-14 shadow-lg ${getColorScore(row.liquidityRisk)}`}>
                                            {row.liquidityRisk}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedCDSPanel(row); }}>
                                        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg border text-xs font-black w-14 shadow-lg ${getColorScore(row.cdsRisk, false, true)}`}>
                                            {row.cdsRisk}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg border text-xs font-black w-14 ${getColorScore(row.macroScore, true)}`}>
                                            {row.macroScore}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.01] border border-dashed border-white/10 flex items-start gap-4 text-white/40">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p className="text-[0.65rem] font-medium leading-relaxed">
                    <strong className="text-white">How to read this board:</strong> Higher scores (Red) indicate elevated structural risk exposure to the specified macro factor. Click on any sector to instantly filter the main screener for drill-down analysis. Scores are derived from our proprietary aggregation of underlying company filings, forex sensitivity analysis, and state-level capex intensity. Click on a Liquidity score to view context.
                </p>
            </div>

            {/* Liquidity Risk Side Panel */}
            <AnimatePresence>
                {selectedSectorPanel && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setSelectedSectorPanel(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0A0D14] border-l border-white/10 z-50 p-6 flex flex-col shadow-2xl overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                                        <Activity size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white leading-none">{selectedSectorPanel.sector}</h3>
                                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-400">Liquidity Exposure Profile</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSectorPanel(null)} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-1">Transmission Risk</div>
                                        <div className={`text-2xl font-black ${selectedSectorPanel.liquidityRisk > 66 ? 'text-rose-400' : selectedSectorPanel.liquidityRisk > 33 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                            {selectedSectorPanel.liquidityRisk}/100
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-1">Sector Companies</div>
                                        <div className="text-2xl font-black text-white">{selectedSectorPanel.companyCount}</div>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                                    <h4 className="text-[0.65rem] font-bold uppercase tracking-widest text-blue-400 mb-2">Fundamental Driver</h4>
                                    <p className="text-sm text-blue-100/70 leading-relaxed font-medium">
                                        This sector's score is computed by correlating the current banking system CD ratio and RBI LAF net injection status against the sector's historical reliance on continuous credit expansion.
                                    </p>
                                    <button
                                        onClick={() => navigate('/funding')}
                                        className="mt-4 flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        View Live Liquidity Gauge <ArrowUpRight size={14} />
                                    </button>
                                </div>

                                <div>
                                    <h4 className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-3 border-b border-white/5 pb-2">Top 5 Most Exposed Constituents</h4>
                                    <div className="space-y-2">
                                        {selectedSectorPanel.topExposed.map((comp: any) => (
                                            <div key={comp.ticker} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(`/india-equities/${comp.ticker.replace('.NS', '')}`)}>
                                                <div>
                                                    <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{comp.ticker.replace('.NS', '')}</div>
                                                    <div className="text-[0.65rem] text-white/40 truncate max-w-[200px]">{comp.name}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">
                                                        Risk: {comp.cie_macro_signals?.[0]?.liquidity_transmission_lag || selectedSectorPanel.liquidityRisk}
                                                    </div>
                                                    <ArrowUpRight size={14} className="text-white/20 group-hover:text-white/80 transition-colors" />
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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setSelectedCDSPanel(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0A0D14] border-l border-white/10 z-50 p-6 flex flex-col shadow-2xl overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white leading-none">{selectedCDSPanel.sector}</h3>
                                        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-400">CDS Risk Profile</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCDSPanel(null)} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-1">5Y CDS Spread</div>
                                        <div className={`text-2xl font-black ${selectedCDSPanel.cdsRisk > 150 ? 'text-rose-400' : selectedCDSPanel.cdsRisk > 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                            {selectedCDSPanel.cdsRisk} bps
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-1">Monthly Change</div>
                                        <div className={`text-2xl font-black ${selectedCDSPanel.cdsMonthlyChange > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {selectedCDSPanel.cdsMonthlyChange > 0 ? '+' : ''}{selectedCDSPanel.cdsMonthlyChange} bps
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
                                    <h4 className="text-[0.65rem] font-bold uppercase tracking-widest text-purple-400 mb-2">Market Sentiment</h4>
                                    <p className="text-sm text-purple-100/70 leading-relaxed font-medium">
                                        This spread represents the market-implied cost of protecting against default. Elevated spreads in {selectedCDSPanel.sector} indicate rising structural concerns around leverage and debt serviceability compared to India's Sovereign 5Y CDS (Benchmark: 75 bps).
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-3 border-b border-white/5 pb-2">Top 5 Most Exposed Constituents</h4>
                                    <div className="space-y-2">
                                        {selectedCDSPanel.topExposed.map((comp: any) => (
                                            <div key={comp.ticker} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(`/india-equities/${comp.ticker.replace('.NS', '')}`)}>
                                                <div>
                                                    <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{comp.ticker.replace('.NS', '')}</div>
                                                    <div className="text-[0.65rem] text-white/40 truncate max-w-[200px]">{comp.name}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">
                                                        CDS: {comp.cie_macro_signals?.[0]?.cds_spread_bps || selectedCDSPanel.cdsRisk}
                                                    </div>
                                                    <ArrowUpRight size={14} className="text-white/20 group-hover:text-white/80 transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-white/[0.01] rounded-2xl border border-white/5">
                                    <h4 className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-2">Linked Macro Drivers</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-white/5 rounded text-[0.6rem] font-bold text-white/60">Liquidity Stress</span>
                                        <span className="px-2 py-1 bg-white/5 rounded text-[0.6rem] font-bold text-white/60">Fiscal Health</span>
                                        <span className="px-2 py-1 bg-white/5 rounded text-[0.6rem] font-bold text-white/60">FX Volatility</span>
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
