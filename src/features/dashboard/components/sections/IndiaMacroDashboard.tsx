import React from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Minus, Calendar, ShieldAlert } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIndiaMacroSnapshot } from '@/hooks/useIndiaMacroSnapshot';

export const IndiaMacroDashboard: React.FC = () => {
    const { data: snapshot, isLoading } = useIndiaMacroSnapshot();

    if (isLoading) {
        return (
            <div className="h-[600px] w-full rounded-[2.5rem] bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-blue-500/20 animate-spin" />
                    <span className="text-xs font-black uppercase tracking-uppercase text-white/20">Syncing Snapshot...</span>
                </div>
            </div>
        );
    }

    if (!snapshot) return null;

    const months = ["Nov-25", "Dec-25", "Jan-26", "Feb-26", "Mar-26", "Apr-26"];

    return (
        <div className="relative space-y-8">
            {/* Main Container */}
            <div className="p-8 md:p-12 rounded-[3rem] bg-[#0A0F1C]/80 border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8 mb-16">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-uppercase text-emerald-400">Monthly Snapshot</span>
                            </div>
                            <span className="text-xs font-black uppercase tracking-uppercase text-white/20">India Macro Pulse</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-heading text-white leading-none">
                            INDIA MACRO <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">DASHBOARD</span>
                        </h2>
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400/80 uppercase tracking-widest">
                                <Calendar size={14} />
                                APRIL 2026
                            </div>
                            <div className="h-4 w-[1px] bg-white/10" />
                            <div className="text-xs font-medium text-white/40 italic">
                                Geopolitical uncertainties weigh heavily on cross-border flows
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:max-w-md p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium">
                                {snapshot.geopolitical_summary}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Table Grid */}
                <div className="relative z-10 overflow-x-auto -mx-8 md:-mx-12 px-8 md:px-12 pb-8 scrollbar-hide">
                    <div className="min-w-[1000px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1.5fr_repeat(6,1fr)] gap-4 px-6 py-4 border-b border-white/10 text-[10px] font-black uppercase tracking-uppercase text-white/40">
                            <div>Metric Category</div>
                            {months.map(m => (
                                <div key={m} className={cn("text-center", m === "Apr-26" ? "text-blue-400" : "")}>{m}</div>
                            ))}
                        </div>

                        {/* Table Rows */}
                        <div className="mt-4 space-y-1">
                            {snapshot.metrics_data?.map((metric, idx) => (
                                <motion.div
                                    key={metric.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={cn(
                                        "grid grid-cols-[1.5fr_repeat(6,1fr)] gap-4 px-6 py-4 rounded-xl items-center group transition-all duration-200 border border-transparent",
                                        metric.status === 'positive' ? "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] hover:border-emerald-500/10" :
                                        metric.status === 'neutral' ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.06] hover:border-amber-500/10" :
                                        "bg-rose-500/[0.03] hover:bg-rose-500/[0.06] hover:border-rose-500/10"
                                    )}
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black text-white/90 group-hover:text-white transition-colors">
                                            {metric.name}
                                        </span>
                                        {metric.unit && (
                                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{metric.unit}</span>
                                        )}
                                    </div>
                                    {months.map(m => {
                                        const val = metric.values?.[m];
                                        return (
                                            <div key={m} className={cn(
                                                "text-sm font-mono text-center tabular-nums",
                                                val === undefined || val === null ? "text-white/5" : "text-white/70",
                                                m === "Apr-26" && val !== undefined && val !== null ? "font-black text-white" : ""
                                            )}>
                                                {val === undefined || val === null ? '--' : val.toLocaleString(undefined, {
                                                    minimumFractionDigits: typeof val === 'number' && val < 10 && val % 1 !== 0 ? 2 : 0,
                                                    maximumFractionDigits: 2
                                                })}
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legend Section */}
                <div className="flex items-center justify-center gap-8 py-8 border-t border-white/5 mt-8">
                    {[
                        { label: 'Positive', color: 'bg-emerald-500' },
                        { label: 'Neutral', color: 'bg-amber-500' },
                        { label: 'Negative', color: 'bg-rose-500' }
                    ].map(l => (
                        <div key={l.label} className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-sm", l.color)} />
                            <span className="text-[10px] font-black uppercase tracking-uppercase text-white/40">{l.label}</span>
                        </div>
                    ))}
                </div>

                {/* Insights Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                    {/* Positive Insights */}
                    <div className="p-8 rounded-[2rem] bg-emerald-500/[0.02] border border-emerald-500/10 space-y-6 group hover:bg-emerald-500/[0.04] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-uppercase text-emerald-500">Positive Signals</h4>
                        </div>
                        <ul className="space-y-4">
                            {snapshot.insights_positive?.map((insight, i) => (
                                <li key={i} className="text-xs text-white/50 leading-relaxed font-medium flex gap-3">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500/40 mt-1.5 flex-shrink-0" />
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Neutral Insights */}
                    <div className="p-8 rounded-[2rem] bg-amber-500/[0.02] border border-amber-500/10 space-y-6 group hover:bg-amber-500/[0.04] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Minus className="w-4 h-4 text-amber-500" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-uppercase text-amber-500">Structural Neutral</h4>
                        </div>
                        <ul className="space-y-4">
                            {snapshot.insights_neutral?.map((insight, i) => (
                                <li key={i} className="text-xs text-white/50 leading-relaxed font-medium flex gap-3">
                                    <div className="w-1 h-1 rounded-full bg-amber-500/40 mt-1.5 flex-shrink-0" />
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Negative Insights */}
                    <div className="p-8 rounded-[2rem] bg-rose-500/[0.02] border border-rose-500/10 space-y-6 group hover:bg-rose-500/[0.04] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <TrendingDown className="w-4 h-4 text-rose-500" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-uppercase text-rose-500">Macro Fragilities</h4>
                        </div>
                        <ul className="space-y-4">
                            {snapshot.insights_negative?.map((insight, i) => (
                                <li key={i} className="text-xs text-white/50 leading-relaxed font-medium flex gap-3">
                                    <div className="w-1 h-1 rounded-full bg-rose-500/40 mt-1.5 flex-shrink-0" />
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Backdrop Blur Elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
};
