import React from 'react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { SectionHeader } from '@/components/SectionHeader';
import { cn } from '@/lib/utils';
import { m } from 'framer-motion';
import { Landmark, ArrowUpRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const IndiaExternalSectorPanel: React.FC = () => {
    const { data: reserves, isLoading: reservesLoading } = useLatestMetric('IN_FX_RESERVES');
    const { data: us10y, isLoading: us10yLoading } = useLatestMetric('US_10Y_YIELD');
    const { data: coverage, isLoading: coverageLoading } = useLatestMetric('BOP_RESERVES_MONTHS');
    const { data: fii, isLoading: fiiLoading } = useLatestMetric('IN_FII_CASH_NET');

    const isLoading = reservesLoading || us10yLoading || coverageLoading || fiiLoading;

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
                        subtitle="FX reserves, reserve coverage, external funding, and institutional cash flows"
                    />
                </div>

                {/* 2x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* METRIC 1: India 10Y G-Sec */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1 block">Yield telemetry</span>
                        <h3 className="text-lg font-black text-white uppercase tracking-heading">India FX Reserves</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-all border border-white/5">
                                <Landmark className="w-5 h-5 text-amber-500" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl md:text-5xl font-black text-white tracking-heading tabular-nums">
                                    {reserves?.value != null ? `${reserves.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
                                </span>
                            </div>
                            {reserves && reserves.delta !== null && (
                                <p className={cn(
                                    "text-xs font-mono font-bold mt-2 flex items-center gap-1",
                                    reserves.delta > 0 ? "text-emerald-400" : reserves.delta < 0 ? "text-rose-400" : "text-slate-400"
                                )}>
                                    {reserves.delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {reserves.delta > 0 ? '+' : ''}{reserves.delta.toFixed(0)} {reserves.deltaPeriod}
                                </p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">USD million · FRED</span>
                            <DataProvenanceBadge
                                source="RBI DBIE"
                                lastVerified={reserves?.lastUpdated}
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* METRIC 2: US 10Y Treasury */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1 block">Arbitrage & Carry</span>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-white uppercase tracking-heading">US 10Y Treasury</h3>
                                </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-all border border-white/5">
                                <ArrowUpRight className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>

                        <div className="mb-6 space-y-4">
                            <div>
                                <span className="text-4xl md:text-5xl font-black text-white tracking-heading tabular-nums">
                                    {us10y?.value != null ? `${us10y.value.toFixed(2)}%` : '--'}
                                </span>
                            </div>

                            <div className="flex flex-col items-start gap-2">
                                <span className="px-3 py-1 rounded-md text-[10px] font-black tracking-widest border font-mono text-blue-300 bg-blue-500/10 border-blue-500/20">LIVE TREASURY CURVE INPUT</span>
                                <p className="text-xs font-bold text-muted-foreground/60 leading-relaxed italic">FRED 10-year Treasury yield used as the external funding reference.</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Proprietary Signal</span>
                            <DataProvenanceBadge source="FRED" lastVerified={us10y?.lastUpdated} size="sm" />
                        </div>
                    </div>

                    {/* METRIC 3: Reserve Coverage */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1 block">Balance of Payments</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-heading">Reserve Coverage</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-all border border-white/5">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>

                        <div className="mb-6">
                            {coverage?.value != null ? (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-4xl md:text-5xl font-black tracking-heading tabular-nums",
                                            coverage.value >= 6 ? "text-emerald-400" : coverage.value >= 4 ? "text-amber-400" : "text-rose-400"
                                        )}>
                                            {coverage.value.toFixed(2)}
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground/40 font-mono">USD</span>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground/50 mt-2">
                                        Months of imports covered
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
                            {coverage?.value != null && (
                                <DataProvenanceBadge
                                    source="RBI DBIE"
                                    lastVerified={coverage.lastUpdated}
                                    size="sm"
                                />
                            )}
                        </div>
                    </div>

                    {/* METRIC 4: FII Cash Flow */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1 block">Trade flows</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-heading">FII Cash Equity Flow</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03] group-hover:scale-110 transition-all border border-white/5">
                                <DollarSign className="w-5 h-5 text-cyan-400" />
                            </div>
                        </div>

                        <div className="mb-6">
                            {fii?.value != null ? (
                                <>
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-4xl md:text-5xl font-black tracking-heading tabular-nums",
                                            fii.value >= 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {fii.value >= 0 ? '+' : ''}{fii.value.toFixed(2)}
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground/40 font-mono">USD</span>
                                    </div>
                                        {fii.delta !== null && (
                                        <p className={cn(
                                            "text-xs font-mono font-bold mt-2 flex items-center gap-1",
                                            fii.delta > 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {fii.delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {fii.delta > 0 ? '+' : ''}{fii.delta.toFixed(2)} {fii.deltaPeriod}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="py-4">
                                    <DataProvenanceBadge
                                    source="NSE"
                                    methodology="Validated daily cash flow"
                                    lastVerified={fii?.lastUpdated ?? null}
                                        size="sm"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-uppercase">Goods & Services</span>
                            {fii?.value != null && (
                                <DataProvenanceBadge
                                    source="RBI DBIE"
                                    lastVerified={fii.lastUpdated}
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
