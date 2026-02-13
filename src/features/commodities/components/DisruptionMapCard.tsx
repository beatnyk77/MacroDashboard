import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker
} from "react-simple-maps";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const SEVERITY_META: Record<string, { color: string; label: string; glow: string }> = {
    'high': { color: '#f43f5e', label: 'Conflict/Closure', glow: 'rgba(244, 63, 94, 0.4)' },
    'medium': { color: '#f59e0b', label: 'Delay/Weather', glow: 'rgba(245, 158, 11, 0.4)' },
    'low': { color: '#10b981', label: 'Minor Advisory', glow: 'rgba(16, 185, 129, 0.4)' }
};

export const DisruptionMapCard: React.FC = () => {
    const { data: events, isLoading } = useQuery({
        queryKey: ['commodity-events'],
        queryFn: async () => {
            const { data, error } = await supabase.from('commodity_events').select('*');
            if (error) throw error;
            return data;
        }
    });

    if (isLoading) return <div className="h-[400px] animate-pulse bg-white/5 rounded-[2.5rem]" />;

    return (
        <Card className="bg-black/60 border-white/5 backdrop-blur-3xl overflow-hidden group h-[400px] flex flex-col">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        Disruption <span className="text-white">Hotspots</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest">Live Monitoring</span>
                    </div>
                </div>
                <CardDescription className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter mt-1">
                    Real-time overlay of geopolitical & logistical bottlenecks
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative overflow-hidden bg-[#020617]">
                <TooltipProvider>
                    <ComposableMap projectionConfig={{ scale: 140 }}>
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
                                            hover: { fill: "#1e293b", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>
                        {events?.map((event: any) => {
                            const meta = SEVERITY_META[event.severity] || SEVERITY_META.low;
                            const size = event.severity === 'high' ? 6 : 4;

                            return (
                                <Marker key={event.id} coordinates={[parseFloat(event.lng), parseFloat(event.lat)]}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <g className="cursor-pointer group">
                                                <circle
                                                    r={size * 2}
                                                    fill={meta.glow}
                                                    className="animate-ping"
                                                />
                                                <circle
                                                    r={size}
                                                    fill={meta.color}
                                                    stroke="#fff"
                                                    strokeWidth={1}
                                                    className="group-hover:scale-125 transition-transform duration-200"
                                                />
                                            </g>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-950/90 border-white/10 p-3 rounded-xl backdrop-blur-xl shadow-2xl side-top">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 pb-1 border-b border-white/5 mb-1">
                                                    <MapPin className="w-3 h-3 text-white/40" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{event.location || 'Global Hub'}</span>
                                                </div>
                                                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">
                                                    {event.description}
                                                </p>
                                                <div className="pt-1 flex items-center justify-between">
                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-muted-foreground uppercase">
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-[8px] font-mono text-muted-foreground/40 italic">Normalized: ISO-3166</span>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </Marker>
                            );
                        })}
                    </ComposableMap>
                </TooltipProvider>

                {/* Glassmorphism Legend */}
                <div className="absolute bottom-6 left-6 flex flex-col gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-xl pointer-events-none">
                    <h4 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Risk Registry</h4>
                    {Object.entries(SEVERITY_META).map(([key, meta]) => (
                        <div key={key} className="flex items-center gap-3">
                            <div className="relative flex h-2 w-2">
                                {key === 'high' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: meta.color }}></span>
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground/80 uppercase">{meta.label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
