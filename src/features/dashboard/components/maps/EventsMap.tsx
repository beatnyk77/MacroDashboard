import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useEventsMarkers } from '@/hooks/useEventsMarkers';
import { Flame, Zap, AlertTriangle, Droplet, Activity, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const eventIcons: Record<string, React.ReactNode> = {
    conflict: <Flame className="w-3 h-3" />,
    protest: <Zap className="w-3 h-3" />,
    disruption: <AlertTriangle className="w-3 h-3" />,
    energy: <Droplet className="w-3 h-3" />,
    default: <Activity className="w-3 h-3" />
};

const eventColors: Record<string, string> = {
    conflict: 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] filter',
    protest: 'text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] filter',
    disruption: 'text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] filter',
    energy: 'text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] filter',
    default: 'text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)] filter'
};

export const EventsMap: React.FC<{ className?: string }> = ({ className }) => {
    const { data: events, isLoading, error } = useEventsMarkers();
    const [hoveredEvent, setHoveredEvent] = useState<any>(null);

    // Query for last ingestion status
    const { data: lastIngestion } = useQuery({
        queryKey: ['last-ingestion-events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ingestion_logs')
                .select('*')
                .eq('function_name', 'ingest-events-markers')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (error) throw error;
            return data;
        },
        refetchInterval: 60000 // Refresh every minute
    });

    const hasEvents = events && events.length > 0;
    const isFeedAvailable = !error && !isLoading;
    const lastSync = lastIngestion?.created_at ? new Date(lastIngestion.created_at) : null;
    const ingestionSuccess = lastIngestion?.status === 'success';

    return (
        <div className={cn("relative w-full h-full min-h-[500px] bg-slate-950/50 rounded-3xl overflow-hidden border border-white/5", className)}>
            {/* Header with Status */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        Live Event Feed
                    </span>
                </div>

                {/* Ingestion Status Indicator */}
                <div className={cn(
                    "px-3 py-1.5 rounded-xl backdrop-blur-xl border flex items-center gap-2",
                    ingestionSuccess
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-amber-500/10 border-amber-500/20"
                )}>
                    {ingestionSuccess ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                    ) : (
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                    )}
                    <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest",
                        ingestionSuccess ? "text-emerald-400" : "text-amber-400"
                    )}>
                        {ingestionSuccess ? 'Feed Active' : 'Feed Degraded'}
                    </span>
                </div>

                {/* Last Sync Timestamp */}
                {lastSync && (
                    <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span className="text-[9px] font-mono text-muted-foreground">
                            {new Date().getTime() - lastSync.getTime() < 3600000
                                ? `${Math.floor((new Date().getTime() - lastSync.getTime()) / 60000)}m ago`
                                : lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            }
                        </span>
                    </div>
                )}
            </div>

            {/* Event Count Badge */}
            {hasEvents && (
                <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
                        Active Events
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums">
                        {events.length}
                    </div>
                </div>
            )}

            {/* Map */}
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 140,
                    center: [0, 20]
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
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: 'none' },
                                    hover: { fill: 'rgba(255,255,255,0.04)', outline: 'none' },
                                    pressed: { outline: 'none' }
                                }}
                            />
                        ))
                    }
                </Geographies>

                {hasEvents && events.map((event: any, idx: number) => (
                    <Marker
                        key={idx}
                        coordinates={[event.longitude, event.latitude]}
                        onMouseEnter={() => setHoveredEvent(event)}
                        onMouseLeave={() => setHoveredEvent(null)}
                    >
                        <g className="cursor-pointer">
                            <circle
                                r={10}
                                fill="currentColor"
                                className={cn(
                                    eventColors[event.type] || eventColors.default,
                                    "opacity-30 animate-ping"
                                )}
                            />
                            <circle
                                r={5}
                                fill="currentColor"
                                className={cn(
                                    eventColors[event.type] || eventColors.default,
                                    "opacity-80"
                                )}
                            />
                            <circle
                                r={2}
                                fill="#ffffff"
                            />
                        </g>
                    </Marker>
                ))}
            </ComposableMap>

            {/* Hover Tooltip */}
            {hoveredEvent && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20 p-4 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            "p-2 rounded-xl",
                            eventColors[hoveredEvent.type] || eventColors.default
                        )}>
                            {eventIcons[hoveredEvent.type] || eventIcons.default}
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                                {hoveredEvent.type}
                            </div>
                            <div className="text-sm font-bold text-white mb-2 line-clamp-2">
                                {hoveredEvent.location_name || 'Event Detected'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {hoveredEvent.latitude.toFixed(2)}, {hoveredEvent.longitude.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State - Distinguish between no events and feed failure */}
            {!isLoading && !hasEvents && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950/80 backdrop-blur-sm">
                    <div className="text-center max-w-md px-6">
                        {isFeedAvailable ? (
                            <>
                                <Activity className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">
                                    All Quiet
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md font-medium leading-relaxed">
                                    No major conflict or disruption events detected in the last 24 hours via GDELT live feed.
                                </p>
                                <p className="text-xs opacity-50 text-muted-foreground mt-3">
                                    System continues to scan for conflict, civil unrest, and energy disruption signals.
                                </p>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-12 h-12 text-amber-500/30 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">
                                    Feed Unavailable
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md font-medium leading-relaxed">
                                    Unable to retrieve GDELT event data. The feed may be temporarily unavailable or experiencing issues.
                                </p>
                                <p className="text-xs opacity-50 text-muted-foreground mt-3">
                                    Check ingestion logs or retry the ingest-events-markers function.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950/80 backdrop-blur-sm">
                    <div className="text-center">
                        <Activity className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                            Scanning Global Events...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
