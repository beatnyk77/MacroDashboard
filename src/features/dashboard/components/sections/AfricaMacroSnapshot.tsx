import React from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Calendar, ShieldAlert } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAfricaMacroSnapshot } from '@/hooks/useAfricaMacroSnapshot';

export const AfricaMacroSnapshot: React.FC = () => {
    const { data: snapshot, isLoading } = useAfricaMacroSnapshot();

    if (isLoading) {
        return (
            <div className="h-[400px] w-full rounded-[2.5rem] bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-blue-500/20 animate-spin" />
                    <span className="text-xs font-black uppercase tracking-uppercase text-white/20">Syncing Africa Snapshot...</span>
                </div>
            </div>
        );
    }

    if (!snapshot) return null;

    return (
        <div className="relative space-y-8">
            {/* Main Container */}
            <div className="p-8 md:p-12 rounded-[3rem] bg-[#0A0F1C]/80 border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Header Section */}
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8 mb-16">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-uppercase text-blue-400">Monthly Snapshot</span>
                            </div>
                            <span className="text-xs font-black uppercase tracking-uppercase text-white/20">Africa Macro Pulse</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-heading text-white leading-none">
                            AFRICA MACRO <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">PULSE</span>
                        </h2>
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400/80 uppercase tracking-widest">
                                <Calendar size={14} />
                                {new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                            </div>
                            <div className="h-4 w-[1px] bg-white/10" />
                            <div className="text-xs font-medium text-white/40 italic">
                                Continental fiscal stress remains elevated as debt servicing peaks
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:max-w-md p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                            <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium">
                                {snapshot.continent_summary}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {snapshot.metrics_summary?.map((metric) => (
                        <div key={metric.name} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                            <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">{metric.name}</div>
                            <div className="flex items-end gap-2">
                                <div className="text-2xl font-black text-white tabular-nums">{metric.value}{metric.unit}</div>
                                <div className={cn(
                                    "flex items-center mb-1",
                                    metric.trend === 'up' ? "text-rose-500" : "text-emerald-500"
                                )}>
                                    {metric.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Insights Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
                    {/* Positive Insights */}
                    <div className="p-8 rounded-[2rem] bg-emerald-500/[0.02] border border-emerald-500/10 space-y-6 group hover:bg-emerald-500/[0.04] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-uppercase text-emerald-500">Growth Drivers</h4>
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
                            <h4 className="text-xs font-black uppercase tracking-uppercase text-rose-500">Fiscal Fragilities</h4>
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
