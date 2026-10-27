import React, { useState, useMemo } from 'react';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { Globe, Anchor, ShieldAlert, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommodityImport } from '@/hooks/useCommodityImports';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useStaleness } from '@/hooks/useStaleness';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

interface MetalImportCardProps {
    metal: 'Gold' | 'Silver' | 'Rare Earth Metals';
    data: CommodityImport[];
    accentColor: string;
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    viewMode: 'value' | 'volume';
    formatVolume: (val: number) => string;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label, viewMode, formatVolume }) => {
    if (active && payload && payload.length) {
        return (
            <TerminalTooltipShell>
                <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <TerminalTooltipRow key={index} label={entry.name} swatch={entry.color}>
                            {viewMode === 'value'
                                ? `$${entry.value.toFixed(1)}B`
                                : formatVolume(entry.value * 1)
                            }
                        </TerminalTooltipRow>
                    ))}
                </div>
            </TerminalTooltipShell>
        );
    }
    return null;
};

export const MetalImportCard: React.FC<MetalImportCardProps> = ({ metal, data, accentColor }) => {
    const [viewMode, setViewMode] = useState<'value' | 'volume'>('value');

    const filteredData = useMemo(() => {
        return data.filter(d => d.metal === metal);
    }, [data, metal]);

    const chartData = useMemo(() => {
        const years = Array.from(new Set(filteredData.map(d => d.year))).sort();
        return years.map(year => {
            const india = filteredData.find(d => d.country === 'India' && d.year === year);
            const china = filteredData.find(d => d.country === 'China' && d.year === year);
            return {
                year,
                indiaValueUSD: india ? india.value_usd / 1e9 : 0, // Billion USD
                indiaVolume: india ? india.volume : 0,
                chinaValueUSD: china ? china.value_usd / 1e9 : 0,
                chinaVolume: china ? china.volume : 0,
            };
        });
    }, [filteredData]);

    const latestYear = useMemo(() => {
        if (!filteredData.length) return 2026;
        return Math.max(...filteredData.map(d => d.year));
    }, [filteredData]);

    const latestIndia = filteredData.find(d => d.country === 'India' && d.year === latestYear);
    const latestChina = filteredData.find(d => d.country === 'China' && d.year === latestYear);

    const stalenessDate = latestIndia?.updated_at || `${latestYear}-09-01`;
    const staleness = useStaleness(stalenessDate, 'annual');

    // Derived Metrics Calculations
    const indiaHHI = useMemo(() => {
        if (!latestIndia) return 0;
        return latestIndia.top_partners_json.reduce((sum, p) => sum + Math.pow(p.share, 2), 0);
    }, [latestIndia]);

    const chinaHHI = useMemo(() => {
        if (!latestChina) return 0;
        return latestChina.top_partners_json.reduce((sum, p) => sum + Math.pow(p.share, 2), 0);
    }, [latestChina]);

    const formatValue = (val: number) => {
        if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        return `$${val.toLocaleString()}`;
    };

    const formatVolume = (val: number) => {
        if (val >= 1e6) return `${(val / 1e6).toFixed(2)} MMT`;
        if (val >= 1e3) return `${(val / 1e3).toFixed(1)} kMT`;
        return `${val.toFixed(0)} MT`;
    };

    const getHHILevel = (hhi: number) => {
        if (hhi > 2500) return { label: 'Highly Concentrated', color: 'text-rose-500' };
        if (hhi > 1500) return { label: 'Moderate', color: 'text-amber-500' };
        return { label: 'Diversified', color: 'text-emerald-500' };
    };

    return (
        <div className="w-full space-y-12 my-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-10 rounded-full", `bg-${accentColor}-500`)} />
                        <h2 className="text-4xl md:text-5xl font-bold tracking-heading uppercase whitespace-pre-wrap">
                            {metal} <span className="text-terminal-dim">Imports</span>
                        </h2>
                    </div>
                    <p className="text-muted-foreground font-medium tracking-wide">
                        India vs China longitudinal flow observatory (2000–{latestYear})
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                        <FreshnessChip status={staleness.state} lastUpdated={stalenessDate} />
                        <span className="text-[11px] font-mono uppercase tracking-wider text-terminal-dim">
                            Source: UN Comtrade · DGCIS · GACC
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 bg-background/40 p-1 rounded-xl border border-border backdrop-blur-sm">
                    <button
                        onClick={() => setViewMode('value')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all",
                            viewMode === 'value' ? "bg-white/10 text-white shadow-lg" : "text-terminal-dim hover:text-muted-foreground"
                        )}
                    >
                        USD Value
                    </button>
                    <button
                        onClick={() => setViewMode('volume')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all",
                            viewMode === 'volume' ? "bg-white/10 text-white shadow-lg" : "text-terminal-dim hover:text-muted-foreground"
                        )}
                    >
                        Volume
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                <div className="p-8 rounded-xl bg-white/[0.02] border border-border hover:bg-white/[0.04] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">India Latest</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-3xl sm:text-4xl font-bold tracking-heading truncate">
                            {viewMode === 'value'
                                ? formatValue(latestIndia?.value_usd || 0)
                                : formatVolume(latestIndia?.volume || 0)
                            }
                        </span>
                        <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider mt-1">
                            {latestYear} Run-rate / YTD Flow
                        </span>
                    </div>
                </div>

                <div className="p-8 rounded-xl bg-white/[0.02] border border-border hover:bg-white/[0.04] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <Globe className="w-5 h-5 text-rose-500" />
                        <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">China Latest</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-3xl sm:text-4xl font-bold tracking-heading truncate">
                            {viewMode === 'value'
                                ? formatValue(latestChina?.value_usd || 0)
                                : formatVolume(latestChina?.volume || 0)
                            }
                        </span>
                        <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider mt-1">
                            {latestYear} Run-rate / YTD Flow
                        </span>
                    </div>
                </div>

                <div className="p-8 rounded-xl bg-white/[0.02] border border-border hover:bg-white/[0.04] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <Anchor className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Risk Index (HHI)</span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-end">
                            <span className={cn("text-3xl font-bold tracking-heading", getHHILevel(indiaHHI).color)}>
                                {Math.round(indiaHHI)}
                            </span>
                            <span className="text-xs font-semibold text-blue-500/40 uppercase tracking-wider mb-1">India</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-border pt-2">
                            <span className={cn("text-3xl font-bold tracking-heading", getHHILevel(chinaHHI).color)}>
                                {Math.round(chinaHHI)}
                            </span>
                            <span className="text-xs font-semibold text-rose-500/40 uppercase tracking-wider mb-1">China</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-xl bg-white/[0.02] border border-border hover:bg-white/[0.04] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <ShieldAlert className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Dependency</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-4xl font-bold tracking-heading">
                            {metal === 'Rare Earth Metals'
                                ? (latestIndia?.country === 'India' ? '98.2%' : 'High')
                                : (latestIndia && latestIndia.value_usd > 1e9 ? 'Deep' : 'Neutral')
                            }
                        </span>
                        <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider mt-1">
                            {metal === 'Rare Earth Metals' ? 'Import Dependency Ratio' : 'Strategic Importance'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 px-4">
                {/* Main Trend Chart */}
                <div className="lg:col-span-8 p-8 rounded-xl bg-background/40 border border-border backdrop-blur-xl shadow-2xl">
                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold tracking-heading uppercase">Longitudinal Trend</h3>
                            <p className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">Comparison of India vs China (2000–2025)</p>
                        </div>
                    </div>
                    <MacroChartContainer height={CHART_HEIGHTS.tall}>
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                                <XAxis
                                    {...DEFAULT_XAXIS_PROPS}
                                    dataKey="year"
                                    axisLine={false}
                                    tick={{ fill: WHITE_ALPHA.dim, fontSize: 11, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    {...DEFAULT_YAXIS_PROPS}
                                    width={60}
                                    axisLine={false}
                                    tick={{ fill: WHITE_ALPHA.dim, fontSize: 11, fontWeight: 700 }}
                                />
                                <Tooltip content={(props) => <ChartTooltip {...props} viewMode={viewMode} formatVolume={formatVolume} />} />
                                <Legend
                                    iconType="circle"
                                    verticalAlign="top"
                                    align="right"
                                    wrapperStyle={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '0px', paddingBottom: '20px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={viewMode === 'value' ? 'indiaValueUSD' : 'indiaVolume'}
                                    name="India"
                                    stroke={CHART_COLORS.west}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, stroke: CHART_COLORS.west, strokeWidth: 4, fill: '#000' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={viewMode === 'value' ? 'chinaValueUSD' : 'chinaVolume'}
                                    name="China"
                                    stroke={CHART_COLORS.east}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, stroke: CHART_COLORS.east, strokeWidth: 4, fill: '#000' }}
                                />
                            </LineChart>
                    </MacroChartContainer>
                </div>

                {/* Partner Breakdown */}
                <div className="lg:col-span-4 p-8 rounded-xl bg-white/[0.02] border border-border flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold tracking-heading uppercase">Supply Origins</h3>
                        <p className="text-xs font-semibold text-terminal-dim uppercase tracking-wider">{latestYear} Partner Share (% Share)</p>
                    </div>

                    <div className="space-y-8 flex-grow">
                        <div className="space-y-4">
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">India Directives</span>
                            <div className="space-y-3">
                                {latestIndia?.top_partners_json.map((p) => (
                                    <div key={p.partner} className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold uppercase">
                                            <span>{p.partner}</span>
                                            <span>{p.share.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${p.share}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">China Directives</span>
                            <div className="space-y-3">
                                {latestChina?.top_partners_json.map((p) => (
                                    <div key={p.partner} className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold uppercase">
                                            <span>{p.partner}</span>
                                            <span>{p.share.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${p.share}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border">
                        <div className="flex items-center gap-2 text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                            <Layers className="w-3 h-3" />
                            Source: UN Comtrade / WGC / OEC.world
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
