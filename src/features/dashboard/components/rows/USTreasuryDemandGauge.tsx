import React, { useMemo, useState } from 'react';
import { useUSTreasuryAuctions, USTreasuryAuction } from '@/hooks/useUSTreasuryAuctions';
import { AreaChart, Area, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { format } from 'date-fns';
import { Info, TrendingUp, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatNumber';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ── Constants & Helpers ─────────────────────────────────────────────

const REGIMES = {
  WEAK: { min: 0, max: 1.0, color: 'text-rose-500', bg: 'bg-rose-500', fill: '#f43f5e', label: 'Weak Demand' },
  NORMAL: { min: 1.0, max: 1.6, color: 'text-amber-500', bg: 'bg-amber-500', fill: '#f59e0b', label: 'Neutral' },
  STRONG: { min: 1.6, max: 2.5, color: 'text-emerald-500', bg: 'bg-emerald-500', fill: '#10b981', label: 'Strong Demand' }
};

const getRegime = (score: number) => {
  if (score < 1.0) return REGIMES.WEAK;
  if (score < 1.6) return REGIMES.NORMAL;
  return REGIMES.STRONG;
};

const isTailAlert = (auction: USTreasuryAuction | undefined) => {
  if (!auction) return false;
  const { term, primary_dealer_pct } = auction;
  // Institutional threshold: Primary Dealer absorption > 12.5% for benchmarks
  if (term === '10-Year' || term === '30-Year' || term === '2-Year' || term === '5-Year') {
    return primary_dealer_pct > 12.5;
  }
  return primary_dealer_pct > 30; // Bills have higher dealer absorption normally
};

// ── Components ──────────────────────────────────────────────────────

const MicroSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 48;
  const height = 16;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible opacity-50">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
};

const TenorChip: React.FC<{ 
  term: string; 
  auction: USTreasuryAuction | undefined; 
  history: number[] 
}> = ({ term, auction, history }) => {
  const score = auction?.demand_strength_score || 0;
  const regime = getRegime(score);
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors min-w-[140px]">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-muted-foreground uppercase">{term}</span>
        <span className={cn("text-sm font-bold tabular-nums", regime.color)}>
          {score.toFixed(2)}
        </span>
      </div>
      <div className="ml-auto">
        <MicroSparkline data={history} color={regime.fill} />
      </div>
    </div>
  );
};

const TailStatusInfo: React.FC = () => (
  <TooltipProvider>
    <UITooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-1.5 cursor-help">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-uppercase">Tail Status</span>
          <Info size={10} className="text-white/20" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] text-[11px] leading-relaxed bg-slate-900 border-white/10 p-3">
        Primary dealer absorption &gt;12.5% of auction size flags weak private demand, indicating dealers were forced to "tail" the auction.
      </TooltipContent>
    </UITooltip>
  </TooltipProvider>
);

// ── Main Component ──────────────────────────────────────────────────

export const USTreasuryDemandGauge: React.FC = () => {
  const { data: auctions, isLoading, refetch } = useUSTreasuryAuctions();
  const [isExpanded, setIsExpanded] = useState(false);

  const processedData = useMemo(() => {
    if (!auctions) return { current: undefined, history: [], others: [] };

    const grouped = auctions.reduce((acc: Record<string, USTreasuryAuction[]>, curr) => {
      if (!acc[curr.term]) acc[curr.term] = [];
      acc[curr.term].push(curr);
      return acc;
    }, {});

    const tenYearLatest = grouped['10-Year']?.[0];
    const history = (grouped['10-Year'] || [])
      .slice(0, 52) // 1 year of auctions
      .reverse()
      .map(a => ({
        date: a.auction_date,
        score: parseFloat(a.demand_strength_score.toFixed(3)),
        btc: a.bid_to_cover,
        indirect: a.indirect_bidder_pct,
        primary_dealer: a.primary_dealer_pct,
        yield: a.high_yield,
        size: a.total_accepted
      }));

    // Selected tenors for the chips
    const tenorList = ['4-Week', '3-Month', '6-Month', '2-Year', '5-Year', '30-Year'];
    const others = tenorList.map(term => {
      const termAuctions = grouped[term] || [];
      return {
        term,
        latest: termAuctions[0],
        history: termAuctions.slice(0, 12).reverse().map(a => a.demand_strength_score)
      };
    });

    return { current: tenYearLatest, history, others };
  }, [auctions]);

  if (isLoading) return <div className="animate-pulse h-96 w-full bg-white/5 rounded-3xl" />;

  const current = processedData.current;
  const currentScore = current?.demand_strength_score || 0;
  const regime = getRegime(currentScore);
  const gaugePercent = Math.min((currentScore / 2.5) * 100, 100);
  const hasTailAlert = isTailAlert(current);

  return (
    <section className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
              US Treasury Auction Demand Gauge
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              Score vs last 5 years of 10Y auctions (Bid-to-Cover × Indirect share)
            </p>
          </div>
          {current && (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <RefreshCw size={12} className={cn("cursor-pointer hover:text-white transition-all", isLoading && "animate-spin")} onClick={() => refetch()} />
              <span>Updated: {format(new Date(current.auction_date), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* PRIMARY SCORE & COLLAPSIBLE DETAILS */}
          <div className={cn(
            "lg:col-span-6 flex flex-col gap-6 p-8 rounded-3xl border backdrop-blur-3xl relative overflow-hidden transition-all duration-1000",
            hasTailAlert ? "bg-rose-500/[0.05] border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.05)]" : "bg-white/[0.02] border-white/10"
          )}>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">10-Year Benchmark Demand</span>
                <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10", regime.color)}>
                  {regime.label}
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-baseline gap-4">
                <motion.span 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn("text-7xl font-black tracking-tight transition-all duration-1000", regime.color)}
                >
                  {currentScore.toFixed(2)}
                </motion.span>
                <span className="text-lg font-bold text-white/10 uppercase tracking-tighter">/ 2.50 Limit</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div className="absolute inset-0 flex">
                    <div className="h-full w-[40%] border-r border-white/10" title="Weak threshold" />
                    <div className="h-full w-[24%] border-r border-white/10" title="Neutral threshold" />
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${gaugePercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn("h-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.2)]", regime.bg)}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <span>Weak</span>
                  <span>Neutral</span>
                  <span>Strong</span>
                </div>
              </div>

              {/* Collapsible Latest Auction Details */}
              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3 text-sm font-bold text-white/80">
                    <span>Bid-to-Cover {current?.bid_to_cover.toFixed(2)}x</span>
                    <span className="text-white/20">·</span>
                    <span>Indirect {current?.indirect_bidder_pct.toFixed(1)}%</span>
                    <span className="text-white/20">·</span>
                    <span className={cn(hasTailAlert ? "text-rose-400" : "text-emerald-400")}>
                      Dealers {current?.primary_dealer_pct.toFixed(1)}% {hasTailAlert && "(Tail)"}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-white/40 group-hover:text-white transition-colors" /> : <ChevronDown size={16} className="text-white/40 group-hover:text-white transition-colors" />}
                </button>

                <AnimatePresence>
                  {isExpanded && current && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4 pt-6 pb-2">
                        <div className="space-y-4">
                          <DetailRow label="Total Tendered" value={`$${formatNumber(current.total_tendered / 1e3, { decimals: 1 })}B`} />
                          <DetailRow label="Total Accepted" value={`$${formatNumber(current.total_accepted / 1e3, { decimals: 1 })}B`} />
                          <DetailRow label="High Yield" value={`${current.high_yield?.toFixed(3)}%`} />
                        </div>
                        <div className="space-y-4">
                          <DetailRow label="Direct Bidder %" value={`${current.direct_bidder_pct.toFixed(1)}%`} />
                          <DetailRow label="Bid-to-Cover" value={`${current.bid_to_cover.toFixed(2)}x`} />
                          <div className="flex items-center justify-between">
                            <TailStatusInfo />
                            <span className={cn("text-xs font-bold tabular-nums", hasTailAlert ? "text-rose-500" : "text-emerald-500")}>
                              {current.primary_dealer_pct.toFixed(1)}% {hasTailAlert ? (
                                <AlertTriangle size={10} className="inline ml-1 mb-0.5" />
                              ) : "— Clean"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* TREND CHART */}
          <div className="lg:col-span-4 flex flex-col gap-6 p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl overflow-hidden">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">1-Year Absorption Trend</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">10-Year Auction Record</p>
            </div>

            <div className="flex-1 min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedData.history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={regime.fill} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={regime.fill} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-xl bg-slate-900/95 border border-white/10 backdrop-blur-md shadow-2xl space-y-2 min-w-[140px]">
                            <div className="flex items-center justify-between text-[10px] font-black text-white/40 pb-1 border-b border-white/5 uppercase">
                              <span>{format(new Date(d.date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[10px] text-white/20 uppercase font-black">Score</span>
                              <span className={cn("text-xs font-black", getRegime(d.score).color)}>{d.score.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[10px] text-white/20 uppercase font-black">BTC</span>
                              <span className="text-xs text-white font-black">{d.btc.toFixed(2)}x</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[10px] text-white/20 uppercase font-black">Indirect</span>
                              <span className="text-xs text-white font-black">{d.indirect.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={1.0} stroke="#ffffff" strokeDasharray="3 3" strokeOpacity={0.1} />
                  <ReferenceArea y1={0} y2={1.0} fill="#f43f5e" fillOpacity={0.02} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={regime.fill}
                    strokeWidth={2}
                    fill="url(#scoreGrad)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Thresholds</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> <span className="text-[10px] text-white/40 uppercase font-bold">Weak</span></div>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> <span className="text-[10px] text-white/40 uppercase font-bold">Neut</span></div>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> <span className="text-[10px] text-white/40 uppercase font-bold">Strong</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* CROSS-TENOR DEMAND SNAPSHOT */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Cross-tenor demand snapshot (latest auctions)</h3>
          <div className="flex flex-wrap gap-3">
            {processedData.others.map((item, idx) => (
              <TenorChip 
                key={idx} 
                term={item.term} 
                auction={item.latest} 
                history={item.history} 
              />
            ))}
          </div>
        </div>

        {/* FOOTER & MACRO LINKAGE */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-slate-500 italic leading-relaxed">
              Treasury auction demand is a critical signal for the "Triffin Dilemma" and global USD liquidity. 
              Persistently low scores (<span className="text-rose-500/80 font-bold">Weak</span>) indicate reduced foreign institutional appetite for US debt, 
              a potential precursor to systemic de-dollarization or forced monetization by the Federal Reserve.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
            <Info size={12} className="text-blue-500" />
            Source: U.S. Treasury (FiscalData API)
          </div>
        </div>
      </div>
    </section>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold text-white tabular-nums">{value}</span>
  </div>
);

const RefreshCw: React.FC<{ size?: number; className?: string; onClick?: () => void }> = ({ size = 16, className, onClick }) => (
  <svg 
    onClick={onClick}
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={cn("lucide lucide-refresh-cw", className)}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
  </svg>
);
