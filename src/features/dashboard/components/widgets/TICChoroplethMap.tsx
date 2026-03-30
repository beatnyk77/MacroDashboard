import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleThreshold } from 'd3-scale';
import { TreasuryHolder } from '@/hooks/useTreasuryHolders';
import { getISO3FromTIC } from '@/utils/ticCountryMapping';
import { MetricType } from './TICWorldMapModule';
import { Box } from '@mui/material';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Mapping country names to flags
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

interface TICChoroplethMapProps {
    data: TreasuryHolder[];
    metric: MetricType;
    hoveredCountry: TreasuryHolder | null;
    onHover: (h: TreasuryHolder | null) => void;
    onSelect: (h: TreasuryHolder | null) => void;
}

export const TICChoroplethMap: React.FC<TICChoroplethMapProps> = ({ data, metric, hoveredCountry, onHover, onSelect }) => {
    const colorScale = useMemo(() => {
        const values = data.map(d => metric === 'holdings' ? d.holdings_usd_bn : (d.pct_of_total_foreign || 0));
        const maxVal = Math.max(...values, 100);
        
        // 5-step quantized teal scale for high contrast
        return scaleThreshold<number, string>()
            .domain([maxVal * 0.05, maxVal * 0.15, maxVal * 0.35, maxVal * 0.7])
            .range(['#112229', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9']);
    }, [data, metric]);

    const top10 = useMemo(() => data.slice(0, 10), [data]);

    return (
        <Box className="w-full h-full relative overflow-hidden bg-[#050505]">
            <ComposableMap
                projectionConfig={{ rotate: [-10, 0, 0], scale: 145 }}
                className="w-full h-full"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const iso3 = geo.properties.ISO_A3 || geo.id;
                            const countryData = data.find(d => getISO3FromTIC(d.country_name) === iso3);
                            const isTop10 = top10.some(d => getISO3FromTIC(d.country_name) === iso3);
                            const isHovered = hoveredCountry && getISO3FromTIC(hoveredCountry.country_name) === iso3;

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onMouseEnter={() => countryData && onHover(countryData)}
                                    onMouseLeave={() => onHover(null)}
                                    onClick={() => countryData && onSelect(countryData)}
                                    fill={countryData ? colorScale(metric === 'holdings' ? countryData.holdings_usd_bn : (countryData.pct_of_total_foreign || 0)) : "#0f172a"}
                                    stroke={isHovered ? "#ffffff" : isTop10 ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.08)"}
                                    strokeWidth={isHovered ? 1.5 : isTop10 ? 0.8 : 0.4}
                                    style={{
                                        default: { outline: 'none', transition: 'all 200ms' },
                                        hover: { outline: 'none', fill: countryData ? '#0891b2' : '#1e293b', cursor: countryData ? 'pointer' : 'default' },
                                        pressed: { outline: 'none' }
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>

            {/* Floating Tooltip Interface */}
            {hoveredCountry && (
                <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 p-6 rounded-2xl bg-slate-950/95 backdrop-blur-3xl border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] z-50 min-w-[260px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4 mb-4 border-b border-white/12 pb-3">
                        <span className="text-3xl filter drop-shadow-md">{COUNTRY_FLAGS[hoveredCountry.country_name] || '🌐'}</span>
                        <div className="flex flex-col">
                            <h4 className="text-sm font-black text-white uppercase tracking-heading italic">{hoveredCountry.country_name}</h4>
                            <span className="text-xs font-black text-cyan-400 uppercase tracking-uppercase">Sovereign Treasury Holder</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        <div className="space-y-1">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">Holdings</span>
                            <div className="text-2xl font-black text-white tabular-nums">${Math.round(hoveredCountry.holdings_usd_bn)}B</div>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">Share (%)</span>
                            <div className="text-2xl font-black text-cyan-400 tabular-nums">{(hoveredCountry.pct_of_total_foreign || 0).toFixed(1)}%</div>
                        </div>
                        <div className="col-span-2 pt-3 border-t border-white/12 flex items-center justify-between">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">Year-on-Year Change</span>
                            <div className={cn(
                                "flex items-center gap-1.5 text-sm font-black tabular-nums",
                                (hoveredCountry.yoy_pct_change || 0) > 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {(hoveredCountry.yoy_pct_change || 0) > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {Math.abs(hoveredCountry.yoy_pct_change || 0).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    );
};
