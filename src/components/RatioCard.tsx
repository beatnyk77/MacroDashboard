import React from 'react';
import { Card, Typography, Box, Skeleton, Tooltip, useTheme } from '@mui/material';
import { Sparkline } from '@/components/Sparkline';
import { Info } from 'lucide-react';

interface RatioCardProps {
    primaryLabel: string;
    subtitle: string;
    value: number | string;
    zScore?: number;
    percentile?: number; // 0-100
    history?: { date: string; value: number }[];
    status?: 'safe' | 'warning' | 'danger' | 'neutral';
    lastUpdated?: string | Date;
    isLoading?: boolean;
    source?: string;
    frequency?: string;
}

const getZScoreColor = (z: number) => {
    if (z > 2) return '#f43f5e';     // Rose 500
    if (z < -2) return '#10b981';    // Emerald 500
    return '#94a3b8';              // Slate 400
};

export const RatioCard: React.FC<RatioCardProps> = ({
    primaryLabel,
    subtitle,
    value,
    zScore,
    percentile,
    history,
    lastUpdated,
    isLoading,
    source = 'Composite Data',
    frequency = 'Daily'
}) => {
    const theme = useTheme();
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;

    const isStaleFlag = (lastUpdated: any) => {
        if (!lastUpdated) return false;
        const diff = new Date().getTime() - new Date(lastUpdated).getTime();
        return diff > (1000 * 60 * 60 * 24);
    };

    const getStalenessLabel = () => {
        if (!lastUpdated) return '';
        const updateDate = new Date(lastUpdated);
        const now = new Date();
        const diffMs = now.getTime() - updateDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    const isStale = isStaleFlag(lastUpdated);
    const timeLabel = getStalenessLabel();

    return (
        <Card
            sx={{
                p: 2.5,
                height: 250, // Fixed height for consistency
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.5)',
                    transform: 'translateY(-2px)',
                },
            }}
        >
            {isStale && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: 'error.main',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        px: 1,
                        py: 0.5,
                        borderBottomLeftRadius: 4,
                        letterSpacing: '0.05em',
                        zIndex: 1
                    }}
                >
                    STALE
                </Box>
            )}

            <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                fontSize: '0.65rem'
                            }}
                        >
                            {primaryLabel}
                        </Typography>
                        <Tooltip
                            title={
                                <Box sx={{ p: 0.5 }}>
                                    <Typography variant="caption" display="block"><b>Source:</b> {source}</Typography>
                                    <Typography variant="caption" display="block"><b>Freq:</b> {frequency}</Typography>
                                    <Typography variant="caption" display="block"><b>Method:</b> Rolling Z-Score</Typography>
                                </Box>
                            }
                            arrow
                            placement="top"
                        >
                            <Box sx={{ opacity: 0.3, '&:hover': { opacity: 1 }, cursor: 'help' }}>
                                <Info size={12} />
                            </Box>
                        </Tooltip>
                    </Box>

                    {!isLoading && zScore !== undefined && (
                        <Box
                            sx={{
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                                bgcolor: `${getZScoreColor(zScore)}15`,
                                border: '1px solid',
                                borderColor: `${getZScoreColor(zScore)}25`
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 900, color: getZScoreColor(zScore), fontSize: '0.65rem' }}>
                                Z: {zScore > 0 ? '+' : ''}{zScore.toFixed(1)}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.7 }}>
                    {subtitle}
                </Typography>
            </Box>

            <Box sx={{ mb: 2, minHeight: 40 }}>
                {isLoading ? (
                    <Skeleton variant="text" width="60%" height={40} />
                ) : (
                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.04em' }}>
                        {formattedValue}
                    </Typography>
                )}
            </Box>

            <Box sx={{ mb: 2.5 }}>
                {percentile !== undefined && !isLoading && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em' }}>VALUATION PERCENTILE</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.7rem', color: percentile > 90 || percentile < 10 ? 'warning.main' : 'primary.main' }}>
                                {percentile.toFixed(0)}%
                            </Typography>
                        </Box>
                        <Box sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, height: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box sx={{
                                width: `${Math.min(100, Math.max(0, percentile))}%`,
                                bgcolor: percentile > 90 || percentile < 10 ? 'warning.main' : 'primary.main',
                                height: '100%',
                                borderRadius: 'inherit',
                                boxShadow: `0 0 10px ${percentile > 90 || percentile < 10 ? theme.palette.warning.main : theme.palette.primary.main}40`
                            }} />
                        </Box>
                    </Box>
                )}
            </Box>

            <Box sx={{ mt: 'auto' }}>
                {isLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={32} sx={{ borderRadius: 1 }} />
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {history && history.length > 0 && (
                            <Box sx={{ height: 32, opacity: 0.8 }}>
                                <Sparkline data={history} height={32} color={theme.palette.text.disabled} />
                            </Box>
                        )}
                        {timeLabel && (
                            <Typography variant="caption" sx={{ color: isStale ? 'error.main' : 'text.disabled', fontSize: '0.65rem', fontWeight: 600 }}>
                                Updated {timeLabel}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        </Card>
    );
};
