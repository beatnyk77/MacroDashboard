import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { TreasuryHolder } from '@/hooks/useTreasuryHolders';
import { getISO3FromTIC } from '@/utils/ticCountryMapping';
import { MetricType } from './TICWorldMapModule';
import { Box } from '@mui/material';
import { cn } from '@/lib/utils';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

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
        return scaleLinear<string>()
            .domain([0, Math.max(...values) * 0.8, Math.max(...values)])
            .range(['#0d3b44', '#0e7490', '#22d3ee']);
    }, [data, metric]);

    const top10 = useMemo(() => data.slice(0, 10), [data]);

    return (
        <Box className="w-full h-full relative cursor-crosshair">
            <ComposableMap
                projectionConfig={{ rotate: [-10, 0, 0], scale: 140 }}
                className="w-full h-full opacity-80"
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
                                    fill={countryData ? colorScale(metric === 'holdings' ? countryData.holdings_usd_bn : (countryData.pct_of_total_foreign || 0)) : "rgba(255,255,255,0.02)"}
                                    stroke={isHovered ? "#22d3ee" : isTop10 ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.05)"}
                                    strokeWidth={isHovered ? 1.5 : isTop10 ? 0.8 : 0.5}
                                    style={{
                                        default: { outline: 'none', transition: 'all 250ms' },
                                        hover: { outline: 'none', fill: countryData ? '#0891b2' : 'rgba(255,255,255,0.05)' },
                                        pressed: { outline: 'none' }
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>

                {/* Top 10 Markers / Flag Indicators */}
                {top10.map((h) => {
                    const iso3 = getISO3FromTIC(h.country_name);
                    if (!iso3) return null;

                    return (
                        <Marker key={h.country_name} coordinates={[0, 0]} /* Coordinates will be handled by centroid if possible, but react-simple-maps needs explicit coords for Marker */ >
                            {/* Marker logic usually needs a lookup table for lat/long of country centroids */}
                        </Marker>
                    );
                })}
            </ComposableMap>

            {/* In-Map Tooltip (Follows Cursor style) */}
            {hoveredCountry && (
                <div className="absolute bottom-12 left-12 p-6 rounded-2xl bg-black/90 backdrop-blur-3xl border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)] z-40 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-6 bg-cyan-400 rounded-full" />
                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">{hoveredCountry.country_name}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <span className="text-[0.6rem] font-black text-muted-foreground uppercase mb-1 block">Holdings</span>
                            <span className="text-lg font-black text-white tabular-nums">${Math.round(hoveredCountry.holdings_usd_bn)}B</span>
                        </div>
                        <div>
                            <span className="text-[0.6rem] font-black text-muted-foreground uppercase mb-1 block">YoY Change</span>
                            <span className={cn(
                                "text-lg font-black tabular-nums",
                                (hoveredCountry.yoy_pct_change || 0) > 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {(hoveredCountry.yoy_pct_change || 0) > 0 ? '+' : ''}{(hoveredCountry.yoy_pct_change || 0).toFixed(1)}%
                            </span>
                        </div>
                        <div>
                            <span className="text-[0.6rem] font-black text-muted-foreground uppercase mb-1 block">Share of Total</span>
                            <span className="text-lg font-black text-cyan-400 tabular-nums">{(hoveredCountry.pct_of_total_foreign || 0).toFixed(1)}%</span>
                        </div>
                        <div>
                            <span className="text-[0.6rem] font-black text-muted-foreground uppercase mb-1 block">Status</span>
                            <span className="text-[0.6rem] font-black text-white px-2 py-0.5 rounded bg-white/10 uppercase tracking-tighter">TIC Reporting</span>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    );
};
