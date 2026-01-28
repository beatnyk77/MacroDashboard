import React from 'react';
import { Card, Box, Typography, useTheme, SxProps, Theme, Skeleton, Button } from '@mui/material';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { HoverDetail } from '@/components/HoverDetail';

interface MetricCardProps {
    label: string;
    sublabel?: string;
    value: string | number;
    delta?: {
        value: string;
        period: string;
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
    description?: string;
    methodology?: string;
    stats?: { label: string; value: string | number; color?: string }[];
    chartType?: 'line' | 'bar';
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
    zScoreWindow = 'Rolling 252D',
    description,
    methodology,
    stats = [],
    chartType = 'line'
}) => {
    const theme = useTheme();

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
        else if (diffHours < 24) timeLabel = `${Math.floor(diffHours)}h ago`;
        else timeLabel = `${Math.floor(diffHours / 24)}d ago`;

        // Reporting cadence awareness
        const maxStaleHours = frequency?.toLowerCase() === 'monthly' ? 32 * 24 : 48;

        return {
            isStale: diffHours > maxStaleHours,
            label: `Refreshed ${timeLabel}`
        };
    };

    const { isStale, label: timeLabel } = getStaleness();

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

    const cardContent = (
        <Card
            sx={{
                p: 2.5,
                height: 200,
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
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', opacity: 0.6, mt: 0.2 }}>
                            {sublabel}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ mb: 1.5, minHeight: 48 }}>
                {isLoading ? (
                    <Skeleton variant="text" width="80%" height={48} />
                ) : isNullValue ? (
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.disabled', opacity: 0.5 }}>
                        No data
                    </Typography>
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
                                bgcolor: `${getDeltaColor()}10`,
                                border: '1px solid',
                                borderColor: `${getDeltaColor()}20`,
                                color: getDeltaColor()
                            }}>
                                {getDeltaIcon()}
                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{delta.value}</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box sx={{ flexGrow: 1 }}>
                    {history && history.length > 0 && (
                        <Box sx={{ height: 32, opacity: 0.7 }}>
                            <Sparkline data={history} color={getStatusColor()} height={32} />
                        </Box>
                    )}
                    <Typography variant="caption" sx={{ color: isStale ? 'error.main' : 'text.disabled', fontSize: '0.6rem', fontWeight: 600 }}>
                        {timeLabel}
                    </Typography>
                </Box>
                <Button
                    size="small"
                    variant="text"
                    sx={{
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        minWidth: 'auto',
                        p: 0,
                        opacity: 0.3,
                        '&:hover': { opacity: 1, bgcolor: 'transparent' }
                    }}
                    startIcon={<ExternalLink size={10} />}
                >
                    DETAILS
                </Button>
            </Box>
        </Card>
    );

    return (
        <HoverDetail
            title={label}
            subtitle={sublabel || label}
            detailContent={{
                description,
                methodology,
                source,
                stats: [
                    { label: 'Update Freq', value: frequency },
                    { label: 'Window', value: zScoreWindow },
                    ...stats
                ],
                history,
                chartType
            }}
        >
            {cardContent}
        </HoverDetail>
    );
};
