import React from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { GQSignalBadge } from '@/components/GQSignalBadge';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { SectionHeader } from '@/components/SectionHeader';
import { cn } from '@/lib/utils';
import { m } from 'framer-motion';
import { Landmark, ArrowUpRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const IndiaExternalSectorPanel: React.FC = () => {
    const { data: gsec, isLoading: gsecLoading } = useLatestMetric('india_gsec_10y');
    const { data: us10y, isLoading: us10yLoading } = useLatestMetric('us_10y_yield');
    const { data: cab, isLoading: cabLoading } = useLatestMetric('india_current_account_usd_bn');
    const { data: trade, isLoading: tradeLoading } = useLatestMetric('india_trade_balance_usd_bn');

    const isLoading = gsecLoading || us10yLoading || cabLoading || tradeLoading;

    // Compute Spread
    const hasSpreadData = gsec?.value != null && us10y?.value != null;
    const spread = hasSpreadData ? gsec.value - us10y.value : null;

    let carryText = "NO SIGNAL";
    let carryClass = "text-slate-400 bg-slate-500/10 border-slate-500/20";
    let interpretationText = "Spread data unavailable";

    if (spread !== null) {
        if (spread > 4.0) {
            carryText = "CARRY ATTRACTIVE";
            carryClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            interpretationText = "India premium attractive for FII debt flows";
        } else if (spread >= 3.0) {
            carryText = "CARRY NEUTRAL";
            carryClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
            interpretationText = "Neutral carry — watch RBI rate path";
        } else {
            carryText = "CARRY COMPRESSED";
            carryClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
            interpretationText = "Compressed spread — FII debt outflow risk";
        }
    }

    if (isLoading) {
        return (
            <div className="h-[400px] w-full bg-white/[0.02] animate-pulse rounded-[2.5rem] flex items-center justify-center border border-white/5">
                <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest font-mono">
                    Analyzing India External Sector & Capital Flows...
                </span>
            </div>
        );
    }

    return (
        <section id="external-sector" className="py-12 scroll-mt-24">
            <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                    <SectionHeader
                        title="EXTERNAL SECTOR & CAPITAL FLOWS"
                        subtitle="Sovereign spreads, capital accounts, and trade balance dynamics"
                    />
                </div>

                {/* 2x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* METRIC 1: India 10Y G-Sec */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1 block">Yield telemetry</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-heading">India 10Y G-Sec</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-all border border-white/5">
                                <Landmark className="w-5 h-5 text-amber-500" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl md:text-5xl font-black text-white tracking-heading tabular-nums">
                                    {gsec?.value != null ? `${gsec.value.toFixed(2)}%` : '--'}
                                </span>
                            </div>
                            {gsec && gsec.delta !== null && (
                                <p className={cn(
                                    "text-xs font-mono font-bold mt-2 flex items-center gap-1",
                                    gsec.delta > 0 ? "text-rose-400" : gsec.delta < 0 ? "text-emerald-400" : "text-slate-400"
                                )}>
                                    {gsec.delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {gsec.delta > 0 ? '+' : ''}{(gsec.delta * 100).toFixed(0)} bps {gsec.deltaPeriod}
                                </p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Sovereign Benchmark</span>
                            <DataProvenanceBadge
                                source="RBI DBIE"
                                lastVerified={gsec?.lastUpdated}
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* METRIC 2: India-US 10Y Spread (PROPRIETARY) */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1 block">Arbitrage & Carry</span>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-white uppercase tracking-heading">India-US 10Y Spread</h3>
                                    <GQSignalBadge href="/methods/india-credit-cycle-clock" />
                                </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-all border border-white/5">
                                <ArrowUpRight className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>

                        <div className="mb-6 space-y-4">
                            <div>
                                <span className="text-4xl md:text-5xl font-black text-white tracking-heading tabular-nums">
                                    {spread !== null ? `${spread.toFixed(2)}%` : '--'}
                                </span>
                            </div>

                            <div className="flex flex-col items-start gap-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-black tracking-widest border font-mono",
                                    carryClass
                                )}>
                                    {carryText}
                                </span>
                                <p className="text-xs font-bold text-muted-foreground/60 leading-relaxed italic">
                                    "{interpretationText}"
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Proprietary Signal</span>
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase font-mono">Computed Real-time</span>
                        </div>
                    </div>

                    {/* METRIC 3: Current Account Balance */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1 block">Balance of Payments</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-heading">Current Account Balance</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-all border border-white/5">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>

                        <div className="mb-6">
                            {cab?.value != null ? (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-4xl md:text-5xl font-black tracking-heading tabular-nums",
                                            cab.value >= 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {cab.value >= 0 ? '+' : ''}{cab.value.toFixed(2)}B
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground/40 font-mono">USD</span>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground/50 mt-2">
                                        Frequency: {cab.frequency || 'Quarterly'}
                                    </p>
                                </>
                            ) : (
                                <div className="py-4">
                                    <DataProvenanceBadge
                                        source="RBI DBIE — Quarterly"
                                        methodology="Pending data ingestion"
                                        lastVerified={null}
                                        size="sm"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">External Account</span>
                            {cab?.value != null && (
                                <DataProvenanceBadge
                                    source="RBI DBIE"
                                    lastVerified={cab.lastUpdated}
                                    size="sm"
                                />
                            )}
                        </div>
                    </div>

                    {/* METRIC 4: Trade Balance (Monthly) */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1 block">Trade flows</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-heading">Trade Balance (Monthly)</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-all border border-white/5">
                                <DollarSign className="w-5 h-5 text-cyan-400" />
                            </div>
                        </div>

                        <div className="mb-6">
                            {trade?.value != null ? (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-4xl md:text-5xl font-black tracking-heading tabular-nums",
                                            trade.value >= 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {trade.value >= 0 ? '+' : ''}{trade.value.toFixed(2)}B
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground/40 font-mono">USD</span>
                                    </div>
                                    {trade.delta !== null && (
                                        <p className={cn(
                                            "text-xs font-mono font-bold mt-2 flex items-center gap-1",
                                            trade.delta > 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {trade.delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {trade.delta > 0 ? '+' : ''}{trade.delta.toFixed(2)}B {trade.deltaPeriod}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="py-4">
                                    <DataProvenanceBadge
                                        source="RBI DBIE — Quarterly"
                                        methodology="Pending data ingestion"
                                        lastVerified={null}
                                        size="sm"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Goods & Services</span>
                            {trade?.value != null && (
                                <DataProvenanceBadge
                                    source="RBI DBIE"
                                    lastVerified={trade.lastUpdated}
                                    size="sm"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </m.div>
        </section>
    );
};
