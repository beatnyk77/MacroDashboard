import React, { useState, useMemo } from 'react';
import { Box, Button, Skeleton } from '@mui/material';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Globe, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTreasuryHolders, TreasuryHolder } from '@/hooks/useTreasuryHolders';
import { TICChoroplethMap } from './TICChoroplethMap';
import { TICStatsDrawer } from './TICStatsDrawer';
import { formatPercentage } from '@/utils/formatNumber';

export type MetricType = 'holdings' | 'share';

const COUNTRY_FLAGS: Record<string, string> = {
    'Japan': '🇯🇵',
    'United Kingdom': '🇬🇧',
    'China, Mainland': '🇨🇳',
    'Belgium': '🇧🇪',
    'Luxembourg': '🇱🇺',
    'Canada': '🇨🇦',
    'Cayman Islands': '🇰🇾',
    'Switzerland': '🇨🇭',
    'Ireland': '🇮🇪',
    'Taiwan': '🇹🇼',
    'India': '🇮🇳',
    'Hong Kong': '🇭🇰',
    'Singapore': '🇸🇬',
    'Brazil': '🇧🇷',
    'Norway': '🇳🇴',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Israel': '🇮🇱',
};

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

    if (isLoading) return <Skeleton variant="rectangular" height={750} className="rounded-[40px] bg-white/5" />;

    return (
        <Box className="relative w-full min-h-[750px] rounded-[48px] border border-white/12 bg-[#050505] overflow-hidden group/module shadow-3xl">
            {/* 1. Header & Primary Controls */}
            <div className="absolute top-10 left-10 z-30 flex flex-col gap-8 max-w-sm">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className="text-cyan-400 w-4 h-4" />
                        <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.4em]">Global TIC Exposure</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-heading text-white leading-none">
                        Top Foreign <span className="text-cyan-400">Holders</span>
                    </h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-uppercase mt-2 leading-relaxed opacity-60">
                        Pinpointing institutional demand and sovereign accumulation of US government debt
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit backdrop-blur-3xl shadow-2xl">
                    <Button
                        size="small"
                        onClick={() => setMetric('holdings')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-uppercase transition-all",
                            metric === 'holdings' ? "bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)]" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Holdings ($B)
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setMetric('share')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-uppercase transition-all",
                            metric === 'share' ? "bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)]" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Market Share
                    </Button>
                </div>
            </div>

            {/* 2. Top 5 Power List (Bottom Left Overlay) */}
            <div className="absolute bottom-10 left-10 z-30 hidden xl:flex flex-col gap-4 bg-black/60 backdrop-blur-3xl border border-white/12 p-8 rounded-[2.5rem] shadow-3xl w-80">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-white uppercase tracking-uppercase">Top 5 Holders</span>
                    <Layers className="text-cyan-400 w-4 h-4" />
                </div>
                <div className="space-y-5">
                    {top5.map((h, i) => (
                        <div key={h.country_name} role="button" tabIndex={0} aria-label={`View details for ${h.country_name}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCountry(h); } }} className="flex items-center justify-between group/power cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none" onClick={() => setSelectedCountry(h)}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{COUNTRY_FLAGS[h.country_name] || '🌐'}</span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white group-hover/power:text-cyan-400 transition-colors tracking-uppercase truncate w-32">{h.country_name}</span>
                                    <span className="text-xs font-black text-white/30 tabular-nums">RANK #{(i+1).toString().padStart(2, '0')}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black text-white italic">${Math.round(h.holdings_usd_bn)}B</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Ranked Sidebar (Desktop Right) */}
            <div className="absolute top-10 right-10 z-30 w-72 max-h-[calc(100%-120px)] overflow-y-auto hidden lg:block scrollbar-hide bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 shadow-inner">
                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">Institutional Rank</span>
                    <TrendingUp size={16} className="text-cyan-400" />
                </div>
                <div className="space-y-5">
                    {top10.map((h, i) => (
                        <div
                            key={h.country_name}
                            onMouseEnter={() => setHoveredCountry(h)}
                            onMouseLeave={() => setHoveredCountry(null)}
                            onClick={() => setSelectedCountry(h)}
                            className={cn(
                                "flex items-center justify-between group/item cursor-pointer p-3 rounded-2xl border border-transparent transition-all",
                                (hoveredCountry?.country_name === h.country_name || selectedCountry?.country_name === h.country_name) ? "bg-cyan-500/10 border-cyan-500/20" : "hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-white/10 tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white group-hover/item:text-cyan-400 transition-colors uppercase truncate w-20">{h.country_name}</span>
                                    <span className="text-xs font-black text-cyan-400/50 tabular-nums uppercase">
                                        {formatPercentage(h.pct_of_total_foreign || 0, { decimals: 1 })} Share
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-black text-white tabular-nums">${Math.round(h.holdings_usd_bn)}B</div>
                                <div className={cn(
                                    "flex items-center justify-end gap-1 text-xs font-black tabular-nums",
                                    (h.yoy_pct_change || 0) > 0 ? "text-emerald-400" : "text-rose-400"
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
            <div className="absolute bottom-10 right-10 z-30 hidden md:flex flex-col gap-4 bg-black/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[2rem] shadow-2xl min-w-[320px]">
                <div className="flex justify-between text-xs font-black text-white/40 uppercase tracking-uppercase">
                    <span>Minimum Exposure</span>
                    <span>Median</span>
                    <span>High Demand</span>
                </div>
                <div className="flex gap-1 h-3 w-full px-1">
                    <div className="flex-1 bg-[#112229] rounded-l-md border border-white/5" />
                    <div className="flex-1 bg-[#0891b2] border border-white/5" />
                    <div className="flex-1 bg-[#06b6d4] border border-white/5" />
                    <div className="flex-1 bg-[#22d3ee] border border-white/5" />
                    <div className="flex-1 bg-[#67e8f9] rounded-r-md border border-white/5" />
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground/40 font-mono uppercase tracking-heading italic">
                        As of {latestHolders[0] ? new Date(latestHolders[0].as_of_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '--'} • US Treasury TIC Stats
                    </span>
                    <Globe size={12} className="text-muted-foreground/20" />
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
