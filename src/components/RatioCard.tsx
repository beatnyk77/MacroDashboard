import React from 'react';
import { Card, Typography, Box, Chip, Skeleton } from '@mui/material';
import { Sparkline } from '@/components/Sparkline';

interface RatioCardProps {
    primaryLabel: string;
    subtitle: string;
    value: number | string;
    zScore?: number;
    percentile?: number; // 0-100
    history?: { date: string; value: number }[];
    status?: 'safe' | 'warning' | 'danger' | 'neutral';
    isLoading?: boolean;
}

const getZScoreColor = (z: number) => {
    if (z > 2) return 'error';     // Extended
    if (z < -2) return 'success';  // Cheap
    return 'default';              // Fair value
};

export const RatioCard: React.FC<RatioCardProps> = ({
    primaryLabel,
    subtitle,
    value,
    zScore,
    percentile,
    history,
    isLoading
}) => {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;

    return (
        <Card sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                            {primaryLabel}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.2, mb: 1 }}>
                            {subtitle}
                        </Typography>
                    </Box>
                    {isLoading ? (
                        <Skeleton variant="circular" width={40} height={20} />
                    ) : (
                        zScore !== undefined && (
                            <Chip
                                label={`Z: ${zScore > 0 ? '+' : ''}${zScore.toFixed(1)}`}
                                size="small"
                                color={getZScoreColor(zScore)}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        )
                    )}
                </Box>

                {isLoading ? (
                    <Skeleton variant="text" width="50%" height={40} />
                ) : (
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                        {formattedValue}
                    </Typography>
                )}

                {isLoading ? (
                    <Box sx={{ mt: 2 }}><Skeleton variant="rectangular" width="100%" height={20} /></Box>
                ) : (
                    percentile !== undefined && (
                        <Box sx={{ width: '100%', mr: 1, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Percentile</Typography>
                                <Typography variant="caption" fontWeight="bold">{percentile.toFixed(0)}%</Typography>
                            </Box>
                            <Box sx={{ width: '100%', bgcolor: 'action.hover', borderRadius: 1, height: 6 }}>
                                <Box sx={{
                                    width: `${Math.min(100, Math.max(0, percentile))}%`,
                                    bgcolor: percentile > 90 || percentile < 10 ? 'warning.main' : 'primary.main',
                                    borderRadius: 1,
                                    height: '100%'
                                }} />
                            </Box>
                        </Box>
                    )
                )}
            </Box>

            <Box sx={{ height: 60, mt: 2 }}>
                {isLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={60} />
                ) : (
                    history && history.length > 0 ? (
                        <Sparkline data={history} height={60} color="#64748b" /> // Slate-500 equivalent
                    ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.disabled">No History</Typography>
                        </Box>
                    )
                )}
            </Box>
        </Card>
    );
};
