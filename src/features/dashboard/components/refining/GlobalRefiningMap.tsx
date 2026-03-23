import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { useGlobalRefiningData, GlobalRefiningFacility } from '@/hooks/useGlobalRefiningData';
import { Activity, Info, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const statusColors = {
    Expansion: '#3B82F6',
    Conversion: '#10B981',
    Closure: '#EF4444',
    Operating: '#6B7280',
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
        <div className={cn("relative w-full h-[650px] bg-black/40 rounded-[2rem] overflow-hidden border border-white/5 backdrop-blur-sm", className)}>
            {/* Header Overlay */}
            <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                    <Activity size={12} /> Capacity Elasticity Grid
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Global Refining <span className="text-blue-500">Imbalance Monitor</span></h2>
                <p className="text-[0.7rem] text-muted-foreground/60 uppercase font-bold tracking-widest max-w-sm">
                    Structural shift visualization: West closing infrastructure vs. East/ME mega-complex expansion.
                </p>
            </div>

            {/* Legend Overlay */}
            <div className="absolute bottom-8 right-8 z-10 hidden md:block">
                <div className="px-5 py-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl">
                    <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest block mb-1">Status Protocol</span>
                    {Object.entries(statusColors).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{status}</span>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-[1px] border-t border-dashed border-white/40" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tanker Routes</span>
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
                                fill="rgba(255,255,255,0.02)"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: 'none' },
                                    hover: { fill: 'rgba(255,255,255,0.04)', outline: 'none' },
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
                        stroke="rgba(59, 130, 246, 0.2)"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Chokepoints */}
                {chokepoints.map((cp, i) => (
                    <Marker key={i} coordinates={cp.coordinates as [number, number]}>
                        <g>
                            <circle r={4} fill="#EF4444" className="animate-pulse opacity-40" />
                            <circle r={1.5} fill="#EF4444" />
                        </g>
                    </Marker>
                ))}

                {/* Facility Bubbles */}
                {facilities.map((fac) => {
                    const color = statusColors[fac.status] || '#6B7280';
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
                                <motion.circle
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
                    <motion.div
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        className="absolute top-6 bottom-6 right-6 w-80 z-20 p-6 rounded-[2rem] bg-black/90 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col"
                    >
                        <button
                            onClick={() => setSelectedFacility(null)}
                            className="absolute top-6 right-6 text-muted-foreground/40 hover:text-white transition-colors"
                        >
                            <Info size={20} />
                        </button>

                        <div className="pt-4 mb-8">
                            <div className="inline-block px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.55rem] font-black uppercase tracking-widest mb-3">
                                {selectedFacility.status} ASSET
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{selectedFacility.facility_name}</h3>
                            <div className="text-[0.65rem] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 border-l-2 border-white/10 pl-3">
                                {selectedFacility.country} • {selectedFacility.region} Region
                            </div>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <span className="text-[0.55rem] font-black text-muted-foreground/50 uppercase tracking-widest block mb-1">Capacity</span>
                                    <div className="text-xl font-black text-white italic">{selectedFacility.capacity_mbpd}<span className="text-[0.6rem] ml-1 not-italic opacity-40">MBPD</span></div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <span className="text-[0.55rem] font-black text-muted-foreground/50 uppercase tracking-widest block mb-1">Utilization</span>
                                    <div className="text-xl font-black text-emerald-400 italic">{selectedFacility.utilization_pct}%</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[0.6rem] font-black text-blue-500 uppercase tracking-widest underline decoration-blue-500/30 underline-offset-4">
                                        Import Dependency
                                    </span>
                                    <Shield size={12} className="text-blue-500/50" />
                                </div>
                                <p className="text-xs text-white/80 leading-relaxed font-bold italic">
                                    Correlation factor: {selectedFacility.import_dependency_correlation}
                                </p>
                                <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${selectedFacility.import_dependency_correlation * 100}%` }}
                                        className="h-full bg-blue-500 shadow-[0_0_10px_#3B82F6]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                <Activity size={16} className="text-amber-500" />
                                <div className="text-[0.65rem] text-amber-500/80 font-black uppercase tracking-tight">
                                    Historical Median: {selectedFacility.historical_median_pct}%
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[0.6rem] font-bold text-muted-foreground uppercase">Data Verified</span>
                            </div>
                            <span className="text-[0.6rem] font-mono text-muted-foreground/40">{selectedFacility.as_of_date}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chokepoint Alerts (Static labels) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 pointer-events-none">
                <div className="flex gap-4">
                    <div className="px-2 py-1 bg-black/40 border border-white/5 backdrop-blur-md rounded text-[0.5rem] font-black text-white/40 uppercase tracking-widest">
                        Malacca Transit Open
                    </div>
                    <div className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 backdrop-blur-md rounded text-[0.5rem] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                        Hormuz Risk Elevated
                    </div>
                </div>
            </div>
        </div>
    );
};
