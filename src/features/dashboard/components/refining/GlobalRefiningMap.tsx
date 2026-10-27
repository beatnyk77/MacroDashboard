import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { useGlobalRefiningData, GlobalRefiningFacility } from '@/hooks/useGlobalRefiningData';
import { Activity, Info, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m, AnimatePresence } from 'framer-motion';
import { CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const statusColors = {
    Expansion: CHART_COLORS.west,
    Conversion: CHART_COLORS.expansion,
    Closure: CHART_COLORS.stress,
    Operating: CHART_COLORS.tick,
};

const tankerRoutes = [
    { from: [55.9, 26.2], to: [103.5, 1.3], name: 'Hormuz to Malacca' }, // Middle East to Singapore
    { from: [-94.0, 29.9], to: [-3.7, 56.0], name: 'Gulf Coast to UK' }, // USA to Europe
    { from: [122.2, 30.2], to: [129.3, 35.5], name: 'China to Korea' },
];

const chokepoints = [
    { coordinates: [56.3, 26.6], name: 'Strait of Hormuz' },
    { coordinates: [101.3, 2.7], name: 'Strait of Malacca' },
];

export const GlobalRefiningMap: React.FC<{ className?: string }> = ({ className }) => {
    const { data } = useGlobalRefiningData();
    const [selectedFacility, setSelectedFacility] = useState<GlobalRefiningFacility | null>(null);

    const facilities = data?.facilities || [];

    return (
        <div className={cn("relative w-full h-[650px] bg-background/40 rounded-xl overflow-hidden border border-border backdrop-blur-sm", className)}>
            {/* Header Overlay */}
            <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold uppercase tracking-wider">
                    <Activity size={12} /> Capacity Elasticity Grid
                </div>
                <h2 className="text-3xl font-bold text-white uppercase tracking-heading">Global Refining <span className="text-blue-500">Imbalance Monitor</span></h2>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider max-w-sm">
                    Structural shift visualization: West closing infrastructure vs. East/ME mega-complex expansion.
                </p>
            </div>

            {/* Legend Overlay */}
            <div className="absolute bottom-8 right-8 z-10 hidden md:block">
                <div className="px-5 py-4 rounded-xl bg-background/80 backdrop-blur-xl border border-border space-y-3 shadow-2xl">
                    <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider block mb-1">Status Protocol</span>
                    {Object.entries(statusColors).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
                            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{status}</span>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-[1px] border-t border-dashed border-white/40" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanker Routes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Component */}
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 220,
                    center: [30, 20] // Global perspective
                }}
                className="w-full h-full"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={WHITE_ALPHA.ghost}
                                stroke={WHITE_ALPHA.faint}
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: 'none' },
                                    hover: { fill: WHITE_ALPHA.ghost, outline: 'none' },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {/* Tanker Routes */}
                {tankerRoutes.map((route, i) => (
                    <Line
                        key={i}
                        from={route.from as [number, number]}
                        to={route.to as [number, number]}
                        stroke={alpha(CHART_COLORS.west, 0.2)}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Chokepoints */}
                {chokepoints.map((cp, i) => (
                    <Marker key={i} coordinates={cp.coordinates as [number, number]}>
                        <g>
                            <circle r={4} fill={CHART_COLORS.stress} className="animate-pulse opacity-40" />
                            <circle r={1.5} fill={CHART_COLORS.stress} />
                        </g>
                    </Marker>
                ))}

                {/* Facility Bubbles */}
                {facilities.map((fac) => {
                    const color = statusColors[fac.status] || CHART_COLORS.tick;
                    const radius = Math.sqrt(fac.capacity_mbpd) * 0.8 + 2;

                    return (
                        <Marker
                            key={fac.id}
                            coordinates={[fac.longitude, fac.latitude]}
                            onClick={() => setSelectedFacility(fac)}
                        >
                            <g className="cursor-pointer">
                                <circle
                                    r={radius * 2}
                                    fill={color}
                                    className="opacity-10 animate-pulse"
                                />
                                <m.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.2 }}
                                    r={radius}
                                    fill={color}
                                    className="filter drop-shadow-[0_0_12px_currentColor]"
                                />
                            </g>
                        </Marker>
                    );
                })}
            </ComposableMap>

            {/* Facility Details Drawer */}
            <AnimatePresence>
                {selectedFacility && (
                    <m.div
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        className="absolute top-6 bottom-6 right-6 w-80 z-20 p-6 rounded-xl bg-background/90 backdrop-blur-3xl border border-border shadow-2xl flex flex-col"
                    >
                        <button
                            onClick={() => setSelectedFacility(null)}
                            className="absolute top-6 right-6 text-terminal-dim hover:text-white transition-colors"
                        >
                            <Info size={20} />
                        </button>

                        <div className="pt-4 mb-8">
                            <div className="inline-block px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
                                {selectedFacility.status} ASSET
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-heading leading-tight">{selectedFacility.facility_name}</h3>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1 border-l-2 border-border pl-3">
                                {selectedFacility.country} • {selectedFacility.region} Region
                            </div>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-border">
                                    <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider block mb-1">Capacity</span>
                                    <div className="text-xl font-bold text-white italic">{selectedFacility.capacity_mbpd}<span className="text-xs ml-1 not-italic opacity-40">MBPD</span></div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-border">
                                    <span className="text-xs font-semibold text-terminal-dim uppercase tracking-wider block mb-1">Utilization</span>
                                    <div className="text-xl font-bold text-emerald-400 italic">{selectedFacility.utilization_pct}%</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-border">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider underline decoration-blue-500/30 underline-offset-4">
                                        Import Dependency
                                    </span>
                                    <Shield size={12} className="text-blue-500/50" />
                                </div>
                                <p className="text-xs text-white/80 leading-relaxed font-bold italic">
                                    Correlation factor: {selectedFacility.import_dependency_correlation}
                                </p>
                                <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                                    <m.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${selectedFacility.import_dependency_correlation * 100}%` }}
                                        className="h-full bg-blue-500 shadow-[0_0_10px_theme(colors.blue.500)]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <Activity size={16} className="text-amber-500" />
                                <div className="text-xs text-amber-500/80 font-semibold uppercase tracking-heading">
                                    Historical Median: {selectedFacility.historical_median_pct}%
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Data Verified</span>
                            </div>
                            <span className="text-xs font-mono text-terminal-dim">{selectedFacility.as_of_date}</span>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Chokepoint Alerts (Static labels) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 pointer-events-none">
                <div className="flex gap-4">
                    <div className="px-2 py-1 bg-background/40 border border-border backdrop-blur-md rounded text-xs font-semibold text-terminal-dim uppercase tracking-wider">
                        Malacca Transit Open
                    </div>
                    <div className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 backdrop-blur-md rounded text-xs font-semibold text-rose-500 uppercase tracking-wider animate-pulse">
                        Hormuz Risk Elevated
                    </div>
                </div>
            </div>
        </div>
    );
};
