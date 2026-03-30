import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Filter,
    Activity,
    Shield,
    Zap,
    Download,
    LineChart,
    Building2,
    Globe,
    Flame,
    Briefcase,
    TrendingDown,
    Ship
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Screener } from '@/features/CIE/Screener';
import { QuarterlyAggregator } from '@/features/CIE/QuarterlyAggregator';
import { InstitutionalWatchlists } from '@/features/CIE/InstitutionalWatchlists';
import { RiskExposureHeatmap } from '@/features/CIE/RiskExposureHeatmap';
import { PromoterActivityHeatmap } from '@/features/CIE/PromoterActivityHeatmap';
import { BulkBlockReport } from '@/features/CIE/BulkBlockReport';
import { ShortSellingReport } from '@/features/CIE/ShortSellingReport';
import { UpcomingIPOs } from '@/features/CIE/UpcomingIPOs';
import { SEOManager } from '@/components/SEOManager';

export const CorporateIndiaEngine: React.FC = () => {
    const { tool } = useParams<{ tool: string }>();
    const navigate = useNavigate();
    const activeTab = tool || 'screener';
    
    const setActiveTab = (tab: string) => {
        navigate(`/india-equities/${tab}`);
    };
    const [showMacroOverlay, setShowMacroOverlay] = useState(true);

    const { data: globalStats } = useQuery({
        queryKey: ['cie-global-stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_macro_signals')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(500);

            if (error || !data) return null;

            const avg = (key: string) => data.reduce((acc, s) => acc + (s[key] || 0), 0) / data.length;

            return {
                health: Math.round(avg('macro_impact_score')),
                formalization: avg('formalization_premium').toFixed(1),
                oilSens: avg('oil_sensitivity'),
                stateRes: avg('state_resilience')
            };
        }
    });

    const stats = [
        { label: 'Macro-Corporate Health', value: `${globalStats?.health || 72}/100`, trend: '+1.2%', icon: Activity, color: 'blue', desc: 'Aggregate resilience of Nifty 500' },
        { label: 'Formalization Premium', value: globalStats?.formalization || '84.5', trend: '+4.5%', icon: Zap, color: 'orange', desc: 'Beneficiaries of DPI structural shift' },
        { label: 'Oil Sensitivity Index', value: (globalStats?.oilSens || 50) > 60 ? 'High' : (globalStats?.oilSens || 50) > 30 ? 'Moderate' : 'Low', trend: 'Neutral', icon: Globe, color: 'rose', desc: 'Current impact of rupee-oil basket' },
        { label: 'State-Capex Resilience', value: (globalStats?.stateRes || 50) > 70 ? 'Strong' : (globalStats?.stateRes || 50) > 40 ? 'Moderate' : 'Weak', trend: '+0.8%', icon: Building2, color: 'emerald', desc: 'Corporate exposure to state spending' },
    ];

    return (
        <div className="min-h-screen bg-[#050810] text-gray-100">
            <SEOManager 
                title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} | Corporate India Engine`}
                description="Institutional fundamental terminal for Indian equities integrated with high-frequency macro telemetry. Filter for structural resilience, state-wise exposure, and formalization premiums."
                keywords={['Corporate India', 'Equity Screener', 'Nifty 500 Fundamentals', 'Macro-Corporate Health', activeTab]}
            />
            {/* CIE Hero / Navigation Header */}
            <header className="pt-24 pb-12 border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-uppercase text-muted-foreground/40 mb-8">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <Link to="/intel/india" className="hover:text-white transition-colors">India Intel</Link>
                        <span>/</span>
                        <span className="text-blue-400">Corporate Engine</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-uppercase mb-4">
                                <Activity size={12} /> Institutional Equity Lab
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-heading text-white leading-tight">
                                Corporate India<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">
                                    Engine v1.0
                                </span>
                            </h1>
                            <p className="mt-4 text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed font-medium">
                                The first institutional-grade fundamental terminal for Indian equities integrated with high-frequency macro telemetry. Filter for structural resilience, state-wise exposure, and formalization premiums.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 py-2">
                            <div className="flex items-center bg-white/5 border border-white/12 rounded-2xl p-1">
                                <button
                                    onClick={() => setShowMacroOverlay(true)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-uppercase transition-all ${showMacroOverlay ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-muted-foreground/60 hover:text-white'}`}
                                >
                                    Macro Overlay On
                                </button>
                                <button
                                    onClick={() => setShowMacroOverlay(false)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-uppercase transition-all ${!showMacroOverlay ? 'bg-white/10 text-white' : 'text-muted-foreground/60 hover:text-white'}`}
                                >
                                    Pure Fundamentals
                                </button>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/12 text-white/80 text-xs font-black uppercase tracking-uppercase hover:bg-white/10 transition-all">
                                <Download size={14} /> Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Macro Score Summary Cards - Narrative Row */}
            <section className="py-12 border-b border-white/5 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="flex flex-col lg:flex-row gap-12 mb-12">
                        <div className="lg:w-1/3">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <Shield className="text-blue-400" size={16} />
                                <span className="text-xs font-black uppercase tracking-uppercase text-blue-400/60">CIE Intelligence Brief</span>
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-heading mb-4">The Formalization Convergence</h2>
                            <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium">
                                Tracking the structural pivot from informal to formal credit. We prioritize companies capturing the <span className="text-blue-400 font-bold italic">Formalization Premium</span> — where DPI (Digital Public Infrastructure) integration and state-capex resilience intersect with pure-play fundamentals.
                            </p>
                        </div>
                        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.map((stat) => (
                                <div key={stat.label} className="p-6 rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-md hover:border-blue-500/30 transition-all group relative overflow-hidden flex items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-1.5 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                                <stat.icon size={16} />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-uppercase text-white/40">{stat.label}</h4>
                                        </div>
                                        <div className="text-2xl font-black text-white italic tracking-heading">{stat.value}</div>
                                        <p className="text-xs text-muted-foreground/30 mt-1 font-medium">{stat.desc}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-xs font-black text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]">{stat.trend}</span>
                                        {showMacroOverlay && (
                                            <Activity size={24} className="text-blue-500/20" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Application Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
                <div className="flex flex-col gap-10">

                    {/* Navigation Tabs - Scrollable on Mobile */}
                    <div className="relative group">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 border-b border-white/5">
                            {[
                                { id: 'screener', label: 'Macro Screener', icon: Filter },
                                { id: 'heatmap', label: 'Risk Exposure', icon: Flame },
                                { id: 'aggregates', label: 'Aggregates', icon: LineChart },
                                { id: 'watchlists', label: 'Watchlists', icon: Shield },
                                { id: 'promoters', label: 'Promoters', icon: Activity },
                                { id: 'deals', label: 'Deals', icon: Briefcase },
                                { id: 'shortSelling', label: 'Shorts', icon: TrendingDown },
                                { id: 'ipos', label: 'IPOs', icon: Ship },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-uppercase whitespace-nowrap transition-all relative group/tab ${activeTab === tab.id ? 'text-blue-400' : 'text-white/30 hover:text-white/60'
                                        }`}
                                >
                                    <tab.icon size={14} className={activeTab === tab.id ? 'text-blue-400' : 'text-white/20 group-hover/tab:text-white/40'} />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="tab-underline"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        {/* Indicative Fade for Scroll */}
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#050810] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Content Section */}
                    <SectionErrorBoundary name="Corporate Engine Content">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {activeTab === 'screener' && <Screener />}
                                {activeTab === 'heatmap' && <RiskExposureHeatmap />}
                                {activeTab === 'aggregates' && <QuarterlyAggregator />}
                                {activeTab === 'watchlists' && <InstitutionalWatchlists />}
                                {activeTab === 'promoters' && <PromoterActivityHeatmap />}
                                {activeTab === 'deals' && <BulkBlockReport />}
                                {activeTab === 'shortSelling' && <ShortSellingReport />}
                                {activeTab === 'ipos' && <UpcomingIPOs />}
                            </motion.div>
                        </AnimatePresence>
                    </SectionErrorBoundary>

                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-4 sm:px-8 py-12 border-t border-white/5">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-uppercase text-muted-foreground/30">
                    <span>GraphiQuestor CIE Engine Alpha</span>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Term of use</a>
                        <a href="#" className="hover:text-white transition-colors">Methodology</a>
                        <a href="#" className="hover:text-white transition-colors">Data Partners</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CorporateIndiaEngine;
