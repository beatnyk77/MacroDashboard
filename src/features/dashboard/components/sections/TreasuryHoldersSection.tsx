import React, { useState } from 'react';
import { SectionHeader } from '@/components/SectionHeader';
import { useTreasuryHolders } from '@/hooks/useTreasuryHolders';
import { Info, TrendingUp, TrendingDown, Minus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatNumber';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { TreasuryHoldersChart } from '../charts/TreasuryHoldersChart';
import { TICWorldMapModule } from '../widgets/TICWorldMapModule';


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
    'Total Foreign': '🌐',
    'Grand Total': '🌐'
};

export const TreasuryHoldersSection: React.FC = () => {
    const { data, isLoading, error } = useTreasuryHolders();
    const [viewMode, setViewMode] = useState<'chart' | 'table' | 'map'>('map');
    const [isExpanded, setIsExpanded] = useState(false);

    if (isLoading) return <Skeleton className="h-[600px] w-full rounded-xl mb-12" />;

    if (error) return (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg mb-12 flex items-start gap-3">
            <AlertCircle className="text-destructive h-5 w-5 mt-0.5" />
            <div>
                <h3 className="font-bold text-destructive text-sm">Error loading TIC Data</h3>
                <p className="text-destructive/80 text-xs mt-1">Could not fetch Treasury Holdings data. Please try again later.</p>
            </div>
        </div>
    );

    if (!data || data.length === 0) return null;

    const latestDate = data[0].as_of_date;
    const latestHolders = data
        .filter(d => d.as_of_date === latestDate && d.country_name !== 'Total Foreign' && d.country_name !== 'Grand Total')
        .sort((a, b) => b.holdings_usd_bn - a.holdings_usd_bn);

    const chartData = latestHolders.slice(0, 15);
    const visibleHolders = isExpanded ? latestHolders : latestHolders.slice(0, 10);

    const renderTrendIcon = (change: number | null) => {
        if (change === null) return <Minus size={12} className="text-muted-foreground" />;
        if (change > 0) return <TrendingUp size={12} className="text-emerald-500" />;
        if (change < 0) return <TrendingDown size={12} className="text-rose-500" />;
        return <Minus size={12} className="text-muted-foreground" />;
    };

    return (
        <div id="treasury-holders-section" className="mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <SectionHeader
                    title="Major Foreign Holders of U.S. Treasuries"
                    subtitle="Tracking institutional demand and sovereign accumulation of U.S. government debt"
                    exportId="treasury-holders-section"
                    className="mb-0"
                />

                {/* View Toggle */}
                <div className="bg-slate-950/50 p-1 rounded-lg border border-white/10 flex items-center">
                    <button
                        onClick={() => setViewMode('map')}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                            viewMode === 'map'
                                ? "bg-primary/20 text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Map
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                            viewMode === 'chart'
                                ? "bg-primary/20 text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Chart
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                            viewMode === 'table'
                                ? "bg-primary/20 text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Table
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {viewMode === 'map' ? (
                    <div className="w-full animate-in fade-in duration-500">
                        <TICWorldMapModule />
                    </div>
                ) : viewMode === 'chart' ? (
                    <div className="w-full animate-in fade-in duration-500">
                        <TreasuryHoldersChart data={chartData} height={600} />
                        <div className="mt-4 flex justify-end">
                            <span className="text-[0.65rem] text-muted-foreground/60 italic">
                                Showing top 15 holders. Switch to Table view for full list.
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Data Table Area */
                    <div className="w-full animate-in fade-in duration-500">
                        <div
                            className={cn(
                                "w-full bg-card/40 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-xl overflow-hidden shadow-xl transition-all duration-300",
                                isExpanded ? "max-h-[800px] overflow-y-auto" : "max-h-[500px]"
                            )}
                        >
                            <Table className="relative">
                                <TableHeader className="sticky top-0 bg-slate-950/90 backdrop-blur-md z-10 box-decoration-clone">
                                    <TableRow className="border-b border-border/50 shadow-sm hover:bg-transparent">
                                        <TableHead className="py-3 px-4 font-black uppercase text-[0.65rem] text-muted-foreground tracking-widest bg-transparent">Country / Holder</TableHead>
                                        <TableHead className="py-3 px-4 font-black uppercase text-[0.65rem] text-muted-foreground tracking-widest text-right bg-transparent">Holdings ($BN)</TableHead>
                                        <TableHead className="py-3 px-4 font-black uppercase text-[0.65rem] text-muted-foreground tracking-widest text-right bg-transparent">MoM %</TableHead>
                                        <TableHead className="py-3 px-4 font-black uppercase text-[0.65rem] text-muted-foreground tracking-widest text-right bg-transparent">YoY %</TableHead>
                                        <TableHead className="py-3 px-4 font-black uppercase text-[0.65rem] text-muted-foreground tracking-widest text-right bg-transparent">Share (%)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50">
                                    {visibleHolders.map((holder) => (
                                        <TableRow
                                            key={holder.country_name}
                                            className="group transition-colors hover:bg-muted/30 border-white/5"
                                        >
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{COUNTRY_FLAGS[holder.country_name] || '🌐'}</span>
                                                    <span className="font-bold text-xs text-foreground">{holder.country_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <span className="font-black text-xs font-mono">{formatCurrency(holder.holdings_usd_bn, { decimals: 0 })}</span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {renderTrendIcon(holder.mom_pct_change)}
                                                    <span className={cn(
                                                        "font-bold text-xs font-mono",
                                                        (holder.mom_pct_change || 0) > 0 ? 'text-emerald-500' : (holder.mom_pct_change || 0) < 0 ? 'text-rose-500' : 'text-muted-foreground'
                                                    )}>
                                                        {holder.mom_pct_change !== null ? formatPercentage(holder.mom_pct_change, { showSign: true, decimals: 2 }) : '—'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <span className="font-semibold text-xs text-muted-foreground font-mono">
                                                    {holder.yoy_pct_change !== null ? formatPercentage(holder.yoy_pct_change, { showSign: true, decimals: 1 }) : '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <span className="font-bold text-xs text-blue-400 font-mono">
                                                    {holder.pct_of_total_foreign ? formatPercentage(holder.pct_of_total_foreign, { decimals: 1 }) : '—'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {latestHolders.length > 10 && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary/80 uppercase tracking-widest transition-colors hover:underline"
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp size={12} /> Show Less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={12} /> View Full List ({latestHolders.length} Holders)
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Insight Note */}
            <div className="mt-4 flex items-start gap-2 max-w-3xl">
                <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[0.65rem] text-muted-foreground leading-relaxed">
                    Data source: U.S. Treasury International Capital (TIC). Monthly updates provided post-release (approx. 15th of month). Percentages based on total reported foreign holdings.
                </p>
            </div>
        </div>
    );
};
