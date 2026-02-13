import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const DisruptionMapCard: React.FC = () => {
    const { data: events, isLoading } = useQuery({
        queryKey: ['commodity-events'],
        queryFn: async () => {
            const { data, error } = await supabase.from('commodity_events').select('*');
            if (error) throw error;
            return data;
        }
    });

    if (isLoading) return <div className="h-48 animate-pulse bg-white/5 rounded-2xl" />;

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
            <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5 px-4 lg:px-6">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    Real-Time Disruption & Event Overlay
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] p-0 overflow-hidden relative">
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
                                        hover: { fill: "#334155", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>
                    {events?.map((event: any) => (
                        <Marker key={event.id} coordinates={[parseFloat(event.lng), parseFloat(event.lat)]}>
                            <circle
                                r={event.severity === 'high' ? 6 : 4}
                                fill={event.severity === 'high' ? "#ef4444" : "#f59e0b"}
                                stroke="#fff"
                                strokeWidth={1}
                            />
                            <title>{event.description}</title>
                        </Marker>
                    ))}
                </ComposableMap>
                <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-rose-500" /> High Severity
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-amber-500" /> Medium Severity
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
