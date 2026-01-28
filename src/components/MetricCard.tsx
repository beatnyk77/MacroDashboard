import React from 'react';
import { Card, Box, Typography, useTheme, SxProps, Theme, Tooltip } from '@mui/material';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { Skeleton } from '@mui/material';

interface MetricCardProps {
    label: string;
    sublabel?: string;
    value: string | number;
    delta?: {
        value: string;
        period: string; // e.g., "WoW", "MoM"
        trend: 'up' | 'down' | 'neutral';
    };
    status?: 'safe' | 'warning' | 'danger' | 'neutral';
    history?: { date: string; value: number }[];
    precision?: number;
    suffix?: string;
    prefix?: string;
    lastUpdated?: string | Date;
    isLoading?: boolean;
    sx?: SxProps<Theme>;
    source?: string;
    frequency?: string;
    zScoreWindow?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    sublabel,
    value,
    delta,
    status = 'neutral',
    history,
    suffix = '',
    prefix = '',
    lastUpdated,
    isLoading,
    sx,
    source = 'FRED',
    frequency = 'Daily',
    zScoreWindow = '252-Day Rolling'
}) => {
    const theme = useTheme();

    // Check if value is null, undefined, or placeholder
    const isNullValue = value === null || value === undefined || value === '-' || value === '' ||
        (typeof value === 'number' && isNaN(value));

    const getStatusColor = () => {
        switch (status) {
            case 'safe': return theme.palette.success.main;
            case 'warning': return theme.palette.warning.main;
            case 'danger': return theme.palette.error.main;
            default: return theme.palette.text.secondary;
        }
    };

    const getStaleness = () => {
        if (!lastUpdated) return { isStale: false, label: '' };
        const updateDate = new Date(lastUpdated);
        const now = new Date();
        const diffMs = now.getTime() - updateDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        let timeLabel = '';
        if (diffHours < 1) timeLabel = 'Just now';
        else if (diffHours < 2) timeLabel = '1h ago';
        else if (diffHours < 24) timeLabel = `${Math.floor(diffHours)}h ago`;
        else if (diffHours < 48) timeLabel = 'Yesterday';
        else timeLabel = `${Math.floor(diffHours / 24)}d ago`;

        return {
            isStale: diffHours > 24,
            label: `Refreshed ${timeLabel}`
        };
    };

    const isStaleFlag = (lastUpdated: any) => {
        if (!lastUpdated) return false;
        const diff = new Date().getTime() - new Date(lastUpdated).getTime();
        return diff > (1000 * 60 * 60 * 24);
    };

    const isStale = isStaleFlag(lastUpdated);
    const { label: timeLabel } = getStaleness();

    const getDeltaIcon = () => {
        if (!delta) return null;
        if (delta.trend === 'up') return <TrendingUp size={12} />;
        if (delta.trend === 'down') return <TrendingDown size={12} />;
        return <Minus size={12} />;
    };

    const getDeltaColor = () => {
        if (!delta) return 'text.secondary';
        if (delta.trend === 'up') return 'success.main';
        if (delta.trend === 'down') return 'error.main';
        return 'text.secondary';
    };

    return (
        <Card
            sx={{
                p: 2.5,
                height: 200, // Fixed height to prevent layout shifts
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
                ...sx
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontSize: '0.65rem',
                            opacity: 0.8
                        }}
                    >
                        {label}
                    </Typography>

                    {sublabel && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                display: 'block',
                                fontSize: '0.6rem',
                                opacity: 0.6,
                                mt: 0.2
                            }}
                        >
                            {sublabel}
                        </Typography>
                    )}
                </Box>


                <Tooltip
                    title={
                        <Box sx={{ p: 0.5 }}>
                            <Typography variant="caption" display="block"><b>Source:</b> {source}</Typography>
                            <Typography variant="caption" display="block"><b>Frequency:</b> {frequency}</Typography>
                            <Typography variant="caption" display="block"><b>Z-Score Calc:</b> {zScoreWindow}</Typography>
                        </Box>
                    }
                    arrow
                    placement="top"
                >
                    <Box sx={{ opacity: 0.4, '&:hover': { opacity: 1 }, cursor: 'help' }}>
                        <Info size={14} />
                    </Box>
                </Tooltip>
            </Box>

            <Box sx={{ mb: 1.5, minHeight: 48 }}>
                {isLoading ? (
                    <Skeleton variant="text" width="80%" height={48} sx={{ borderRadius: 1 }} />
                ) : isNullValue ? (
                    <Tooltip title="Check ingestion logs for issues" arrow placement="top">
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.disabled', opacity: 0.5 }}>
                            No data
                        </Typography>
                    </Tooltip>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.04em', color: 'text.primary' }}>
                            {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}{suffix}
                        </Typography>
                        {delta && (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                                bgcolor: `${theme.palette.mode === 'dark' ? '#fff' : '#000'}08`,
                                border: '1px solid',
                                borderColor: `${getDeltaColor()}30`,
                                color: getDeltaColor()
                            }}>
                                {getDeltaIcon()}
                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{delta.value}</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            <Box sx={{ mt: 'auto' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Skeleton variant="rectangular" width="100%" height={32} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="text" width="40%" height={16} />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {history && history.length > 0 && (
                            <Box sx={{ height: 32, opacity: 0.8 }}>
                                <Sparkline data={history} color={getStatusColor()} height={32} />
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{
                                color: isStale ? 'error.main' : 'text.disabled',
                                fontSize: '0.65rem',
                                fontWeight: 700
                            }}>
                                {timeLabel}
                            </Typography>
                            {status !== 'neutral' && !isStale && (
                                <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: getStatusColor(),
                                    boxShadow: `0 0 8px ${getStatusColor()}60`
                                }} />
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Card >
    );
};
