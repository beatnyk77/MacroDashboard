import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Activity,
    Shield,
    Zap,
    Download,
    LineChart,
    Building2,
    Globe
} from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Link } from 'react-router-dom';
import { Screener } from '@/features/CIE/Screener';
import { QuarterlyAggregator } from '@/features/CIE/QuarterlyAggregator';
import { InstitutionalWatchlists } from '@/features/CIE/InstitutionalWatchlists';
import { RiskExposureHeatmap } from '@/features/CIE/RiskExposureHeatmap';
import { PromoterActivityHeatmap } from '@/features/CIE/PromoterActivityHeatmap';
import { BulkBlockReport } from '@/features/CIE/BulkBlockReport';
import { Flame, Briefcase } from 'lucide-react';

export const CorporateIndiaEngine: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'screener' | 'heatmap' | 'aggregates' | 'watchlists' | 'promoters' | 'deals'>('screener');

    return (
        <div className="min-h-screen bg-[#050810] text-gray-100">
            {/* CIE Hero / Navigation Header */}
            <header className="pt-24 pb-12 border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <nav className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/40 mb-8">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <Link to="/intel/india" className="hover:text-white transition-colors">India Intel</Link>
                        <span>/</span>
                        <span className="text-blue-400">Corporate Engine</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[0.65rem] font-black uppercase tracking-widest mb-4">
                                <Activity size={12} /> Institutional Equity Lab
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-tight">
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
                            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 text-white text-[0.7rem] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/10">
                                <Download size={14} /> Export signals
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 text-[0.7rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                <Search size={14} /> Global Search
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Macro Score Summary Cards */}
            <section className="py-12 border-b border-white/5 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Macro-Corporate Health', value: '72/100', trend: '+1.2%', icon: Activity, color: 'blue', desc: 'Aggregate resilience of Nifty 500' },
                            { label: 'Formalization Premium', value: '84.5', trend: '+4.5%', icon: Zap, color: 'orange', desc: 'Beneficiaries of DPI structural shift' },
                            { label: 'Oil Sensitivity Index', value: 'High', trend: 'Neutral', icon: Globe, color: 'rose', desc: 'Current impact of rupee-oil basket' },
                            { label: 'State-Capex Resilience', value: 'Strong', trend: '+0.8%', icon: Building2, color: 'emerald', desc: 'Corporate exposure to state spending' },
                        ].map((stat) => (
                            <div key={stat.label} className="p-5 rounded-2xl border border-white/5 bg-black/20 hover:border-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                        <stat.icon size={18} />
                                    </div>
                                    <span className="text-[0.6rem] font-black text-emerald-400">{stat.trend}</span>
                                </div>
                                <h4 className="text-[0.65rem] font-black uppercase tracking-widest text-white/40 mb-1">{stat.label}</h4>
                                <div className="text-2xl font-black text-white mb-2">{stat.value}</div>
                                <p className="text-[0.6rem] text-muted-foreground/40 leading-tight">{stat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Application Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
                <div className="flex flex-col gap-10">

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-8 border-b border-white/5 pb-1">
                        {[
                            { id: 'screener', label: 'Macro Screener', icon: Filter },
                            { id: 'heatmap', label: 'Risk Exposure', icon: Flame },
                            { id: 'aggregates', label: 'Quarterly Results Aggregator', icon: LineChart },
                            { id: 'watchlists', label: 'Institutional Watchlists', icon: Shield },
                            { id: 'promoters', label: 'Promoter Activity', icon: Activity },
                            { id: 'deals', label: 'Institutional Deals', icon: Briefcase },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 pb-4 text-[0.7rem] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-blue-400' : 'text-white/30 hover:text-white/60'
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                                    />
                                )}
                            </button>
                        ))}
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
                            </motion.div>
                        </AnimatePresence>
                    </SectionErrorBoundary>

                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-4 sm:px-8 py-12 border-t border-white/5">
                <div className="flex justify-between items-center text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/30">
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
