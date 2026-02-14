import React, { useMemo } from 'react';
import { useUSTreasuryAuctions, USTreasuryAuction } from '@/hooks/useUSTreasuryAuctions';
import { SectionHeader } from '@/components/SectionHeader';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { format } from 'date-fns';
import { Info, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatNumber';

const REGIMES = {
    WEAK: { min: 0, max: 1.0, color: 'text-rose-500', bg: 'bg-rose-500', fill: '#f43f5e', label: 'Weak Demand' },
    NORMAL: { min: 1.0, max: 1.8, color: 'text-amber-500', bg: 'bg-amber-500', fill: '#f59e0b', label: 'Healthy Demand' },
    STRONG: { min: 1.8, max: 2.5, color: 'text-emerald-500', bg: 'bg-emerald-500', fill: '#10b981', label: 'Strong Demand' }
};

const getRegime = (score: number) => {
    if (score < 1.0) return REGIMES.WEAK;
    if (score < 1.8) return REGIMES.NORMAL;
    return REGIMES.STRONG;
};

const isTailAlert = (auction: USTreasuryAuction | undefined) => {
    if (!auction) return false;
    const { term, primary_dealer_pct, bid_to_cover } = auction;

    if (term === '10-Year' || term === '30-Year') {
        return primary_dealer_pct > 12.5 || bid_to_cover < 2.30;
    }
    if (term === '2-Year') {
        return primary_dealer_pct > 20 || bid_to_cover < 2.45;
    }
    if (term.includes('Week')) {
        return primary_dealer_pct > 35;
    }
    return false;
};

const MiniGauge: React.FC<{ auction: USTreasuryAuction | undefined; label: string }> = ({ auction, label }) => {
    const score = auction?.demand_strength_score || 0;
    const regime = getRegime(score);
    const hasTailAlert = isTailAlert(auction);

    return (
        <div className={cn(
            "flex flex-col gap-2 p-3 rounded-xl border backdrop-blur-md transition-all duration-500",
            hasTailAlert ? "bg-rose-500/10 border-rose-500/30 animate-pulse" : "bg-white/[0.03] border-white/5"
        )}>
            <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
                {hasTailAlert && <span className="text-[0.5rem] font-black text-rose-500 uppercase tracking-tighter">Tail!</span>}
            </div>
            <div className="flex items-end justify-between gap-2">
                <span className={cn("text-xl font-black leading-none", regime.color)}>
                    {score.toFixed(2)}
                </span>
                <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden mb-1">
                    <div
                        className={cn("h-full transition-all duration-1000", regime.bg)}
                        style={{ width: `${Math.min((score / 2.5) * 100, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export const USTreasuryDemandGauge: React.FC = () => {
    const { data: auctions, isLoading, refetch } = useUSTreasuryAuctions();

    const processedData = useMemo(() => {
        if (!auctions) return { current: null, history: [], others: {} };

        // Group by term
        const grouped = auctions.reduce((acc: any, curr) => {
            if (!acc[curr.term]) acc[curr.term] = [];
            acc[curr.term].push(curr);
            return acc;
        }, {});

        const tenYear = grouped['10-Year']?.[0];
        const history = (grouped['10-Year'] || [])
            .slice()
            .reverse() // Chronological for chart
            .map((a: USTreasuryAuction) => ({
                date: a.auction_date,
                timestamp: new Date(a.auction_date).getTime(),
                score: parseFloat(a.demand_strength_score.toFixed(3)),
                btc: a.bid_to_cover,
                indirect: a.indirect_bidder_pct,
                yield: a.high_yield,
                size: a.total_accepted
            }));

        return {
            current: tenYear,
            history,
            others: {
                '4W Bill': grouped['4-Week']?.[0],
                '2Y Note': grouped['2-Year']?.[0],
                '30Y Bond': grouped['30-Year']?.[0]
            }
        };
    }, [auctions]);

    if (isLoading) return <div className="animate-pulse h-96 w-full bg-white/5 rounded-3xl" />;

    const currentScore = processedData.current?.demand_strength_score || 0;
    const regime = getRegime(currentScore);
    const gaugePercent = Math.min((currentScore / 2.5) * 100, 100);
    const hasMainTailAlert = isTailAlert(processedData.current);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="US Treasury Auction Demand Gauge"
                subtitle="Primary indicator for global dollar liquidity & fiscal absorption"
                lastUpdated={processedData.current?.auction_date}
                interpretations={[
                    "Demand Strength Score weights Bid-to-Cover by Indirect (Foreign/Institutional) participation.",
                    "Higher scores (>1.8) signal strong foreign/private demand, neutralizing de-dollarization risks.",
                    "Scores < 1.0 (Weak) indicate primary dealer absorption, flagging liquidity strain or auctions tails.",
                    "Primary Dealer 'Tail' Alert: Triggered when dealers must absorb >12.5% of benchmark auctions, signaling failed private interest."
                ]}
                onRefresh={refetch}
                isLoading={isLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                {/* PRIMARY GAUGE SECTION */}
                <div className={cn(
                    "lg:col-span-6 flex flex-col gap-6 p-8 rounded-[2.5rem] border backdrop-blur-2xl relative overflow-hidden group transition-all duration-1000",
                    hasMainTailAlert ? "bg-rose-500/[0.05] border-rose-500/20" : "bg-white/[0.02] border-white/5"
                )}>
                    {/* Background Glow */}
                    <div className={cn(
                        "absolute -top-24 -left-24 w-64 h-64 blur-[120px] opacity-20 transition-all duration-1000",
                        hasMainTailAlert ? "bg-rose-500" : regime.bg
                    )} />

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">10-Year Benchmark Demand</h3>
                                <p className="text-xs font-bold text-muted-foreground">Latest Auction Results</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {hasMainTailAlert && (
                                    <div className="px-4 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest bg-rose-500/20 border border-rose-500/40 text-rose-500 animate-pulse">
                                        Tail Alert
                                    </div>
                                )}
                                <div className={cn("px-4 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest bg-white/5 border border-white/10", regime.color)}>
                                    {regime.label}
                                </div>
                            </div>
                        </div>

                        {/* Large Gauge */}
                        <div className="space-y-4">
                            <div className="flex items-baseline gap-4">
                                <span className={cn("text-7xl font-black tracking-tighter transition-all duration-1000", regime.color)}>
                                    {currentScore.toFixed(2)}
                                </span>
                                <span className="text-lg font-bold text-white/20 uppercase tracking-widest">/ 2.50</span>
                            </div>

                            <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                {/* Tracks */}
                                <div className="absolute inset-0 flex">
                                    <div className="h-full w-[40%] border-r border-white/10" />
                                    <div className="h-full w-[32%] border-r border-white/10" />
                                </div>
                                {/* Fill */}
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,197,94,0.3)]", regime.bg)}
                                    style={{ width: `${gaugePercent}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-[0.55rem] font-black text-white/20 uppercase tracking-widest">
                                <span>Weak</span>
                                <span className="translate-x-4">Healthy</span>
                                <span>Strong</span>
                            </div>
                        </div>

                        {/* Mini Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <MiniGauge label="4W Bill" auction={processedData.others['4W Bill']} />
                            <MiniGauge label="2Y Note" auction={processedData.others['2Y Note']} />
                            <MiniGauge label="30Y Bond" auction={processedData.others['30Y Bond']} />
                        </div>
                    </div>
                </div>

                {/* SPARKLINE TREND SECTION */}
                <div className="lg:col-span-4 flex flex-col gap-6 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-2xl overflow-hidden">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">1-Year Absorption Trend</h3>
                        <p className="text-xs font-bold text-muted-foreground">10-Year Note Signal Volatility</p>
                    </div>

                    <div className="flex-1 min-h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={processedData.history} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={regime.fill} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={regime.fill} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    hide
                                />
                                <YAxis
                                    domain={[0, 2.5]}
                                    hide
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="p-4 rounded-2xl bg-black/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-3 min-w-[180px]">
                                                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                                        <span className="text-[0.6rem] font-black text-muted-foreground uppercase">{format(new Date(data.date), 'MMM d, yyyy')}</span>
                                                        <span className={cn("text-[0.6rem] font-black uppercase", getRegime(data.score).color)}>
                                                            {getRegime(data.score).label}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-[0.6rem] text-white/40 uppercase font-black">Score</span>
                                                            <span className="text-[0.6rem] text-white font-black">{data.score.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-[0.6rem] text-white/40 uppercase font-black">BTC Ratio</span>
                                                            <span className="text-[0.6rem] text-white font-black">{data.btc?.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-[0.6rem] text-white/40 uppercase font-black">Dealer Absorption</span>
                                                            <span className={cn(
                                                                "text-[0.6rem] font-black",
                                                                (data.primary_dealer_pct > 12.5) ? "text-rose-500" : "text-white"
                                                            )}>
                                                                {data.primary_dealer_pct?.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-[0.6rem] text-white/40 uppercase font-black">Indirect %</span>
                                                            <span className="text-[0.6rem] text-white font-black">{data.indirect?.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-[0.6rem] text-white/40 uppercase font-black">High Yield</span>
                                                            <span className="text-[0.6rem] text-white font-black">{data.yield?.toFixed(3)}%</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-[0.6rem] text-white/40 uppercase font-black">Total Size</span>
                                                            <span className="text-[0.6rem] text-white font-black">${formatNumber(data.size / 1e3, { decimals: 1 })}B</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {/* Regime Background Bands */}
                                <ReferenceArea y1={0} y2={1.0} fill="#f43f5e" fillOpacity={0.03} />
                                <ReferenceArea y1={1.0} y2={1.8} fill="#f59e0b" fillOpacity={0.03} />
                                <ReferenceArea y1={1.8} y2={2.5} fill="#10b981" fillOpacity={0.03} />

                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke={regime.fill}
                                    strokeWidth={3}
                                    fill="url(#scoreGradient)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span className="text-[0.6rem] font-black text-white/40 uppercase tracking-widest">Regime: {regime.label}</span>
                        </div>
                        <span className="text-[0.65rem] font-bold text-white/20">52W Range: 0.82 — 2.14</span>
                    </div>
                </div>
            </div>

            {/* DataSource Attribution */}
            <div className="flex justify-center pt-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                    <Info size={12} className="text-blue-400" />
                    <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        Source: U.S. Treasury Auction Results – updated weekly via FiscalData API
                    </span>
                </div>
            </div>
        </div>
    );
};
