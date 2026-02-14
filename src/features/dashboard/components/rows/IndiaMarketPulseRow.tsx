import React from 'react';
import { useIndiaMarketPulse } from '@/hooks/useIndiaMarketPulse';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import { formatNumber } from '@/utils/formatNumber';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export const IndiaMarketPulseRow: React.FC = () => {
    const { data: result, isLoading } = useIndiaMarketPulse();
    const data = result?.current;

    if (isLoading || !data) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl bg-white/[0.02] animate-pulse" />
                ))}
            </div>
        );
    }

    const localAbsorption = data.fii_cash_net < 0 && data.dii_cash_net > 0
        ? (data.dii_cash_net / Math.abs(data.fii_cash_net)).toFixed(2)
        : 'N/A';

    const breadthRatio = (data.advances + data.declines) > 0
        ? ((data.advances - data.declines) / (data.advances + data.declines)).toFixed(2)
        : '0.00';

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.4 }
        })
    };

    return (
        <SPASection id="india-market-pulse-row" className="py-12" disableAnimation>
            <div className="mb-12 flex justify-between items-end">
                <SectionHeader
                    title="India Market Pulse"
                    subtitle="Daily institutional microstructure and capital flow intelligence"
                />
                <div className="flex gap-2 mb-2">
                    <div className="px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-[0.6rem] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
                        <Activity size={10} /> Live NSE Data
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* 1. Flow Summary */}
                <motion.div
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-6 hover:border-white/10 transition-all duration-300"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
                                Flow Summary
                            </div>
                            <div className="flex items-baseline gap-6">
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">FII</span>
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums",
                                        data.fii_cash_net > 0 ? "text-emerald-500/90" : "text-rose-500/90"
                                    )}>
                                        {data.fii_cash_net > 0 ? '+' : ''}{formatNumber(data.fii_cash_net)} Cr
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">DII</span>
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums",
                                        data.dii_cash_net > 0 ? "text-emerald-500/90" : "text-rose-500/90"
                                    )}>
                                        {data.dii_cash_net > 0 ? '+' : ''}{formatNumber(data.dii_cash_net)} Cr
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">Absorption</span>
                                    <span className="text-xl font-black tabular-nums text-blue-400/80">
                                        {localAbsorption}x
                                    </span>
                                </div>
                            </div>
                            <div className="mt-3 text-[0.6rem] text-muted-foreground/40">
                                Net FPI + DII cash segment flows. Absorption = DII/|FII| when FII sells.
                            </div>
                        </div>
                        {data.fii_percentile && (
                            <div className="text-right">
                                <div className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1">10Y Percentile</div>
                                <div className="text-3xl font-black text-gold-500/80 tabular-nums">{data.fii_percentile.toFixed(0)}%</div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 2. Derivatives Sentiment */}
                <motion.div
                    custom={1}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-6 hover:border-white/10 transition-all duration-300"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
                                Derivatives Sentiment
                            </div>
                            <div className="flex items-baseline gap-6">
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">OI Net</span>
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums",
                                        data.fii_idx_fut_net > 0 ? "text-emerald-500/90" : "text-rose-500/90"
                                    )}>
                                        {data.fii_idx_fut_net > 0 ? '+' : ''}{formatNumber(data.fii_idx_fut_net)} Cr
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">PCR</span>
                                    <span className="text-2xl font-black tabular-nums text-purple-400/80">
                                        {data.pcr?.toFixed(2)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">VIX</span>
                                    <span className="text-2xl font-black tabular-nums text-orange-400/80">
                                        {data.india_vix?.toFixed(1)}
                                    </span>
                                    {data.vix_zscore && (
                                        <span className={cn(
                                            "ml-2 text-sm font-bold",
                                            data.vix_zscore > 0 ? "text-rose-500/60" : "text-emerald-500/60"
                                        )}>
                                            ({data.vix_zscore > 0 ? '+' : ''}{data.vix_zscore.toFixed(1)}σ)
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 text-[0.6rem] text-muted-foreground/40">
                                FII Index Futures net positioning + Vol regime. PCR = Put OI / Call OI.
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Breadth & Quality */}
                <motion.div
                    custom={2}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-6 hover:border-white/10 transition-all duration-300"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
                                Breadth & Quality
                            </div>
                            <div className="flex items-baseline gap-6">
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">Advances</span>
                                    <span className="text-2xl font-black tabular-nums text-emerald-500/90">
                                        {data.advances}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">Declines</span>
                                    <span className="text-2xl font-black tabular-nums text-rose-500/90">
                                        {data.declines}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">Breadth Ratio</span>
                                    <span className={cn(
                                        "text-xl font-black tabular-nums",
                                        parseFloat(breadthRatio) > 0 ? "text-emerald-400/80" : "text-rose-400/80"
                                    )}>
                                        {breadthRatio}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">Delivery</span>
                                    <span className="text-xl font-black tabular-nums text-blue-400/80">
                                        {data.delivery_pct?.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="mt-3 text-[0.6rem] text-muted-foreground/40">
                                Market breadth and quality metrics. Breadth Ratio = (Adv - Dec) / (Adv + Dec).
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 4. Sector Rotation */}
                <motion.div
                    custom={3}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-6 hover:border-white/10 transition-all duration-300"
                >
                    <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-4">
                        Sector Rotation
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {Object.entries(data.sector_returns || {}).slice(0, 12).map(([sector, change]) => (
                            <div key={sector} className="flex flex-col items-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.08] transition-colors group/sector">
                                <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2 text-center truncate w-full">
                                    {sector.replace('NIFTY ', '')}
                                </span>
                                <span className={cn(
                                    "text-lg font-black tabular-nums flex items-center gap-1",
                                    change > 0 ? "text-emerald-500/80" : change < 0 ? "text-rose-500/80" : "text-muted-foreground/30"
                                )}>
                                    {change > 0 ? <TrendingUp size={14} /> : change < 0 ? <TrendingDown size={14} /> : null}
                                    {change > 0 ? '+' : ''}{change.toFixed(2)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    {Object.keys(data.sector_returns || {}).length === 0 && (
                        <div className="text-center text-muted-foreground/30 text-sm py-4">
                            No sector data available
                        </div>
                    )}
                </motion.div>

                {/* 5. Mid/Smallcap Risk */}
                <motion.div
                    custom={4}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-6 hover:border-white/10 transition-all duration-300"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
                                Cap Risk Pulse
                            </div>
                            <div className="flex items-baseline gap-6">
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">Midcap</span>
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums",
                                        data.midcap_perf > 0 ? "text-emerald-500/90" : "text-rose-500/90"
                                    )}>
                                        {data.midcap_perf > 0 ? '+' : ''}{data.midcap_perf?.toFixed(2)}%
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">Smallcap</span>
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums",
                                        data.smallcap_perf > 0 ? "text-emerald-500/90" : "text-rose-500/90"
                                    )}>
                                        {data.smallcap_perf > 0 ? '+' : ''}{data.smallcap_perf?.toFixed(2)}%
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">Nifty</span>
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums",
                                        data.nifty_perf > 0 ? "text-emerald-500/90" : "text-rose-500/90"
                                    )}>
                                        {data.nifty_perf > 0 ? '+' : ''}{data.nifty_perf?.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                            <div className="mt-3 text-[0.6rem] text-muted-foreground/40">
                                52W Highs: {data.new_highs_52w || 0} | 52W Lows: {data.new_lows_52w || 0}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="text-muted-foreground/20" size={32} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </SPASection>
    );
};
