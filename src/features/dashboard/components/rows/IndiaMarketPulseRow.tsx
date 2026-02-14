import React from 'react';
import { useIndiaMarketPulse } from '@/hooks/useIndiaMarketPulse';
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import { Sparkline } from '@/components/Sparkline';
import { HoverTooltip } from '@/components/HoverTooltip';
import { AlertBadge } from '@/components/AlertBadge';
import { formatNumber } from '@/utils/formatNumber';
import { exportToCSV } from '@/utils/exportCSV';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, TrendingDown, BarChart3, Download } from 'lucide-react';

const DEFAULT_EXPORT_START_DATE = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const DEFAULT_EXPORT_END_DATE = new Date().toISOString().split('T')[0];

export const IndiaMarketPulseRow: React.FC = () => {
    const { data: result, isLoading } = useIndiaMarketPulse();
    const data = result?.current;
    const history = result?.history || [];

    const [exportStartDate, setExportStartDate] = React.useState<string>(DEFAULT_EXPORT_START_DATE);
    const [exportEndDate, setExportEndDate] = React.useState<string>(DEFAULT_EXPORT_END_DATE);
    const [showToast, setShowToast] = React.useState(false);

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

    // Prepare sparkline data
    const fiiSparkline = history.map(h => ({ date: h.date, value: h.fii_cash_net }));
    const vixSparkline = history.map(h => ({ date: h.date, value: h.india_vix }));
    const breadthSparkline = history.map(h => ({ date: h.date, value: h.advances - h.declines }));
    const midcapSparkline = history.map(h => ({ date: h.date, value: h.midcap_perf }));

    const handleExport = () => {
        const filtered = history.filter(h => {
            const date = h.date;
            return date >= exportStartDate && date <= exportEndDate;
        });

        if (filtered.length === 0) {
            alert('No data found for selected range');
            return;
        }

        exportToCSV(filtered, `india_market_pulse_${exportStartDate}_to_${exportEndDate}`);

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <SPASection id="india-market-pulse-row" className="py-12" disableAnimation>
            <div className="mb-12 flex justify-between items-end">
                <SectionHeader
                    title="India Market Pulse"
                    subtitle="Daily institutional microstructure and capital flow intelligence"
                />
                <div className="flex gap-3 mb-2 items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                        <span className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-widest">From</span>
                        <input
                            type="date"
                            value={exportStartDate}
                            onChange={(e) => setExportStartDate(e.target.value)}
                            className="bg-transparent text-[0.65rem] font-bold text-muted-foreground/80 border-none focus:ring-0 p-0 w-24 [color-scheme:dark]"
                        />
                        <span className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-widest ml-1">To</span>
                        <input
                            type="date"
                            value={exportEndDate}
                            onChange={(e) => setExportEndDate(e.target.value)}
                            className="bg-transparent text-[0.65rem] font-bold text-muted-foreground/80 border-none focus:ring-0 p-0 w-24 [color-scheme:dark]"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[0.6rem] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 hover:bg-white/[0.06] hover:border-white/10 transition-all active:scale-95"
                    >
                        <Download size={12} />
                        Export CSV
                    </button>
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
                                <HoverTooltip
                                    metric="FII Cash Net"
                                    currentValue={data.fii_cash_net}
                                    percentile={data.fii_percentile}
                                    zScore={data.fii_zscore}
                                    unit="Cr"
                                >
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <span className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-wider mr-2">FII</span>
                                            <span className={cn(
                                                "text-2xl font-black tabular-nums",
                                                data.fii_cash_net > 0 ? "text-emerald-500/90" : "text-rose-500/90"
                                            )}>
                                                {data.fii_cash_net > 0 ? '+' : ''}{formatNumber(data.fii_cash_net)} Cr
                                            </span>
                                        </div>
                                        {data.fii_zscore && <AlertBadge zScore={data.fii_zscore} size="sm" />}
                                    </div>
                                </HoverTooltip>
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
                        <div className="flex flex-col items-end gap-2">
                            {data.fii_percentile && (
                                <div className="text-right">
                                    <div className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase tracking-wider mb-1">10Y Percentile</div>
                                    <div className="text-3xl font-black text-gold-500/80 tabular-nums">{data.fii_percentile.toFixed(0)}%</div>
                                </div>
                            )}
                            {fiiSparkline.length > 0 && (
                                <div className="w-32">
                                    <Sparkline data={fiiSparkline} color="#10b981" height={40} />
                                </div>
                            )}
                        </div>
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
                                <HoverTooltip
                                    metric="India VIX"
                                    currentValue={data.india_vix}
                                    percentile={data.vix_percentile}
                                    zScore={data.vix_zscore}
                                >
                                    <div className="flex items-center gap-2">
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
                                        {data.vix_zscore && <AlertBadge zScore={data.vix_zscore} size="sm" />}
                                    </div>
                                </HoverTooltip>
                            </div>
                            <div className="mt-3 text-[0.6rem] text-muted-foreground/40">
                                FII Index Futures net positioning + Vol regime. PCR = Put OI / Call OI.
                            </div>
                        </div>
                        {vixSparkline.length > 0 && (
                            <div className="w-32">
                                <Sparkline data={vixSparkline} color="#fb923c" height={40} />
                            </div>
                        )}
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
                        {breadthSparkline.length > 0 && (
                            <div className="w-32">
                                <Sparkline data={breadthSparkline} color="#3b82f6" height={40} />
                            </div>
                        )}
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
                        <div className="flex items-center gap-4">
                            {midcapSparkline.length > 0 && (
                                <div className="w-32">
                                    <Sparkline data={midcapSparkline} color="#a855f7" height={40} />
                                </div>
                            )}
                            <BarChart3 className="text-muted-foreground/20" size={32} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Toast Notification */}
            <div className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 pointer-events-none",
                showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
                <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                        Data Exported Successfully
                    </span>
                </div>
            </div>
        </SPASection>
    );
};
