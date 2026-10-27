import React, { useState, useMemo } from 'react';
import { Box, Button, Skeleton } from '@mui/material';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Globe, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTreasuryHolders, TreasuryHolder } from '@/hooks/useTreasuryHolders';
import { TICChoroplethMap } from './TICChoroplethMap';
import { TICStatsDrawer } from './TICStatsDrawer';
import { formatPercentage } from '@/utils/formatNumber';
import { CountryCode } from '@/components/CountryCode';
import { TREASURY_HOLDER_CODES } from '@/constants/countryCodes';

export type MetricType = 'holdings' | 'share';

export const TICWorldMapModule: React.FC = () => {
    const { data: holders, isLoading } = useTreasuryHolders();
    const [metric, setMetric] = useState<MetricType>('holdings');
    const [selectedCountry, setSelectedCountry] = useState<TreasuryHolder | null>(null);
    const [hoveredCountry, setHoveredCountry] = useState<TreasuryHolder | null>(null);

    const latestHolders = useMemo(() => {
        if (!holders || holders.length === 0) return [];
        const latestDate = holders[0].as_of_date;
        return holders
            .filter(h => h.as_of_date === latestDate && h.country_name !== 'Total Foreign' && h.country_name !== 'Grand Total')
            .sort((a, b) => b.holdings_usd_bn - a.holdings_usd_bn);
    }, [holders]);

    const top5 = useMemo(() => latestHolders.slice(0, 5), [latestHolders]);
    const top10 = useMemo(() => latestHolders.slice(0, 10), [latestHolders]);

    if (isLoading) return <Skeleton variant="rectangular" height={750} className="rounded-xl bg-muted/30" />;

    return (
        <Box className="relative w-full min-h-[750px] rounded-xl border border-border bg-background overflow-hidden group/module shadow-sm shadow-3xl text-card-foreground">
            {/* 1. Header & Primary Controls */}
            <div className="absolute top-10 left-10 z-30 flex flex-col gap-8 max-w-sm">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className=" text-cyan-400 w-4 h-4" />
                        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-[0.4em]">Global TIC Exposure</span>
                    </div>
                    <h2 className="text-4xl font-bold uppercase tracking-heading text-foreground leading-none">
                        Top Foreign <span className=" text-cyan-400">Holders</span>
                    </h2>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2 leading-relaxed">
                        Pinpointing institutional demand and sovereign accumulation of US government debt
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-card/80 p-1 rounded-xl border border-border w-fit backdrop-blur-3xl shadow-sm">
                    <Button
                        size="small"
                        onClick={() => setMetric('holdings')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all",
                            metric === 'holdings' ? " bg-cyan-500 text-black shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Holdings ($B)
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setMetric('share')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all",
                            metric === 'share' ? " bg-cyan-500 text-black shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Market Share
                    </Button>
                </div>
            </div>

            {/* 2. Top 5 Power List (Bottom Left Overlay) */}
            <div className="absolute bottom-10 left-10 z-30 hidden xl:flex flex-col gap-4 bg-background/60 backdrop-blur-3xl border border-border p-8 rounded-xl shadow-lg w-80 text-card-foreground">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Top 5 Holders</span>
                    <Layers className=" text-cyan-400 w-4 h-4" />
                </div>
                <div className="space-y-5">
                    {top5.map((h, i) => (
                        <div key={h.country_name} role="button" tabIndex={0} aria-label={`View details for ${h.country_name}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCountry(h); } }} className="flex items-center justify-between group/power cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none" onClick={() => setSelectedCountry(h)}>
                            <div className="flex items-center gap-3">
                                <CountryCode code={TREASURY_HOLDER_CODES[h.country_name]} size="md" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-foreground group-hover/power:text-cyan-400 transition-colors tracking-wider truncate w-32">{h.country_name}</span>
                                    <span className="text-xs font-bold text-muted-foreground tabular-nums">RANK #{(i+1).toString().padStart(2, '0')}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-foreground italic">${Math.round(h.holdings_usd_bn)}B</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Ranked Sidebar (Desktop Right) */}
            <div className="absolute top-10 right-10 z-30 w-72 max-h-[calc(100%-120px)] overflow-y-auto hidden lg:block scrollbar-hide bg-background/60 backdrop-blur-3xl border border-border rounded-xl p-8 shadow-lg text-card-foreground">
                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institutional Rank</span>
                    <TrendingUp size={16} className=" text-cyan-400" />
                </div>
                <div className="space-y-5">
                    {top10.map((h, i) => (
                        <div
                            key={h.country_name}
                            onMouseEnter={() => setHoveredCountry(h)}
                            onMouseLeave={() => setHoveredCountry(null)}
                            onClick={() => setSelectedCountry(h)}
                            className={cn(
                                "flex items-center justify-between group/item cursor-pointer p-3 rounded-xl border border-transparent transition-all",
                                (hoveredCountry?.country_name === h.country_name || selectedCountry?.country_name === h.country_name) ? "bg-cyan-500/10 border-cyan-500/30" : " hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-muted-foreground tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-foreground group-hover/item:text-cyan-400 transition-colors uppercase truncate w-20">{h.country_name}</span>
                                    <span className="text-xs font-semibold text-cyan-400/70 tabular-nums uppercase">
                                        {formatPercentage(h.pct_of_total_foreign || 0, { decimals: 1 })} Share
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-foreground tabular-nums">${Math.round(h.holdings_usd_bn)}B</div>
                                <div className={cn(
                                    "flex items-center justify-end gap-1 text-xs font-bold tabular-nums",
                                    (h.yoy_pct_change || 0) > 0 ? " text-emerald-400" : " text-rose-400"
                                    )}>
                                    {(h.yoy_pct_change || 0) > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(h.yoy_pct_change || 0).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Core Map Component */}
            <TICChoroplethMap
                data={latestHolders}
                metric={metric}
                hoveredCountry={hoveredCountry}
                onHover={setHoveredCountry}
                onSelect={setSelectedCountry}
            />

            {/* 5. Quantized Legend (Bottom Right Center) */}
            <div className="absolute bottom-10 right-10 z-30 hidden md:flex flex-col gap-4 bg-background/60 backdrop-blur-3xl border border-border p-6 rounded-xl shadow-lg min-w-[320px] text-card-foreground">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Minimum Exposure</span>
                    <span>Median</span>
                    <span>High Demand</span>
                </div>
                <div className="flex gap-1 h-3 w-full px-1">
                    <div className="flex-1 bg-card rounded-l-md border border-border" />
                    <div className="flex-1 bg-cyan-600 border border-border" />
                    <div className="flex-1 bg-cyan-500 border border-border" />
                    <div className="flex-1 bg-cyan-400 border border-border" />
                    <div className="flex-1 bg-cyan-300 rounded-r-md border border-border" />
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-heading italic">
                        As of {latestHolders[0] ? new Date(latestHolders[0].as_of_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '--'} • US Treasury TIC Stats
                    </span>
                    <Globe size={12} className="text-muted-foreground" />
                </div>
            </div>

            {/* 6. Stats Drawer Overlay */}
            <TICStatsDrawer
                country={selectedCountry}
                allData={holders || []}
                onClose={() => setSelectedCountry(null)}
            />
        </Box>
    );
};
