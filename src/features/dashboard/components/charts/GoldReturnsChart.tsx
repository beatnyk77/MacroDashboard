import React, { useState, useMemo } from 'react';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
    Brush,
} from 'recharts';
import { Box, Button, Card, Typography, useTheme, useMediaQuery } from '@mui/material';
import { ZoomOut, Maximize2 } from 'lucide-react';
import { useGoldReturns } from '@/hooks/useGoldReturns';

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
        <Card sx={{
            p: 2,
            bgcolor: 'rgba(0,0,0,0.95)',
            border: '1px solid rgba(255,215,0,0.3)',
            backdropFilter: 'blur(10px)',
            maxWidth: 280
        }}>
            <Typography variant="caption" sx={{
                color: 'text.secondary',
                display: 'block',
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                mb: 0.5
            }}>
                {data.formattedDate}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h5" sx={{
                    color: data.return_pct >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 900,
                    fontFamily: 'monospace'
                }}>
                    {data.return_pct >= 0 ? '+' : ''}{data.return_pct.toFixed(2)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>
                    Monthly Return
                </Typography>
            </Box>

            <Typography variant="caption" sx={{
                color: 'text.secondary',
                display: 'block',
                fontSize: '0.65rem',
                fontFamily: 'monospace'
            }}>
                Gold: ${data.gold_price?.toFixed(2)}/oz
            </Typography>

            {data.event_name && (
                <Box sx={{
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Typography variant="caption" sx={{
                        fontWeight: 800,
                        color: 'warning.main',
                        display: 'block',
                        fontSize: '0.7rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        mb: 0.5
                    }}>
                        ⚡ {data.event_name}
                    </Typography>
                    <Typography variant="caption" sx={{
                        display: 'block',
                        color: 'text.secondary',
                        fontSize: '0.65rem',
                        lineHeight: 1.4
                    }}>
                        {data.event_description}
                    </Typography>
                    {data.macro_regime && (
                        <Box sx={{
                            mt: 1,
                            px: 1,
                            py: 0.5,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            borderRadius: 0.5,
                            display: 'inline-block'
                        }}>
                            <Typography variant="caption" sx={{
                                fontSize: '0.6rem',
                                fontFamily: 'monospace',
                                color: 'text.disabled'
                            }}>
                                {data.macro_regime}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Card>
    );
};

const GoldReturnsChart: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { data: returns, isLoading } = useGoldReturns();
    const [zoomDomain, setZoomDomain] = useState<{ startIndex?: number; endIndex?: number } | null>(null);

    const chartData = useMemo(() => {
        if (!returns) return [];
        return returns.map((r) => ({
            ...r,
            formattedDate: new Date(`${r.month_date}T00:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            }),
            color: r.return_pct >= 0 ? '#10b981' : '#ef4444',
        }));
    }, [returns]);

    const displayData = useMemo(() => {
        if (!zoomDomain || zoomDomain.startIndex === undefined || zoomDomain.endIndex === undefined) {
            return chartData;
        }
        return chartData.slice(zoomDomain.startIndex, zoomDomain.endIndex + 1);
    }, [chartData, zoomDomain]);

    const handleBrushChange = (domain: any) => {
        if (domain?.startIndex !== undefined && domain?.endIndex !== undefined) {
            setZoomDomain({ startIndex: domain.startIndex, endIndex: domain.endIndex });
        }
    };

    const resetZoom = () => {
        setZoomDomain(null);
    };

    if (isLoading) {
        return (
            <Box sx={{
                height: isMobile ? 300 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.2)',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{
                    width: 32,
                    height: 32,
                    border: '2px solid',
                    borderColor: 'warning.main',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                    }
                }} />
            </Box>
        );
    }

    return (
        <Box sx={{
            position: 'relative',
            height: isMobile ? 300 : 400,
            width: '100%',
            bgcolor: 'rgba(0,0,0,0.2)',
            borderRadius: 2,
            p: isMobile ? 1 : 2,
            border: '1px solid',
            borderColor: 'divider'
        }}>
            {/* Zoom Controls */}
            {zoomDomain && (
                <Box sx={{
                    position: 'absolute',
                    top: isMobile ? 8 : 16,
                    right: isMobile ? 8 : 16,
                    zIndex: 10
                }}>
                    <Button
                        size="small"
                        onClick={resetZoom}
                        startIcon={<ZoomOut size={14} />}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.1)',
                            color: 'text.primary',
                            fontSize: '0.7rem',
                            py: 0.5,
                            px: 1.5,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.2)',
                                borderColor: 'rgba(255,255,255,0.2)'
                            }
                        }}
                    >
                        Reset Zoom
                    </Button>
                </Box>
            )}

            {!zoomDomain && !isMobile && (
                <Box sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: 1,
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Maximize2 size={12} style={{ color: theme.palette.text.disabled }} />
                    <Typography variant="caption" sx={{
                        fontSize: '0.65rem',
                        color: 'text.disabled',
                        fontWeight: 600
                    }}>
                        Drag to zoom
                    </Typography>
                </Box>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={displayData}
                    margin={isMobile
                        ? { top: 10, right: 10, left: -10, bottom: 60 }
                        : { top: 40, right: 30, left: 10, bottom: 80 }
                    }
                >
                    <defs>
                        <linearGradient id="positiveReturn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="negativeReturn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="formattedDate"
                        tick={{
                            fill: theme.palette.text.disabled,
                            fontSize: isMobile ? 8 : 10,
                            fontFamily: 'monospace'
                        }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={isMobile ? 'preserveStartEnd' : 'preserveStart'}
                    />

                    <YAxis
                        tick={{
                            fill: theme.palette.text.disabled,
                            fontSize: isMobile ? 9 : 10,
                            fontFamily: 'monospace'
                        }}
                        axisLine={false}
                        tickLine={false}
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickFormatter={(val) => `${val}%`}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />

                    <ReferenceLine
                        y={0}
                        stroke={theme.palette.divider}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                    />

                    <Bar
                        dataKey="return_pct"
                        radius={[3, 3, 0, 0]}
                        animationDuration={1500}
                        animationEasing="ease-out"
                    >
                        {displayData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.event_name
                                    ? '#eab308'
                                    : entry.return_pct >= 0
                                        ? 'url(#positiveReturn)'
                                        : 'url(#negativeReturn)'
                                }
                                stroke={entry.event_name ? '#eab308' : 'none'}
                                strokeWidth={entry.event_name ? 2 : 0}
                            />
                        ))}
                    </Bar>

                    {/* Brush for zoom/pan - only show if not already zoomed */}
                    {!zoomDomain && chartData.length > 20 && (
                        <Brush
                            dataKey="formattedDate"
                            height={isMobile ? 20 : 30}
                            stroke={theme.palette.primary.main}
                            fill="rgba(255,255,255,0.02)"
                            travellerWidth={isMobile ? 8 : 10}
                            onChange={handleBrushChange}
                            startIndex={Math.max(0, chartData.length - 60)} // Show last 5 years by default
                            endIndex={chartData.length - 1}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default GoldReturnsChart;
