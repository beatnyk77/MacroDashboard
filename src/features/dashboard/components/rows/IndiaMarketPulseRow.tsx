import React from 'react';
import { useIndiaMarketPulse } from '@/hooks/useIndiaMarketPulse';
import { MarketMetricCard } from '../cards/MarketMetricCard';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import { formatNumber } from '@/utils/formatNumber';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

export const IndiaMarketPulseRow: React.FC = () => {
    const { data: result, isLoading } = useIndiaMarketPulse();
    const data = result?.current;
    const history = result?.history;

    if (isLoading || !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-48 rounded-2xl bg-white/[0.02] animate-pulse" />
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

    return (
        <SPASection id="india-market-pulse-row" className="py-12" disableAnimation>
            <div className="mb-12 flex justify-between items-end">
                <SectionHeader
                    title="India Market Pulse"
                    subtitle="Daily institutional microstructure and capital flow intelligence"
                />
                <div className="flex gap-2 mb-2">
                    <div className="px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-[0.6rem] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
                        <Activity size={10} /> 10Y Baseline
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {/* 1. Daily Flow Summary */}
                <MarketMetricCard
                    label="Flow Summary"
                    value={`${data.fii_cash_net > 0 ? '+' : ''}${formatNumber(data.fii_cash_net)} Cr`}
                    subValue={`DII: ${data.dii_cash_net > 0 ? '+' : ''}${formatNumber(data.dii_cash_net)} Cr`}
                    trend={data.fii_cash_net > 0 ? 'up' : 'down'}
                    description={`Local Absorption: ${localAbsorption}x. Net FPI + DII cash segment flows.`}
                    percentile={data.fii_percentile}
                    zScore={data.fii_zscore}
                    history={history?.map(h => ({ date: h.date, value: h.fii_cash_net }))}
                />

                {/* 2. Derivatives Sentiment */}
                <MarketMetricCard
                    label="Derivatives OI"
                    value={`${data.fii_idx_fut_net > 0 ? '+' : ''}${formatNumber(data.fii_idx_fut_net)} Cr`}
                    subValue={`PCR: ${data.pcr?.toFixed(2)} | VIX: ${data.india_vix?.toFixed(1)}`}
                    accentColor="gold"
                    description={`FII Index Futures net positioning + Vol regime.`}
                    percentile={data.vix_percentile}
                    zScore={data.vix_zscore}
                    history={history?.map(h => ({ date: h.date, value: h.india_vix }))}
                />

                {/* 3. Breadth & Quality */}
                <MarketMetricCard
                    label="Breadth & Quality"
                    value={`${data.advances}/${data.declines}`}
                    subValue={`Breadth Ratio: ${breadthRatio}`}
                    trend={data.advances > data.declines ? 'up' : 'down'}
                    description={`Quality Index: ${data.delivery_pct?.toFixed(1)}% Delivery avg.`}
                    history={history?.map(h => ({ date: h.date, value: h.advances - h.declines }))}
                />

                {/* 4. Sector Rotation */}
                <motion.div
                    className="flex flex-col p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] h-full group"
                >
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-6 group-hover:text-muted-foreground/60 transition-colors">
                        Sector Heatmap
                    </span>
                    <div className="space-y-4">
                        {Object.entries(data.sector_returns || {}).map(([sector, change]) => (
                            <div key={sector} className="flex justify-between items-center group/item cursor-default">
                                <span className="text-[0.7rem] font-bold text-muted-foreground/50 group-hover/item:text-muted-foreground/80 transition-colors uppercase truncate mr-2">
                                    {sector.replace('NIFTY ', '')}
                                </span>
                                <span className={cn(
                                    "text-[0.7rem] font-black tabular-nums font-mono",
                                    change > 0 ? "text-emerald-500/80" : change < 0 ? "text-rose-500/80" : "text-muted-foreground/30"
                                )}>
                                    {change > 0 ? '+' : ''}{change.toFixed(2)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto pt-6 opacity-20 group-hover:opacity-40 transition-opacity">
                        <div className="h-8 w-full bg-white/[0.02] rounded flex items-center justify-center text-[0.5rem] font-bold text-muted-foreground uppercase tracking-widest">
                            Regime: {data.nifty_perf > 0 ? 'Expansion' : 'Consolidation'}
                        </div>
                    </div>
                </motion.div>

                {/* 5. Mid/Smallcap Risk */}
                <MarketMetricCard
                    label="Cap Risk Pulse"
                    value={`${data.midcap_perf > 0 ? '+' : ''}${data.midcap_perf?.toFixed(2)}%`}
                    subValue={`Small: ${data.smallcap_perf?.toFixed(2)}% | Nifty: ${data.nifty_perf?.toFixed(2)}%`}
                    accentColor="purple"
                    description={`52W Highs (${data.new_highs_52w}) vs Lows (${data.new_lows_52w})`}
                    history={history?.map(h => ({ date: h.date, value: h.midcap_perf }))}
                />
            </div>
        </SPASection>
    );
};
