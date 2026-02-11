import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear, scaleQuantile } from 'd3-scale';
import { StateASIStats } from '@/hooks/useIndiaASI';
import { useGeopoliticalExposure } from '@/hooks/useGeopoliticalExposure';
import { Tooltip, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const INDIA_GEO_URL = '/india-states.geojson';

// Extended type including the new visual-only metrics
export type ASIMapMetric = keyof StateASIStats | 'geopolitics' | 'efficiency';

interface IndiaASIMapProps {
    data: StateASIStats[];
    metric: ASIMapMetric; // Use the extended type
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

export const IndiaASIMap: React.FC<IndiaASIMapProps> = ({ data, metric, onStateClick }) => {
    // We fetch geopolitical data here to allow the correlation. 
    // The parent (ASISection) only provides ASI data.
    const { data: geoData } = useGeopoliticalExposure();

    // Generate color scale based on metric
    const { colorScale, colorRange, label } = useMemo(() => {
        let values: number[] = [];
        let range: string[] = [];
        let label = '';
        let scale: any;

        if (metric === 'geopolitics') {
            values = [0, 1];
            range = ["#3b82f6", "#f3f4f6", "#ef4444"]; // Blue -> Grey -> Red
            label = 'Sphere Influence';
            scale = scaleLinear<string>().domain([0, 0.5, 1]).range(range);
        } else if (metric === 'efficiency') {
            if (geoData) values = geoData.map(d => d.loan_job_multiplier).filter(v => v > 0);
            range = ['#10b981', '#34d399', '#fcd34d', '#f87171', '#ef4444']; // Green -> Yellow -> Red
            label = 'Capital Intensity ($/Job)';
            // If no data, fallback to default domain
            scale = scaleQuantile<string>()
                .domain(values.length > 0 ? values : [0, 1])
                .range(range);
        } else {
            values = data.map(d => Number(d[metric as keyof StateASIStats] || 0));
            switch (metric) {
                case 'total_employment':
                    range = ['#2e1065', '#5b21b6', '#7c3aed', '#a78bfa', '#ddd6fe'];
                    label = 'Employment Scale';
                    break;
                case 'avg_capacity_utilization':
                    range = ['#064e3b', '#065f46', '#059669', '#34d399', '#6ee7b7'];
                    label = 'Capacity Scale';
                    break;
                default: // 'total_gva'
                    range = ['#0f172a', '#1e293b', '#334155', '#64748b', '#94a3b8'];
                    label = 'GVA Scale';
                    break;
            }
            scale = scaleQuantile<string>().domain(values).range(range);
        }

        return { colorScale: scale, colorRange: range, label };
    }, [data, geoData, metric]);

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
                                const stateName = geo.properties.STNAME || geo.properties.stname || geo.properties.NAME_1;
                                const asiStats = data.find(s => s.state_name.toLowerCase() === stateName?.toLowerCase());
                                const geoStats = geoData?.find(s => s.state_name.toLowerCase() === stateName?.toLowerCase());

                                let fill = "#1a1d21";
                                let value = 0;

                                if (metric === 'geopolitics' && geoStats) {
                                    value = geoStats.east_share_pct;
                                    fill = colorScale(value);
                                } else if (metric === 'efficiency' && geoStats) {
                                    value = geoStats.loan_job_multiplier;
                                    fill = value > 0 ? colorScale(value) : '#333';
                                } else if (asiStats) {
                                    // Careful casting here as we know metric is keyof StateASIStats in this branch
                                    const m = metric as keyof StateASIStats;
                                    if (asiStats[m] !== undefined) {
                                        fill = colorScale(Number(asiStats[m]));
                                    }
                                }

                                return (
                                    <Tooltip
                                        key={geo.rsmKey}
                                        title={
                                            <Box sx={{ p: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, color: '#fff' }}>
                                                    {stateName}
                                                </Typography>
                                                {geoStats && metric === 'efficiency' && (
                                                    <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem', color: '#fcd34d' }}>
                                                        Job Cost: <span style={{ fontWeight: 700 }}>${Math.round(geoStats.loan_job_multiplier).toLocaleString()}/job</span>
                                                    </Typography>
                                                )}
                                                {geoStats && metric === 'geopolitics' && (
                                                    <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem', color: '#9ecae1' }}>
                                                        Sphere: <span style={{ fontWeight: 700 }}>{geoStats.dominant_sphere}</span> ({(geoStats.east_share_pct * 100).toFixed(0)}% East)
                                                    </Typography>
                                                )}
                                                {asiStats && (
                                                    // Always show basic ASI stats even in other modes for context
                                                    <Typography variant="body2" sx={{ fontFamily: 'mono', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                                                        GVA: ₹{(asiStats.total_gva / 1000).toFixed(0)}k Cr | Emp: {(asiStats.total_employment / 1000).toFixed(1)}M | Cap: {asiStats.avg_capacity_utilization.toFixed(1)}%
                                                    </Typography>
                                                )}
                                                {!asiStats && !geoStats && <Typography variant="caption" sx={{ color: 'text.disabled' }}>No Data</Typography>}
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                    >
                                        <Geography
                                            geography={geo}
                                            onClick={() => asiStats && onStateClick?.(asiStats)}
                                            style={{
                                                default: { fill, outline: 'none', stroke: 'rgba(255,255,255,0.1)', strokeWidth: 0.5, transition: 'all 0.3s ease' },
                                                hover: { fill, stroke: '#fff', strokeWidth: 1.5, outline: 'none', filter: 'brightness(1.2)', cursor: 'pointer' },
                                                pressed: { fill, stroke: '#fff', strokeWidth: 2, outline: 'none' }
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
