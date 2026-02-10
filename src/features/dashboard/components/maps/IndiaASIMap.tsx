import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { StateASIStats } from '@/hooks/useIndiaASI';
import { Tooltip, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const INDIA_GEO_URL = '/india-states.geojson';

interface IndiaASIMapProps {
    data: StateASIStats[];
    metric: keyof StateASIStats;
    onStateClick?: (state: StateASIStats) => void;
    selectedStateCode?: string | null;
}

const LegendContainer = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    border: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 10,
    pointerEvents: 'none',
}));

export const IndiaASIMap: React.FC<IndiaASIMapProps> = ({ data, metric, onStateClick, selectedStateCode }) => {
    // Generate color scale based on metric
    const { colorScale, colorRange, label } = useMemo(() => {
        const values = data.map(d => Number(d[metric]));

        let range: string[] = [];
        let label = '';

        switch (metric) {
            case 'total_employment':
                range = ['#2e1065', '#5b21b6', '#7c3aed', '#a78bfa', '#ddd6fe']; // Violets
                label = 'Employment Scale';
                break;
            case 'avg_capacity_utilization':
                range = ['#064e3b', '#065f46', '#059669', '#34d399', '#6ee7b7']; // Emeralds
                label = 'Capacity Scale';
                break;
            case 'total_gva':
            default:
                range = ['#0f172a', '#1e293b', '#334155', '#64748b', '#94a3b8']; // Slates/Blues
                label = 'GVA Scale';
                break;
        }

        const scale = scaleQuantile<string>()
            .domain(values)
            .range(range);

        return { colorScale: scale, colorRange: range, label };
    }, [data, metric]);

    return (
        <Box sx={{ width: '100%', height: 500, bgcolor: '#0a0a0a', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>

            {/* Legend */}
            <LegendContainer>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', fontWeight: 900, pb: 0.5, display: 'block', textTransform: 'uppercase' }}>
                    {label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {colorRange.map((color, i) => (
                        <Box key={i} sx={{ width: 12, height: 12, bgcolor: color, borderRadius: 0.5 }} />
                    ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.disabled' }}>Low</Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.disabled' }}>High</Typography>
                </Box>
            </LegendContainer>

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 850,
                    center: [82.9733, 22.5937]
                }}
                style={{ width: '100%', height: '100%', background: 'transparent' }}
            >
                <ZoomableGroup maxZoom={4}>
                    <Geographies geography={INDIA_GEO_URL}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo: any) => {
                                const stateName = geo.properties.STNAME || geo.properties.NAME_1;
                                const stateData = data.find(d => d.state_name.toLowerCase() === stateName?.toLowerCase());
                                const value = stateData ? Number(stateData[metric]) : 0;
                                const isSelected = selectedStateCode === stateData?.state_code;

                                return (
                                    <Tooltip
                                        key={geo.rsmKey}
                                        title={
                                            <Box sx={{ p: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, color: '#fff' }}>
                                                    {stateName}
                                                </Typography>
                                                {stateData ? (
                                                    <>
                                                        <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                                                            GVA: <span style={{ fontWeight: 700, color: '#94a3b8' }}>₹{(stateData.total_gva / 100000).toFixed(2)}T</span>
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                                                            Emp: <span style={{ fontWeight: 700, color: '#a78bfa' }}>{(stateData.total_employment / 1000).toFixed(1)}M</span>
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                                                            Cap: <span style={{ fontWeight: 700, color: '#34d399' }}>{stateData.avg_capacity_utilization.toFixed(1)}%</span>
                                                        </Typography>
                                                    </>
                                                ) : <Typography variant="caption" sx={{ color: 'text.disabled' }}>No Data</Typography>}
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                    >
                                        <Geography
                                            geography={geo}
                                            onClick={() => stateData && onStateClick?.(stateData)}
                                            style={{
                                                default: {
                                                    fill: stateData ? colorScale(value) : '#1a1d21',
                                                    outline: 'none',
                                                    stroke: isSelected ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                                    strokeWidth: isSelected ? 2 : 0.5,
                                                    transition: 'all 0.3s ease',
                                                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none',
                                                },
                                                hover: {
                                                    fill: stateData ? colorScale(value) : '#1a1d21', // Keep color on hover
                                                    stroke: '#ffffff',
                                                    strokeWidth: 1.5,
                                                    outline: 'none',
                                                    cursor: stateData ? 'pointer' : 'default',
                                                    filter: 'brightness(1.2)', // Subtle brighten on hover
                                                },
                                                pressed: {
                                                    fill: stateData ? colorScale(value) : '#1a1d21',
                                                    stroke: '#ffffff',
                                                    strokeWidth: 2,
                                                    outline: 'none',
                                                    filter: 'brightness(0.9)',
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </Box>
    );
};
