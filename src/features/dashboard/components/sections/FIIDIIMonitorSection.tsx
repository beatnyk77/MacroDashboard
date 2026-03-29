import React from 'react';
import { useIndiaMarketPulse, useFPISectorFlows } from '@/hooks/useIndiaMarketPulse';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatNumber';
import { Sparkline } from '@/components/Sparkline';
import { AlertBadge } from '@/components/AlertBadge';
import {
    Activity,
    ArrowRightLeft,
    Layers,
    TrendingUp,
    Flame,
    Wind
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

export const FIIDIIMonitorSection: React.FC = () => {
    const { data: marketPulse, isLoading: isPulseLoading } = useIndiaMarketPulse();
    const { data: sectorFlows } = useFPISectorFlows();

    if (isPulseLoading || !marketPulse?.current) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
                ))}
            </div>
        );
    }

    const data = marketPulse.current;
    const history = marketPulse.history || [];

    // Process Sector Flows (Latest fortnight)
    const latestSectorFlows = sectorFlows?.filter(s => s.fortnight_end_date === sectorFlows[0]?.fortnight_end_date) || [];
    const topBuyers = [...latestSectorFlows].sort((a, b) => b.net_investment_cr - a.net_investment_cr).slice(0, 5);
    const topSellers = [...latestSectorFlows].sort((a, b) => a.net_investment_cr - b.net_investment_cr).slice(0, 5);

    const cardVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.05, duration: 0.3 }
        })
    };

    return (
        <div className="space-y-4">
            {/* 1. Macro Liquidity & Sentiment Pulse */}
            <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.05] p-5"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                            <Activity size={10} /> Smart Money Regime
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className={cn(
                                "text-3xl font-black tabular-nums tracking-tighter",
                                (data.sentiment_score || 0) > 0.5 ? "text-emerald-400" : (data.sentiment_score || 0) < -0.5 ? "text-rose-400" : "text-amber-400"
                            )}>
                                {(data.sentiment_score || 0).toFixed(2)}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                                {(data.sentiment_score || 0) > 0.5 ? 'RISK-ON' : (data.sentiment_score || 0) < -0.5 ? 'RISK-OFF' : 'NEUTRAL'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 md:px-12 border-x border-white/5">
                        <div>
                            <div className="text-[0.55rem] font-bold text-muted-foreground/30 uppercase tracking-widest mb-1">Inst. Net Cash</div>
                            <div className={cn("text-xl font-black tabular-nums", (data.fii_dii_net || 0) > 0 ? "text-emerald-500/80" : "text-rose-500/80")}>
                                {(data.fii_dii_net || 0) > 0 ? '+' : ''}{formatNumber(data.fii_dii_net || 0)} Cr
                            </div>
                        </div>
                        <div>
                            <div className="text-[0.55rem] font-bold text-muted-foreground/30 uppercase tracking-widest mb-1">FII F&O Net</div>
                            <div className={cn("text-xl font-black tabular-nums", (data.fii_fno_net || 0) > 0 ? "text-emerald-500/80" : "text-rose-500/80")}>
                                {(data.fii_fno_net || 0) > 0 ? '+' : ''}{formatNumber(data.fii_fno_net || 0)} Cr
                            </div>
                        </div>
                        <div>
                            <div className="text-[0.55rem] font-bold text-muted-foreground/30 uppercase tracking-widest mb-1">Retail F&O Net</div>
                            <div className={cn("text-xl font-black tabular-nums", (data.client_fno_net || 0) > 0 ? "text-rose-500/80" : "text-emerald-500/80")}>
                                {(data.client_fno_net || 0) > 0 ? '+' : ''}{formatNumber(data.client_fno_net || 0)} Cr
                            </div>
                        </div>
                        <div>
                            <div className="text-[0.55rem] font-bold text-muted-foreground/30 uppercase tracking-widest mb-1">FII Position</div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-white/80 tabular-nums">
                                    {(data.fii_zscore || 0).toFixed(1)}σ
                                </span>
                                <AlertBadge zScore={data.fii_zscore || 0} size="sm" />
                            </div>
                        </div>
                    </div>

                    <div className="min-w-[120px] text-right">
                        <div className="text-[0.55rem] font-bold text-muted-foreground/30 uppercase tracking-widest mb-1">Trend Signal</div>
                        <div className="h-10 w-32 ml-auto">
                            <Sparkline
                                data={history.slice(-30).map(h => ({ date: h.date, value: h.fii_cash_net }))}
                                color={(data.sentiment_score || 0) > 0 ? '#10b981' : '#f43f5e'}
                                height={40}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 2. Tug-of-War */}
            <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-1 min-w-[200px]">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                            <ArrowRightLeft size={10} /> FII vs DII Tug-of-War
                        </div>
                        <div className="text-2xl font-black text-white tracking-tighter">
                            {data.fii_cash_net < 0 && data.dii_cash_net > 0
                                ? (data.dii_cash_net / Math.abs(data.fii_cash_net)).toFixed(1)
                                : (data.fii_cash_net > 0 && data.dii_cash_net > 0 ? 'CO-BUY' : 'DIVERGE')}
                        </div>
                        <div className="text-[0.55rem] font-bold text-muted-foreground/30 uppercase tracking-widest">
                            Absorption Ratio
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                            <span className="text-rose-400">FII Net: {formatNumber(data.fii_cash_net)} Cr</span>
                            <span className="text-emerald-400">DII Net: +{formatNumber(data.dii_cash_net)} Cr</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-rose-500/50 transition-all duration-1000"
                                style={{ width: `${Math.max(20, Math.min(80, (Math.abs(data.fii_cash_net) / (Math.abs(data.fii_cash_net) + Math.abs(data.dii_cash_net))) * 100))}%` }}
                            />
                            <div
                                className="h-full bg-emerald-500/50 transition-all duration-1000"
                                style={{ width: `${Math.max(20, Math.min(80, (Math.abs(data.dii_cash_net) / (Math.abs(data.fii_cash_net) + Math.abs(data.dii_cash_net))) * 100))}%` }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 3. Sector-wise FPI Velocity */}
            <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                        <Layers size={10} /> Sector-wise FPI Velocity (Fortnightly)
                    </div>
                    <div className="text-[0.55rem] font-bold text-muted-foreground/20 uppercase tracking-widest">
                        As of {latestSectorFlows[0]?.fortnight_end_date}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <div className="text-[0.55rem] font-black text-emerald-400/50 uppercase tracking-widest flex items-center gap-2">
                            <Flame size={10} /> Priority Accumulation
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {topBuyers.map((s) => (
                                <div key={s.sector} className="flex flex-col justify-center p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                                    <span className="text-[0.55rem] font-black text-emerald-500/90 truncate mb-1">{s.sector}</span>
                                    <span className="text-xs font-black text-emerald-400 tabular-nums">+{formatNumber(s.net_investment_cr)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="text-[0.55rem] font-black text-rose-400/50 uppercase tracking-widest flex items-center gap-2">
                            <Wind size={10} /> Strategic Liquidation
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {topSellers.map((s) => (
                                <div key={s.sector} className="flex flex-col justify-center p-2 rounded bg-rose-500/5 border border-rose-500/10">
                                    <span className="text-[0.55rem] font-black text-rose-500/90 truncate mb-1">{s.sector}</span>
                                    <span className="text-xs font-black text-rose-400 tabular-nums">{formatNumber(s.net_investment_cr)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 3. Historical Flow Trends vs Nifty Benchmark */}
            <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5 h-[350px]"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                        <TrendingUp size={10} /> Flow Regime vs Benchmark Returns
                    </div>
                    <div className="flex items-center gap-4 text-[0.55rem] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> FII Cash</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> F&O Net</div>
                    </div>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history.slice(-60)}>
                            <defs>
                                <linearGradient id="colorFii" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                textAnchor="end"
                                height={40}
                                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            />
                            <YAxis
                                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ fontWeight: 900, textTransform: 'uppercase' }}
                            />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                            <Area
                                type="monotone"
                                dataKey="fii_cash_net"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorFii)"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="fii_idx_fut_net"
                                stroke="#a855f7"
                                fill="transparent"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
};
