import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { StateASIStats } from '@/hooks/useIndiaASI';
import { Tooltip, Box, Typography } from '@mui/material';

const INDIA_GEO_URL = '/india-states.geojson';

interface IndiaASIMapProps {
    data: StateASIStats[];
    metric: keyof StateASIStats;
    onStateClick?: (state: StateASIStats) => void;
}

export const IndiaASIMap: React.FC<IndiaASIMapProps> = ({ data, metric, onStateClick }) => {
    // Color scale for the choropleth
    const colorScale = useMemo(() => {
        const values = data.map(d => Number(d[metric]));
        return scaleQuantile<string>()
            .domain(values)
            .range([
                '#1a1d21', // Darkest
                '#2d333b',
                '#444c56',
                '#adbac7',
                '#cdd9e1', // Lightest/Highlight
            ]);
    }, [data, metric]);

    return (
        <Box sx={{ width: '100%', height: 500, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 850,
                    center: [82.9733, 22.5937] // Center of India
                }}
                style={{ width: '100%', height: '100%' }}
            >
                <ZoomableGroup>
                    <Geographies geography={INDIA_GEO_URL}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo: any) => {
                                const stateName = geo.properties.STNAME || geo.properties.NAME_1;
                                const stateData = data.find(d => d.state_name.toLowerCase() === stateName?.toLowerCase());
                                const value = stateData ? Number(stateData[metric]) : 0;

                                return (
                                    <Tooltip
                                        key={geo.rsmKey}
                                        title={
                                            <Box sx={{ p: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                                    {stateName}
                                                </Typography>
                                                {stateData && (
                                                    <>
                                                        <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem' }}>
                                                            GVA: ₹{(stateData.total_gva / 100000).toFixed(2)}T
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem' }}>
                                                            Employment: {(stateData.total_employment / 1000).toFixed(1)}M
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem' }}>
                                                            Capacity: {stateData.avg_capacity_utilization.toFixed(1)}%
                                                        </Typography>
                                                    </>
                                                )}
                                            </Box>
                                        }
                                        arrow
                                    >
                                        <Geography
                                            geography={geo}
                                            onClick={() => stateData && onStateClick?.(stateData)}
                                            style={{
                                                default: {
                                                    fill: stateData ? colorScale(value) : '#1a1d21',
                                                    outline: 'none',
                                                    stroke: 'rgba(255,255,255,0.05)',
                                                    strokeWidth: 0.5
                                                },
                                                hover: {
                                                    fill: '#f0f0f0', // Highlight on hover
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                },
                                                pressed: {
                                                    fill: '#ffffff',
                                                    outline: 'none'
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
