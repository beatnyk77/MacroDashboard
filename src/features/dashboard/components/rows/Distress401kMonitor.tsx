import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    ShieldAlert, TrendingUp, Wallet, ArrowUpRight,
    AlertTriangle, Info, Building2
} from 'lucide-react';
import { use401kDistress } from '@/hooks/use401kDistress';
import { motion } from 'framer-motion';

export const Distress401kMonitor: React.FC = () => {
    const { data: distressData, isLoading, error } = use401kDistress();

    const latest = useMemo(() => {
        if (!distressData || distressData.length === 0) return null;
        return distressData[distressData.length - 1];
    }, [distressData]);

    if (isLoading) {
        return (
            <div className="h-[400px] w-full bg-white/[0.02] animate-pulse rounded-3xl flex items-center justify-center">
                <span className="text-[0.6rem] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Syncing 401(k) Telemetry...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl">
                <div className="flex items-center text-rose-500 mb-2 font-black uppercase text-xs tracking-widest">
                    <AlertTriangle size={14} className="mr-2" /> Signal Interruption
                </div>
                <p className="text-muted-foreground text-sm font-mono italic">Failed to ingest 401(k) distress vector.</p>
            </div>
        );
    }

    const getZScoreColor = (score: number) => {
        if (score > 7) return '#f43f5e'; // Danger
        if (score > 4) return '#f59e0b'; // Warning
        return '#10b981'; // Safe
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Gauge & Status */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group h-full flex flex-col justify-between">
                        <div className="absolute inset-0 bg-rose-500/5 blur-3xl -z-10 group-hover:bg-rose-500/10 transition-colors" />

                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[0.6rem] font-black text-white/40 uppercase tracking-[0.3em]">
                                    Distress Z-Score
                                </span>
                            </div>

                            <div className="text-center py-10">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="inline-block relative"
                                >
                                    <span className="text-7xl font-black italic tracking-tighter" style={{ color: getZScoreColor(latest?.distress_zscore || 0) }}>
                                        {(latest?.distress_zscore || 0).toFixed(1)}
                                    </span>
                                    <div className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mt-2">
                                        Composite Index
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">Hardship Rate</span>
                                <span className="text-sm font-black text-white">{latest?.vanguard_hardship_pct}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">Loan Trigger</span>
                                <span className="text-sm font-black text-white">{latest?.fidelity_loan_pct}%</span>
                            </div>
                            <div className="pt-4 flex items-center gap-2">
                                <ShieldAlert size={14} className="text-rose-500" />
                                <span className="text-[0.55rem] font-black text-rose-500 uppercase tracking-widest">
                                    {(latest?.distress_zscore || 0) > 5 ? 'High Recessionary Pressure' : 'Structural Low Stress'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Trend Chart */}
                <div className="lg:col-span-8">
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">
                                    Transition Analysis
                                </h3>
                                <p className="text-[0.6rem] text-muted-foreground/60 mt-1 uppercase tracking-widest">
                                    Vanguard Hardship % vs Fidelity Loan %
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span className="text-[0.55rem] font-black text-muted-foreground uppercase tracking-widest">Vanguard</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-[0.55rem] font-black text-muted-foreground uppercase tracking-widest">Fidelity</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={distressData}>
                                    <defs>
                                        <linearGradient id="colorVanguard" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorFidelity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 700 }}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
                                    />
                                    <YAxis
                                        hide
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0B1121', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <Area type="monotone" dataKey="vanguard_hardship_pct" stroke="#f43f5e" fillOpacity={1} fill="url(#colorVanguard)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="fidelity_loan_pct" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFidelity)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Proxy Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <Wallet size={18} />
                        </div>
                        <div>
                            <div className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">Savings Rate</div>
                            <div className="text-lg font-black text-white">{latest?.savings_rate_proxy}%</div>
                        </div>
                    </div>
                    <ArrowUpRight size={16} className="text-white/10 group-hover:text-emerald-500 transition-colors" />
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <div className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">ICI Loan Balance</div>
                            <div className="text-lg font-black text-white">{latest?.ici_loan_balance_pct}%</div>
                        </div>
                    </div>
                    <ArrowUpRight size={16} className="text-white/10 group-hover:text-blue-500 transition-colors" />
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <div className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">Consumer Conf.</div>
                            <div className="text-lg font-black text-white">{latest?.consumer_confidence_proxy}</div>
                        </div>
                    </div>
                    <ArrowUpRight size={16} className="text-white/10 group-hover:text-amber-500 transition-colors" />
                </div>
            </div>

            <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.03] border border-white/5">
                    <Info size={14} className="text-rose-400" />
                    <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">
                        Sources: Live Synthetic Telemetry via FRED (DRCCLACBS / PSAVERT Proxies)
                    </span>
                </div>
            </div>
        </div>
    );
};
