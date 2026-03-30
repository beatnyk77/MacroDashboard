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
import { Box, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Card } from '@/components/ui/card';
import { ZoomOut, Maximize2 } from 'lucide-react';
import { useGoldReturns } from '@/hooks/useGoldReturns';

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
        <Card variant="default" className="bg-slate-950/90 border border-white/12 backdrop-blur-xl max-w-[280px] p-2">
            <p className="text-xs font-mono text-muted-foreground/60 mb-0.5">
                {data.formattedDate}
            </p>

            <div className="flex items-baseline gap-1 mb-1">
                <h5 className={`text-lg font-black font-mono ${data.return_pct >= 0 ? 'text-success' : 'text-error'}`}>
                    {data.return_pct >= 0 ? '+' : ''}{data.return_pct.toFixed(2)}%
                </h5>
                <span className="text-xs text-muted-foreground/50">Monthly Return</span>
            </div>

            <p className="text-xs font-mono text-muted-foreground/60">
                Gold: ${data.gold_price?.toFixed(2)}/oz
            </p>

            {data.event_name && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs font-black text-warning mb-1 uppercase tracking-uppercase">
                        ⚡ {data.event_name}
                    </p>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed">
                        {data.event_description}
                    </p>
                    {data.macro_regime && (
                        <span className="inline-block mt-1 px-1 py-0.5 bg-white/5 rounded text-xs font-mono text-muted-foreground/50">
                            {data.macro_regime}
                        </span>
                    )}
                </div>
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
        return returns.map((r) => {
            // Robust UTC parsing for ISO date string
            const date = new Date(r.month_date);
            return {
                ...r,
                dateObj: date,
                formattedDate: date.toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC'
                }),
                color: r.return_pct >= 0 ? '#10b981' : '#ef4444',
            };
        });
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

    // Determine max/min for Y axis to keep it sane
    const yDomain = useMemo(() => {
        if (!displayData.length) return [-10, 10];
        const vals = displayData.map(d => d.return_pct);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        return [Math.max(-25, Math.floor(min - 2)), Math.min(25, Math.ceil(max + 2))];
    }, [displayData]);

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
            height: isMobile ? 350 : 450,
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
                    right: 60,
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
                        Drag to explore history
                    </Typography>
                </Box>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={displayData}
                    margin={isMobile
                        ? { top: 20, right: 10, left: -10, bottom: 60 }
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
                        domain={yDomain}
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
                        radius={[2, 2, 0, 0]}
                        animationDuration={1500}
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
                                fillOpacity={entry.event_name ? 1 : 0.8}
                                stroke={entry.event_name ? '#eab308' : 'none'}
                                strokeWidth={entry.event_name ? 2 : 0}
                            />
                        ))}
                    </Bar>

                    {/* Brush for zoom/pan */}
                    <Brush
                        dataKey="formattedDate"
                        height={25}
                        stroke={theme.palette.primary.main}
                        fill="rgba(15, 23, 42, 0.8)"
                        travellerWidth={10}
                        onChange={handleBrushChange}
                        startIndex={zoomDomain?.startIndex ?? Math.max(0, chartData.length - 120)}
                        endIndex={zoomDomain?.endIndex ?? chartData.length - 1}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </Box>
    );
};


export default GoldReturnsChart;
