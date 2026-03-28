import React, { useMemo, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoldDebtCoverageG20, G20GoldDebtRow } from '@/hooks/useGoldDebtCoverageG20';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleQuantize } from 'd3-scale';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { Landmark, TrendingDown, ShieldAlert } from 'lucide-react';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_FLAGS: Record<string, string> = {
    'US': '🇺🇸', 'UK': '🇬🇧', 'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹',
    'CA': '🇨🇦', 'JP': '🇯🇵', 'CN': '🇨🇳', 'IN': '🇮🇳', 'RU': '🇷🇺', 'BR': '🇧🇷',
    'ZA': '🇿🇦', 'AU': '🇦🇺', 'KR': '🇰🇷', 'MX': '🇲🇽', 'ID': '🇮🇩', 'TR': '🇹🇷',
    'SA': '🇸🇦', 'AR': '🇦🇷', 'EU': '🇪🇺'
};

const COUNTRY_NAMES: Record<string, string> = {
    'US': 'United States', 'UK': 'United Kingdom', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany', 'IT': 'Italy',
    'CA': 'Canada', 'JP': 'Japan', 'CN': 'China', 'IN': 'India', 'RU': 'Russia', 'BR': 'Brazil',
    'ZA': 'South Africa', 'AU': 'Australia', 'KR': 'South Korea', 'MX': 'Mexico', 'ID': 'Indonesia', 'TR': 'Turkey',
    'SA': 'Saudi Arabia', 'AR': 'Argentina', 'EU': 'Eurozone'
};

// Map ISO-A3 codes from geoUrl to our 2-letter codes
const ISO3_TO_CODE: Record<string, string> = {
    'USA': 'US', 'GBR': 'GB', 'FRA': 'FR', 'DEU': 'DE', 'ITA': 'IT',
    'CAN': 'CA', 'JPN': 'JP', 'CHN': 'CN', 'IND': 'IN', 'RUS': 'RU',
    'BRA': 'BR', 'ZAF': 'ZA', 'AUS': 'AU', 'KOR': 'KR', 'MEX': 'MX',
    'IDN': 'ID', 'TUR': 'TR', 'SAU': 'SA', 'ARG': 'AR'
};

const formatCurrency = (val: number, fxRate: number) => {
    if (fxRate === 1) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    }
    // Generic local currency format if not USD
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val) + ' (Local)';
};

export const G20GoldDebtCoveragePanel: React.FC = () => {
    const { data, isLoading, isError, error } = useGoldDebtCoverageG20();
    const [hoveredCountry, setHoveredCountry] = useState<G20GoldDebtRow | null>(null);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>('US'); // Default to US

    const selectedCountryData = useMemo(() => {
        if (!selectedCountryCode || !data?.latest) return null;
        return data.latest.find(d => d.country_code === selectedCountryCode);
    }, [selectedCountryCode, data]);

    const countryHistory = useMemo(() => {
        if (!selectedCountryCode || !data?.history) return [];
        return data.history[selectedCountryCode] || [];
    }, [selectedCountryCode, data]);

    const colorScale = useMemo(() => {
        if (!data?.latest || data.latest.length === 0) return scaleQuantize<string>().range(['#1e293b']);

        // Higher debt per oz -> red risk
        return scaleQuantize<string>()
            .domain([0, 1000000]) // arbitrary cap, actually debt per oz varies wildly by currency
            // wait, comparing local currencies directly on a color scale is nonsense because of magnitude differences (e.g. Yen vs USD).
            // We should use the Coverage Ratio (which is % and FX-invariant!) for the map colors!
            // Lower coverage = higher risk (red), Higher coverage = robust (green)
            .domain([0, 15]) // 0% to 15% coverage roughly covers G20
            .range(['#9f1239', '#be123c', '#f59e0b', '#10b981', '#059669']); // deep red to green
    }, [data]);

    const getCoverageColor = (coverage: number) => {
        if (coverage > 10) return '#10b981'; // Green
        if (coverage > 4) return '#f59e0b'; // Yellow
        return '#f43f5e'; // Red
    };

    if (isLoading) {
        return <Skeleton className="h-[600px] w-full rounded-[2.5rem] bg-white/5" />;
    }

    if (isError) {
        return (
            <Card className="p-8 bg-black/40 backdrop-blur-xl border-rose-500/10 h-[400px] flex items-center justify-center rounded-[2.5rem]">
                <div className="text-center text-rose-400">
                    <ShieldAlert size={32} className="mx-auto mb-4 opacity-50" />
                    <p className="font-black uppercase tracking-widest text-xs mb-2">Relay Divergence</p>
                    <p className="text-xs text-rose-400/60 font-medium max-w-xs mx-auto italic">
                        {error instanceof Error ? error.message : 'Sovereign feed encountered a runtime error.'}
                    </p>
                </div>
            </Card>
        );
    }

    if (!data?.latest || data.latest.length === 0) {
        return (
            <Card className="p-8 bg-black/40 backdrop-blur-xl border-white/5 h-[400px] flex items-center justify-center rounded-[2.5rem]">
                <div className="text-center text-muted-foreground/50">
                    <ShieldAlert size={32} className="mx-auto mb-4 opacity-50" />
                    <p>Sovereign coverage data unavailable.</p>
                </div>
            </Card>
        );
    }

    // Sort by coverage ratio (lowest coverage = highest risk = top of the list)
    const sortedRows = [...data.latest].sort((a, b) => a.coverage_ratio - b.coverage_ratio);

    return (
        <Card className="p-6 md:p-10 bg-[#050505] relative overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 z-10 relative">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[0.65rem] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                        <Landmark size={12} /> Systemic Solvency
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase italic drop-shadow-md">
                        G20 <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-amber-500">Gold</span> Debt Coverage
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground max-w-2xl leading-relaxed">
                        Tracks the ratio of Sovereign Gold Reserves to Total Government Debt.
                        A lower percentage indicates higher fiat over-extension, measuring exactly how many local currency debt units are backed by a single ounce of gold.
                    </p>
                </div>

                {/* Narrative Insight */}
                {selectedCountryData && (
                    <div className="flex-1 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 md:max-w-xs animate-in fade-in slide-in-from-right-4">
                        <div className="text-[0.6rem] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ShieldAlert size={10} /> Solvency Insight
                        </div>
                        <p className="text-[0.7rem] text-amber-200/70 leading-relaxed italic">
                            {COUNTRY_NAMES[selectedCountryData.country_code]} would need <span className="text-amber-400 font-bold">{(selectedCountryData.inverse_coverage_ratio).toFixed(1)}x</span> its current gold reserves to fully back its sovereign debt at current prices.
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Map Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[450px] relative rounded-3xl bg-slate-950/50 border border-white/[0.03] overflow-hidden group">
                        <div className="absolute top-4 left-4 z-10 pointer-events-none">
                            <span className="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em]">Sovereign Heatmap (Coverage %)</span>
                        </div>
                        <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 145 }} className="w-full h-full">
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const iso3 = geo.properties.ISO_A3 || geo.id;
                                        const code = ISO3_TO_CODE[iso3];
                                        const countryData = sortedRows.find(d => d.country_code === code);
                                        const isHovered = hoveredCountry?.country_code === code;

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                onMouseEnter={() => countryData && setHoveredCountry(countryData)}
                                                onMouseLeave={() => setHoveredCountry(null)}
                                                fill={countryData ? colorScale(countryData.coverage_ratio) : "#0f172a"}
                                                stroke={isHovered ? "#ffffff" : "rgba(255,255,255,0.05)"}
                                                strokeWidth={isHovered ? 1.5 : 0.5}
                                                style={{
                                                    default: { outline: 'none', transition: 'all 200ms' },
                                                    hover: { outline: 'none', fill: countryData ? colorScale(countryData.coverage_ratio) : '#1e293b', cursor: countryData ? 'pointer' : 'default' },
                                                    pressed: { outline: 'none' }
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ComposableMap>

                        {hoveredCountry && (
                            <div className="absolute bottom-6 left-6 p-5 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50 min-w-[240px] animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                                    <span className="text-2xl">{COUNTRY_FLAGS[hoveredCountry.country_code]}</span>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider">{COUNTRY_NAMES[hoveredCountry.country_code] || hoveredCountry.country_code}</h4>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Gold Coverage</div>
                                        <div className="font-black text-lg" style={{ color: getCoverageColor(hoveredCountry.coverage_ratio) }}>
                                            {hoveredCountry.coverage_ratio.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Debt per Gold Ounce</div>
                                        <div className="font-mono text-sm text-white/90">
                                            {formatCurrency(hoveredCountry.debt_per_oz_local, hoveredCountry.fx_rate_local_per_usd)}
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-[0.65rem] text-amber-500/80 leading-tight italic">
                                            Local gold price must reach {formatCurrency(hoveredCountry.implied_gold_price_usd * hoveredCountry.fx_rate_local_per_usd, hoveredCountry.fx_rate_local_per_usd)} to fully back sovereign debt.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Country Detail Card & Trend */}
                    {selectedCountryData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                            <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/[0.03] flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl">{COUNTRY_FLAGS[selectedCountryData.country_code]}</span>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">{COUNTRY_NAMES[selectedCountryData.country_code]}</h4>
                                        <p className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-[0.2em]">{selectedCountryData.country_code} / SOVEREIGN AUDIT</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[0.6rem] font-black text-white/40 uppercase tracking-widest mb-1">Inverse Coverage</p>
                                        <p className="text-xl font-black text-rose-500">{(selectedCountryData.inverse_coverage_ratio).toFixed(1)}x</p>
                                        <p className="text-[0.55rem] text-muted-foreground italic">Debt to Gold Value</p>
                                    </div>
                                    <div>
                                        <p className="text-[0.6rem] font-black text-white/40 uppercase tracking-widest mb-1">Debt / Gold Oz</p>
                                        <p className="text-xl font-black text-amber-400 font-mono">
                                            {formatCurrency(selectedCountryData.debt_per_oz_local, selectedCountryData.fx_rate_local_per_usd)}
                                        </p>
                                        <p className="text-[0.55rem] text-muted-foreground italic">Local Currency Units</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/[0.03]">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[0.65rem] font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingDown size={12} className="text-amber-500" /> Coverage Trend (30D)
                                    </h4>
                                    <span className="text-[0.6rem] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active Ingestion</span>
                                </div>
                                <div className="h-[100px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={countryHistory}>
                                            <Bar dataKey="coverage_ratio" radius={[2, 2, 0, 0]}>
                                                {countryHistory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getCoverageColor(entry.coverage_ratio)} opacity={0.6 + (index / countryHistory.length) * 0.4} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-2 flex justify-between text-[0.55rem] font-black text-white/20 uppercase tracking-widest">
                                    <span>T-30 Days</span>
                                    <span>Current</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Top 10 Red Zone Bar Chart */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/[0.03] space-y-6">
                    <div className="flex items-center gap-2">
                        <TrendingDown size={16} className="text-rose-500" />
                        <h4 className="text-xs font-black uppercase text-white/70 tracking-widest">Highest Fiat Dilution</h4>
                    </div>
                    <div className="h-[380px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedRows.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="country_code"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={(props) => {
                                        const { x, y, payload } = props;
                                        return (
                                            <text x={x - 10} y={y} dy={4} fill="#fff" fontSize={11} fontWeight={800} textAnchor="end" className="uppercase drop-shadow-md">
                                                {payload.value}
                                            </text>
                                        );
                                    }}
                                    width={40}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const data = payload[0].payload as G20GoldDebtRow;
                                        return (
                                            <div className="bg-black border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                                                <div className="font-black text-xs text-white/70 mb-1">{COUNTRY_NAMES[data.country_code]}</div>
                                                <div className="font-mono text-sm text-rose-400">{data.coverage_ratio.toFixed(2)}% Coverage</div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="coverage_ratio" radius={[0, 4, 4, 0]} barSize={20}>
                                    {sortedRows.slice(0, 10).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getCoverageColor(entry.coverage_ratio)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Terminal Table */}
            <div className="mt-8 rounded-3xl border border-white/5 bg-black/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground w-16">Rank</th>
                                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">Sovereign</th>
                                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground text-right">Coverage %</th>
                                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground text-right hidden sm:table-cell">Inverse Ratio</th>
                                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground text-right hidden lg:table-cell">Gold (Tonnes)</th>
                                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground text-right">Debt / Gold Oz (Local)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {sortedRows.map((row, idx) => (
                                <tr 
                                    key={row.country_code} 
                                    className={`hover:bg-amber-500/5 transition-colors group cursor-pointer ${selectedCountryCode === row.country_code ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''}`}
                                    onClick={() => setSelectedCountryCode(row.country_code)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-white/30 tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">{COUNTRY_FLAGS[row.country_code] || '🌐'}</span>
                                            <div>
                                                <div className="text-sm font-bold text-white/90">{COUNTRY_NAMES[row.country_code] || row.country_code}</div>
                                                <div className="text-[0.6rem] font-bold text-muted-foreground uppercase">{row.country_code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-mono text-sm font-medium" style={{ color: getCoverageColor(row.coverage_ratio) }}>
                                            {row.coverage_ratio.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right hidden sm:table-cell">
                                        <span className="text-sm text-white/80 font-mono tabular-nums">
                                            {row.inverse_coverage_ratio.toFixed(1)}x
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right hidden lg:table-cell">
                                        <span className="text-sm text-white/50 font-mono tabular-nums">
                                            {(row.gold_reserves_oz / 32150.7).toLocaleString(undefined, { maximumFractionDigits: 0 })}t
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm text-amber-200/90 font-mono tabular-nums group-hover:text-amber-400 transition-colors">
                                            {formatCurrency(row.debt_per_oz_local, row.fx_rate_local_per_usd)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
};
