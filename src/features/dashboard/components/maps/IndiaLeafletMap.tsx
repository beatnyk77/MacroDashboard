import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IndiaLeafletMapProps {
    data: any[];
    metric: string;
    getColor: (value: number) => string;
    onStateClick?: (state: any) => void;
    getValue: (state: any) => number;
    tooltipFormatter: (state: any) => string;
    selectedStateCode?: string;
}

// Component to handle map resizing and fitting bounds
const ChangeView = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(bounds);
    }, [bounds, map]);
    return null;
};

export const IndiaLeafletMap: React.FC<IndiaLeafletMapProps> = ({
    data,
    metric,
    getColor,
    onStateClick,
    getValue,
    tooltipFormatter,
    selectedStateCode
}) => {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);

    useEffect(() => {
        fetch('/india-states.geojson')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error("Error loading GeoJSON:", err));
    }, []);

    const normalizeName = (name: string) => {
        if (!name) return "";
        return name.toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z]/g, '');
    };

    const onEachFeature = (feature: any, layer: any) => {
        const stateName = feature.properties.STNAME || feature.properties.stname || feature.properties.NAME_1;

        const stateData = data.find(s => normalizeName(s.state_name) === normalizeName(stateName));
        const isSelected = selectedStateCode && stateData?.state_code === selectedStateCode;

        const value = stateData ? getValue(stateData) : 0;
        const color = getColor(value);

        layer.setStyle({
            fillColor: stateData ? color : 'rgba(42, 46, 53, 0.4)',
            weight: isSelected ? 2 : 1,
            opacity: 1,
            color: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
            fillOpacity: isSelected ? 1 : 0.8
        });

        layer.on({
            mouseover: (event: any) => {
                const l = event.target;
                if (!isSelected) {
                    l.setStyle({
                        weight: 2,
                        color: '#fff',
                        fillOpacity: 0.9,
                    });
                    l.bringToFront();
                }
            },
            mouseout: (event: any) => {
                const l = event.target;
                if (!isSelected) {
                    l.setStyle({
                        weight: 1,
                        color: 'rgba(255, 255, 255, 0.1)',
                        fillOpacity: 0.8
                    });
                }
            },
            click: () => {
                if (stateData && onStateClick) {
                    onStateClick(stateData);
                }
            }
        });

        if (stateData) {
            layer.bindTooltip(tooltipFormatter(stateData), {
                sticky: true,
                className: 'leaflet-custom-tooltip'
            });
        }
    };

    if (!geoJsonData) return <div className="h-full w-full flex items-center justify-center text-white/20 uppercase tracking-uppercase font-black text-xs">Loading Cartography...</div>;

    const indiaBounds: L.LatLngBoundsExpression = [
        [6.4626999, 68.1097], // Southwest
        [35.513327, 97.395358] // Northeast
    ];

    return (
        <div className="h-full w-full relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            <MapContainer
                bounds={indiaBounds}
                style={{ height: '100%', width: '100%', background: '#020617' }}
                zoomControl={false}
                attributionControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <ChangeView bounds={indiaBounds} />
                <GeoJSON
                    data={geoJsonData}
                    onEachFeature={onEachFeature}
                    key={metric} // Force re-render when metric changes
                />
            </MapContainer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .leaflet-custom-tooltip {
                    background: rgba(2, 6, 23, 0.9) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    border-radius: 12px !important;
                    padding: 8px 12px !important;
                    font-family: 'Inter', sans-serif !important;
                    font-size: 0.7rem !important;
                    font-weight: 700 !important;
                    backdrop-filter: blur(8px) !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
                }
                .leaflet-container {
                    cursor: crosshair !important;
                }
            `}} />
        </div>
    );
};
