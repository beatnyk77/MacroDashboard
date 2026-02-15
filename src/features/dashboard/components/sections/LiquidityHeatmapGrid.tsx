import React from 'react';
import { Box, Typography, Grid, Tooltip, Skeleton, Stack } from '@mui/material';
import { useMajorEconomies } from '@/hooks/useMajorEconomies';

interface HeatmapTileProps {
    label: string;
    value: string | number;
    suffix?: string;
    status: 'safe' | 'warning' | 'danger' | 'neutral';
    tooltip?: string;
}

const HeatmapTile: React.FC<HeatmapTileProps> = ({ label, value, suffix = '', status, tooltip }) => {

    const getStatusColor = () => {
        switch (status) {
            case 'safe': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'danger': return '#ef4444';
            default: return 'rgba(255,255,255,0.05)';
        }
    };

    const color = getStatusColor();
    const isNeutral = status === 'neutral';

    return (
        <Tooltip title={tooltip || ''} arrow placement="top">
            <Box sx={{
                width: '100%',
                bgcolor: isNeutral ? 'transparent' : `${color}10`,
                border: '1px solid',
                borderColor: isNeutral ? 'divider' : `${color}30`,
                p: 1.5,
                borderRadius: 1.5,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: color,
                    bgcolor: `${color}20`,
                }
            }}>
                <Typography variant="overline" sx={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: 'text.disabled',
                    lineHeight: 1,
                    mb: 0.5,
                    textAlign: 'center'
                }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{
                    fontWeight: 900,
                    color: isNeutral ? 'text.secondary' : color,
                    fontSize: '0.85rem'
                }}>
                    {value}{suffix}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export const LiquidityHeatmapGrid: React.FC = () => {
    const { data: economies, isLoading } = useMajorEconomies();

    if (isLoading) {
        return (
            <Grid container spacing={1}>
                {[...Array(6)].map((_, i) => (
                    <Grid item xs={12} key={i}>
                        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <h3 className="text-xl font-light text-white flex items-center gap-2">
                        <span className="w-8 h-px bg-blue-500/50" />
                        G20 Liquidity Heatmap
                    </h3>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {['SAFE', 'WATCH', 'STRESS'].map((l, i) => (
                        <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: i === 0 ? '#10b981' : (i === 1 ? '#f59e0b' : '#ef4444')
                            }} />
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 700 }}>{l}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Stack spacing={1.5}>
                {economies?.map(country => (
                    <Box key={country.code} sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                            <Typography sx={{ fontSize: '1rem' }}>{country.flag}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{country.name}</Typography>
                            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.5 }}>
                                <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>{country.last_updated ? new Date(country.last_updated).toLocaleDateString() : 'N/A'}</Typography>
                            </Box>
                        </Box>

                        <Grid container spacing={1}>
                            <Grid item xs={3}>
                                <HeatmapTile
                                    label="GROWTH"
                                    value={country.growth.toFixed(1)}
                                    suffix="%"
                                    status={country.growth > 3 ? 'safe' : (country.growth > 0 ? 'neutral' : 'danger')}
                                    tooltip={`${country.name} YoY GDP Growth`}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <HeatmapTile
                                    label="INFLATION"
                                    value={country.cpi.toFixed(1)}
                                    suffix="%"
                                    status={country.cpi > 5 ? 'danger' : (country.cpi > 3 ? 'warning' : (country.cpi > 0 ? 'safe' : 'danger'))}
                                    tooltip={`${country.name} YoY CPI`}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <HeatmapTile
                                    label="POLICY"
                                    value={country.policy_rate.toFixed(2)}
                                    suffix="%"
                                    status={country.policy_rate > 5 ? 'warning' : 'neutral'}
                                    tooltip={`${country.name} Benchmark Interest Rate`}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <HeatmapTile
                                    label="RES/DEBT"
                                    value={country.debt_gold_ratio.toFixed(1)}
                                    suffix="x"
                                    status={country.debt_gold_ratio > 200 ? 'danger' : (country.debt_gold_ratio > 100 ? 'warning' : 'safe')}
                                    tooltip={`${country.name} Debt to Gold Reserves Ratio. Lower is better (Physical backing).`}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};
