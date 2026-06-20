import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ensureLeafletStyles } from '@/lib/leafletStyles';
import type { ChinaProvincialFiscalStress } from '@/hooks/useChinaDebt';

/** Maps GeoJSON Chinese names → our province_code */
const PROVINCE_GEO_NAME_TO_CODE: Record<string, string> = {
    '北京市': 'BJ', '北京': 'BJ',
    '天津市': 'TJ', '天津': 'TJ',
    '上海市': 'SH', '上海': 'SH',
    '重庆市': 'CQ', '重庆': 'CQ',
    '河北省': 'HE', '山西省': 'SX', '辽宁省': 'LN', '吉林省': 'JL', '黑龙江省': 'HL',
    '江苏省': 'JS', '浙江省': 'ZJ', '安徽省': 'AH', '福建省': 'FJ', '江西省': 'JX',
    '山东省': 'SD', '河南省': 'HA', '湖北省': 'HB', '湖南省': 'HN', '广东省': 'GD',
    '海南省': 'HI', '四川省': 'SC', '贵州省': 'GZ', '云南省': 'YN', '陕西省': 'SN',
    '甘肃省': 'GS', '青海省': 'QH', '台湾省': 'TW',
    '内蒙古自治区': 'IM', '广西壮族自治区': 'GX', '西藏自治区': 'XZ',
    '宁夏回族自治区': 'NX', '新疆维吾尔自治区': 'XJ',
    '香港特别行政区': 'HK', '澳门特别行政区': 'MO',
};

interface ChinaProvincialLeafletMapProps {
    data: ChinaProvincialFiscalStress[];
    getColor: (score: number) => string;
    getValue: (row: ChinaProvincialFiscalStress) => number;
    tooltipFormatter: (row: ChinaProvincialFiscalStress) => string;
    selectedCode?: string;
    onProvinceClick?: (row: ChinaProvincialFiscalStress) => void;
}

const ChangeView = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(bounds);
    }, [bounds, map]);
    return null;
};

export const ChinaProvincialLeafletMap: React.FC<ChinaProvincialLeafletMapProps> = ({
    data,
    getColor,
    getValue,
    tooltipFormatter,
    selectedCode,
    onProvinceClick,
}) => {
    const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);

    useEffect(() => {
        ensureLeafletStyles();
    }, []);

    useEffect(() => {
        fetch('/china-provinces.geojson')
            .then(res => res.json())
            .then((d: GeoJSON.FeatureCollection) => setGeoJsonData(d))
            .catch(err => console.error('Error loading China GeoJSON:', err));
    }, []);

    const dataByCode = React.useMemo(() => {
        const map: Record<string, ChinaProvincialFiscalStress> = {};
        data.forEach(row => { map[row.province_code] = row; });
        return map;
    }, [data]);

    const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
        const geoName = (feature.properties as { name?: string })?.name ?? '';
        const code = PROVINCE_GEO_NAME_TO_CODE[geoName];
        const row = code ? dataByCode[code] : undefined;
        const isSelected = selectedCode && code === selectedCode;
        const value = row ? getValue(row) : 0;
        const color = row ? getColor(value) : 'rgba(42, 46, 53, 0.4)';

        (layer as L.Path).setStyle({
            fillColor: color,
            weight: isSelected ? 2 : 1,
            opacity: 1,
            color: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
            fillOpacity: isSelected ? 1 : 0.85,
        });

        layer.on({
            mouseover: (event: L.LeafletMouseEvent) => {
                const l = event.target as L.Path;
                if (!isSelected) {
                    l.setStyle({ weight: 2, color: '#fff', fillOpacity: 0.95 });
                    l.bringToFront();
                }
            },
            mouseout: (event: L.LeafletMouseEvent) => {
                const l = event.target as L.Path;
                if (!isSelected) {
                    l.setStyle({ weight: 1, color: 'rgba(255, 255, 255, 0.1)', fillOpacity: 0.85 });
                }
            },
            click: () => {
                if (row && onProvinceClick) onProvinceClick(row);
            },
        });

        if (row) {
            layer.bindTooltip(tooltipFormatter(row), {
                sticky: true,
                className: 'leaflet-custom-tooltip',
            });
        }
    };

    if (!geoJsonData) {
        return (
            <div className="h-full w-full flex items-center justify-center text-white/20 uppercase tracking-uppercase font-black text-xs">
                Loading Cartography...
            </div>
        );
    }

    const chinaBounds: L.LatLngBoundsExpression = [
        [18.0, 73.0],
        [54.0, 135.0],
    ];

    return (
        <div className="h-full w-full relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            <MapContainer
                bounds={chinaBounds}
                style={{ height: '100%', width: '100%', background: '#020617' }}
                zoomControl={false}
                attributionControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <ChangeView bounds={chinaBounds} />
                <GeoJSON data={geoJsonData} onEachFeature={onEachFeature} />
            </MapContainer>
            <style dangerouslySetInnerHTML={{
                __html: `
                .leaflet-custom-tooltip {
                    background: rgba(2, 6, 23, 0.9) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    border-radius: 12px !important;
                    padding: 8px 12px !important;
                    font-size: 0.7rem !important;
                    font-weight: 700 !important;
                    backdrop-filter: blur(8px) !important;
                }
                .leaflet-container { cursor: crosshair !important; }
            `,
            }} />
        </div>
    );
};