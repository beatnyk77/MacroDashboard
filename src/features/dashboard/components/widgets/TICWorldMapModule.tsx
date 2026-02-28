import React, { useState, useMemo } from 'react';
import { Box, Button, Skeleton } from '@mui/material';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTreasuryHolders, TreasuryHolder } from '@/hooks/useTreasuryHolders';
import { TICChoroplethMap } from './TICChoroplethMap';
import { TICStatsDrawer } from './TICStatsDrawer';
import { formatPercentage } from '@/utils/formatNumber';

export type MetricType = 'holdings' | 'share';

export const TICWorldMapModule: React.FC = () => {
    const { data: holders, isLoading } = useTreasuryHolders();
    const [metric, setMetric] = useState<MetricType>('holdings');
    const [selectedCountry, setSelectedCountry] = useState<TreasuryHolder | null>(null);
    const [hoveredCountry, setHoveredCountry] = useState<TreasuryHolder | null>(null);

    const latestHolders = useMemo(() => {
        if (!holders || holders.length === 0) return [];
        const latestDate = holders[0].as_of_date;
        return holders.filter(h => h.as_of_date === latestDate && h.country_name !== 'Total Foreign' && h.country_name !== 'Grand Total');
    }, [holders]);

    const top10 = useMemo(() => latestHolders.slice(0, 10), [latestHolders]);

    if (isLoading) return <Skeleton variant="rectangular" height={700} className="rounded-[32px] bg-white/5" />;

    return (
        <Box className="relative w-full min-h-[700px] rounded-[40px] border border-white/10 bg-[#050505] overflow-hidden group/module">
            {/* 1. Header & Controls */}
            <div className="absolute top-8 left-8 z-30 flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">
                        TOP FOREIGN <span className="text-cyan-400">HOLDERS</span> OF US TREASURIES
                    </h2>
                    <p className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        TIC DATA BY GEOGRAPHY • PINPOINTING DE-DOLLARIZATION NODES
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 w-fit backdrop-blur-xl">
                    <Button
                        size="small"
                        onClick={() => setMetric('holdings')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all",
                            metric === 'holdings' ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Holdings ($B)
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setMetric('share')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all",
                            metric === 'share' ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Share of Total (%)
                    </Button>
                </div>
            </div>

            {/* 2. Side Panel (Ranked List) */}
            <div className="absolute top-8 right-8 z-30 w-72 max-h-[calc(100%-120px)] overflow-y-auto hidden lg:block scrollbar-hide bg-black/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-[0.2em]">Ranked Sovereigns</span>
                    <TrendingUp size={14} className="text-cyan-400" />
                </div>
                <div className="space-y-4">
                    {top10.map((h, i) => (
                        <div
                            key={h.country_name}
                            onMouseEnter={() => setHoveredCountry(h)}
                            onMouseLeave={() => setHoveredCountry(null)}
                            onClick={() => setSelectedCountry(h)}
                            className={cn(
                                "flex items-center justify-between group/item cursor-pointer p-2 rounded-xl border border-transparent transition-all",
                                (hoveredCountry?.country_name === h.country_name || selectedCountry?.country_name === h.country_name) ? "bg-cyan-500/10 border-cyan-500/20" : "hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-[0.6rem] font-black text-white/20 tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white group-hover/item:text-cyan-400 transition-colors uppercase truncate w-24">{h.country_name}</span>
                                    <span className="text-[0.55rem] font-bold text-muted-foreground tracking-tighter tabular-nums">
                                        {formatPercentage(h.pct_of_total_foreign || 0, { decimals: 1 })} Share
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-black text-white tabular-nums">${Math.round(h.holdings_usd_bn)}B</div>
                                <div className={cn(
                                    "flex items-center justify-end gap-1 text-[0.55rem] font-black tabular-nums",
                                    (h.yoy_pct_change || 0) > 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {(h.yoy_pct_change || 0) > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {Math.abs(h.yoy_pct_change || 0).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <Button
                    fullWidth
                    className="mt-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest hover:text-white transition-all"
                >
                    View All Holdings
                </Button>
            </div>

            {/* 3. Filter Chips (Top Center) */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 hidden xl:flex items-center gap-3">
                {['All Holders', 'Top 10', 'Rising YoY', 'Falling YoY'].map(f => (
                    <button key={f} className="px-5 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[0.55rem] font-black text-muted-foreground uppercase tracking-widest hover:border-cyan-500/50 hover:text-white transition-all">
                        {f}
                    </button>
                ))}
            </div>

            {/* 4. Core Map Visualization */}
            <TICChoroplethMap
                data={latestHolders}
                metric={metric}
                hoveredCountry={hoveredCountry}
                onHover={setHoveredCountry}
                onSelect={setSelectedCountry}
            />

            {/* 5. Legend (Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-96 flex flex-col gap-2 px-8">
                <div className="flex justify-between text-[0.55rem] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">
                    <span>Low Exposure</span>
                    <span>Median</span>
                    <span>High Exposure</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-[#0d3b44] via-cyan-900 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]" />
            </div>

            {/* 6. Footer Info (Bottom Left) */}
            <div className="absolute bottom-8 left-8 z-30">
                <p className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-tight">
                    Last updated: {holders && holders[0]?.as_of_date ? new Date(holders[0].as_of_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '--'} • Source: U.S. Treasury TIC
                </p>
            </div>

            {/* 7. Stats Drawer (Selected Country Overlay) */}
            <TICStatsDrawer
                country={selectedCountry}
                allData={holders || []}
                onClose={() => setSelectedCountry(null)}
            />
        </Box>
    );
};
