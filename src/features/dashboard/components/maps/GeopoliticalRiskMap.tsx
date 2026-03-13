import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useGeopoliticalOSINT, GeopoliticalOSINT } from '@/hooks/useGeopoliticalOSINT';
import { Plane, Ship, Activity, Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const assetIcons = {
    jet: <Plane className="w-4 h-4" />,
    vessel: <Ship className="w-4 h-4" />,
};

const assetColors = {
    jet: 'text-indigo-400',
    vessel: 'text-emerald-400',
};

export const GeopoliticalRiskMap: React.FC<{ className?: string }> = ({ className }) => {
    const { data: assets, isLoading } = useGeopoliticalOSINT();
    const [selectedAsset, setSelectedAsset] = useState<GeopoliticalOSINT | null>(null);

    return (
        <div className={cn("relative w-full h-[600px] bg-slate-950/40 rounded-[2.5rem] overflow-hidden border border-white/5 backdrop-blur-md", className)}>
            {/* Header Overlay */}
            <div className="absolute top-8 left-8 z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[0.65rem] font-black uppercase tracking-[0.2em]">
                    <Globe size={12} /> OSINT Infrastructure
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Geopolitical <span className="text-blue-500">Live Risk Map</span></h2>
                <p className="text-[0.65rem] text-muted-foreground/60 uppercase font-bold tracking-widest max-w-xs">
                    Real-time ADS-B and Marine tracking correlating high-value assets with regional stress signals.
                </p>
            </div>

            {/* Legend Overlay */}
            <div className="absolute top-8 right-8 z-10 flex flex-col gap-3">
                <div className="px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Private Jets</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Tanker/Vessel</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">High Risk Zone</span>
                    </div>
                </div>
            </div>

            {/* Fallback Table for AI Crawlers (GEO) */}
            <div className="sr-only" aria-hidden="true">
                <table>
                    <caption>Geopolitical OSINT - Tracked High-Value Assets</caption>
                    <thead>
                        <tr>
                            <th>Callsign</th>
                            <th>Type</th>
                            <th>Correlation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets?.map(asset => (
                            <tr key={asset.id}>
                                <td>{asset.callsign}</td>
                                <td>{asset.type}</td>
                                <td>{asset.macro_correlation}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Map */}
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 300,
                    center: [80, 30] // Focus on Middle East to Asia
                }}
                className="w-full h-full opacity-60"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="rgba(255,255,255,0.03)"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: 'none' },
                                    hover: { fill: 'rgba(255,255,255,0.05)', outline: 'none' },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {/* Conflict HeatZones (Hormuz, etc.) */}
                <Marker coordinates={[56.3, 26.6]}>
                    <g>
                        <circle r={30} fill="rgba(244, 63, 94, 0.1)" className="animate-pulse" />
                        <circle r={10} fill="rgba(244, 63, 94, 0.2)" />
                    </g>
                </Marker>

                {/* Assets */}
                {!isLoading && assets?.map((asset) => (
                    <Marker
                        key={asset.id}
                        coordinates={[asset.lng, asset.lat]}
                        onClick={() => setSelectedAsset(asset)}
                    >
                        <g className="cursor-pointer">
                            <circle
                                r={12}
                                fill="currentColor"
                                className={cn(
                                    asset.type === 'jet' ? 'text-indigo-500' : 'text-emerald-500',
                                    "opacity-20 animate-pulse"
                                )}
                            />
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                r={6}
                                fill="currentColor"
                                className={cn(
                                    asset.type === 'jet' ? 'text-indigo-500' : 'text-emerald-400',
                                    "filter drop-shadow-[0_0_8px_currentColor]"
                                )}
                            />
                        </g>
                    </Marker>
                ))}
            </ComposableMap>

            {/* Asset Detail Drawer */}
            <AnimatePresence>
                {selectedAsset && (
                    <motion.div
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        className="absolute top-8 bottom-8 right-8 w-80 z-20 p-6 rounded-[2rem] bg-black/90 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col"
                    >
                        <button 
                            onClick={() => setSelectedAsset(null)}
                            className="absolute top-6 right-6 text-muted-foreground/40 hover:text-white transition-colors"
                        >
                            <Activity size={20} />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className={cn(
                                "p-4 rounded-2xl bg-white/[0.03] border border-white/10",
                                assetColors[selectedAsset.type]
                            )}>
                                {assetIcons[selectedAsset.type]}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">{selectedAsset.callsign}</h3>
                                <div className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">
                                    {selectedAsset.type} • {selectedAsset.owner_flag || 'Unknown Origin'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <span className="text-[0.6rem] font-black text-blue-500 uppercase tracking-widest block mb-2 underline decoration-blue-500/30 underline-offset-4">
                                    Macro Correlation
                                </span>
                                <p className="text-xs text-white/70 leading-relaxed font-medium">
                                    {selectedAsset.macro_correlation}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <span className="text-[0.55rem] font-bold text-muted-foreground/60 uppercase">Latitude</span>
                                    <div className="text-[0.75rem] font-mono text-white mt-1">{selectedAsset.lat.toFixed(4)}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <span className="text-[0.55rem] font-bold text-muted-foreground/60 uppercase">Longitude</span>
                                    <div className="text-[0.75rem] font-mono text-white mt-1">{selectedAsset.lng.toFixed(4)}</div>
                                </div>
                            </div>

                            {selectedAsset.metadata && (
                                <div className="space-y-3">
                                    {selectedAsset.metadata.altitude && (
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-[0.65rem] font-bold text-muted-foreground uppercase">Altitude</span>
                                            <span className="text-[0.75rem] font-mono text-white">{selectedAsset.metadata.altitude} ft</span>
                                        </div>
                                    )}
                                    {selectedAsset.metadata.velocity && (
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-[0.65rem] font-bold text-muted-foreground uppercase">Velocity</span>
                                            <span className="text-[0.75rem] font-mono text-white">{Math.round(selectedAsset.metadata.velocity * 1.94384)} knots</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedAsset.metadata?.gdelt_url && (
                                <a 
                                    href={selectedAsset.metadata.gdelt_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.65rem] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
                                >
                                    View OSINT Source <ExternalLink size={12} />
                                </a>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[0.6rem] font-bold text-muted-foreground uppercase">Real-Time</span>
                            </div>
                            <span className="text-[0.6rem] font-mono text-muted-foreground/40 italic">Refreshed 1m ago</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Status bar */}
            <div className="absolute bottom-8 left-8 z-10 hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/5">
                    <Activity size={12} className="text-emerald-500" />
                    <span className="text-[0.6rem] font-black text-white uppercase tracking-widest">{assets?.length || 0} Assets Tracked</span>
                </div>
                {isLoading && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                            <Globe size={12} className="text-blue-500" />
                        </motion.div>
                        <span className="text-[0.6rem] font-black text-blue-500 uppercase tracking-widest">Scanning...</span>
                    </div>
                )}
            </div>
        </div>
    );
};
