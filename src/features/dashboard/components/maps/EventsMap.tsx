import React, { useMemo } from 'react';
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    ZoomableGroup
} from "react-simple-maps";
import { useEventsMarkers } from '@/hooks/useEventsMarkers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, ShieldAlert, Users, Zap, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const TYPE_COLORS = {
    'Conflict': '#f43f5e', // Rose-500
    'Protest': '#f59e0b',  // Amber-500
    'Disruption': '#3b82f6' // Blue-500
};

const TYPE_ICONS = {
    'Conflict': ShieldAlert,
    'Protest': Users,
    'Disruption': Zap
};


export const EventsMap: React.FC<{ className?: string }> = ({ className }) => {
    const { data: markers = [], isLoading } = useEventsMarkers();

    // Group markers by proximity or just show raw points if they are sparse
    const displayMarkers = useMemo(() => markers, [markers]);
    const hasData = markers.length > 0;

    if (isLoading) return <div className={cn("h-[600px] animate-pulse bg-white/5 rounded-3xl", className)} />;

    return (
        <Card className={cn("bg-slate-950/40 border-white/5 backdrop-blur-3xl overflow-hidden group relative", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5 bg-white/[0.01]">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 italic">
                        <Globe2 className="h-5 w-5 text-blue-500" />
                        Geopolitical <span className="text-white">Event</span> Matrix
                        {!hasData && !isLoading && (
                            <span className="ml-4 px-2 py-0.5 rounded text-[0.55rem] font-bold bg-white/5 text-muted-foreground uppercase tracking-widest border border-white/5">
                                No Active Alerts
                            </span>
                        )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tight">
                        Real-time Conflict & Protest Markers (GDELT Feed)
                    </p>
                </div>
                <div className="flex gap-4">
                    {Object.entries(TYPE_COLORS).map(([type, color]) => {
                        const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
                        return (
                            <div key={type} className="flex items-center gap-2">
                                <Icon className="w-3 h-3" style={{ color }} />
                                <span className="text-[8px] font-black uppercase text-muted-foreground/80 tracking-widest">{type}</span>
                            </div>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent className="h-[600px] p-0 relative bg-black/20">
                {!hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                            <ShieldCheck className="w-10 h-10 text-emerald-500/50" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Global Stability Monitored</h3>
                        <p className="text-sm text-muted-foreground max-w-md font-medium leading-relaxed">
                            No major conflict or disruption events detected in the last 24 hours via GDELT live feed.
                            <br />
                            <span className="text-xs opacity-50 block mt-2">System continues to scan for conflict, civil unrest, and energy disruption signals.</span>
                        </p>
                    </div>
                ) : (
                    <TooltipProvider>
                        <ComposableMap
                            projectionConfig={{
                                rotate: [-10, 0, 0],
                                scale: 147
                            }}
                            width={800}
                            height={400}
                            style={{ width: "100%", height: "100%" }}
                        >
                            <ZoomableGroup zoom={1}>
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill="#1e293b"
                                                stroke="#334155"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { fill: "#334155", outline: "none" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        ))
                                    }
                                </Geographies>
                                {displayMarkers.map((marker, i) => (
                                    <Marker key={marker.id || i} coordinates={[marker.longitude, marker.latitude]}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <circle
                                                    r={Math.log(marker.count + 1) * 3 + 2}
                                                    fill={TYPE_COLORS[marker.type] || '#ccc'}
                                                    fillOpacity={0.6}
                                                    stroke={TYPE_COLORS[marker.type] || '#ccc'}
                                                    strokeWidth={1}
                                                    className="cursor-pointer hover:fill-opacity-100 transition-all duration-300"
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-950 border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[marker.type] }} />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-wider">{marker.type}</span>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-black text-white">{marker.location_name}</p>
                                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{marker.event_date}</p>
                                                    </div>
                                                    <div className="pt-2 border-t border-white/5">
                                                        <span className="text-[10px] font-mono text-emerald-400 font-bold">{marker.count} events reported</span>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </Marker>
                                ))}
                            </ZoomableGroup>
                        </ComposableMap>
                    </TooltipProvider>
                )}

                {/* Legend Overlay for Mobile or Detail */}
                <div className="absolute bottom-6 left-6 p-4 rounded-2xl bg-slate-950/80 border border-white/5 backdrop-blur-xl space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Live Intelligence feed</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                            <span className="text-[10px] font-bold text-white/80">Conflict Zones</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-bold text-white/80">Civil Unrest</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold text-white/80">Energy Disruption</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
