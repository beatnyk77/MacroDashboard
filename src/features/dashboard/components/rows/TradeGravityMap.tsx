import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { ensureLeafletStyles } from '@/lib/leafletStyles';
import type { SwingStateData } from '@/hooks/useTradeGravityData';

const BRICS_COLOR = '#f97316';
const G7_COLOR = '#3b82f6';

interface TradeGravityMapProps {
    swingStates: SwingStateData[];
    selected: SwingStateData | null;
    onSelect: (state: SwingStateData) => void;
}

export const TradeGravityMap: React.FC<TradeGravityMapProps> = ({ swingStates, selected, onSelect }) => {
    useEffect(() => {
        ensureLeafletStyles();
    }, []);

    return (
        <div className="rounded-xl overflow-hidden border border-white/12 h-[300px] bg-[#0a0a1a]">
            <MapContainer
                center={[20, 20]}
                zoom={2}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', background: '#0a0a1a' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {swingStates.map(state => (
                    <CircleMarker
                        key={state.code}
                        center={[state.lat, state.lng]}
                        radius={selected?.code === state.code ? 18 : 12}
                        pathOptions={{
                            color: state.hasShifted ? BRICS_COLOR : G7_COLOR,
                            fillColor: state.hasShifted ? BRICS_COLOR : G7_COLOR,
                            fillOpacity: selected?.code === state.code ? 0.9 : 0.5,
                            weight: selected?.code === state.code ? 3 : 1,
                        }}
                        eventHandlers={{ click: () => onSelect(state) }}
                    >
                        <Tooltip direction="top" permanent={false} offset={[0, -8]}>
                            <div className="bg-black/90 text-white font-mono text-xs px-2 py-1 rounded">
                                <strong>{state.name}</strong><br />
                                BRICS+: {state.currentBricsShare.toFixed(1)}%<br />
                                G7: {state.currentG7Share.toFixed(1)}%<br />
                                {state.hasShifted && '⚡ Gravity Shifted'}
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
};