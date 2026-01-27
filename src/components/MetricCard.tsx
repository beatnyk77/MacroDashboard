import React from 'react';
import { Card, Box, Typography, useTheme, SxProps, Theme } from '@mui/material';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';

interface MetricCardProps {
    label: string;
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
    sx?: SxProps<Theme>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    delta,
    status = 'neutral',
    history,
    suffix = '',
    prefix = '',
    lastUpdated,
    sx
}) => {
    const theme = useTheme();

    const getStatusColor = () => {
        switch (status) {
            case 'safe': return theme.palette.success.main;
            case 'warning': return theme.palette.warning.main;
            case 'danger': return theme.palette.error.main;
            default: return theme.palette.text.secondary;
        }
    };

    // Calculate hours since update
    const getStaleness = () => {
        if (!lastUpdated) return { isStale: false, label: '' };

        const updateDate = new Date(lastUpdated);
        const now = new Date();
        const diffMs = now.getTime() - updateDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        let timeLabel = '';
        if (diffHours < 1) timeLabel = '<1h ago';
        else if (diffHours < 24) timeLabel = `${Math.floor(diffHours)}h ago`;
        else timeLabel = `${Math.floor(diffHours / 24)}d ago`;

        return {
            isStale: diffHours > 24,
            label: `Updated ${timeLabel}`
        };
    };

    const { isStale, label: timeLabel } = getStaleness();

    const getDeltaIcon = () => {
        if (!delta) return null;
        if (delta.trend === 'up') return <TrendingUp size={14} />;
        if (delta.trend === 'down') return <TrendingDown size={14} />;
        return <Minus size={14} />;
    };

    const getDeltaColor = () => {
        if (!delta) return 'text.secondary';
        if (delta.trend === 'up') return 'success.main';
        if (delta.trend === 'down') return 'error.main';
        return 'text.secondary';
    };

    return (
        <Card sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', ...sx }}>
            {/* Status indicator dot or Stale Badge */}
            {isStale ? (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'error.main',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        px: 0.8,
                        py: 0.25,
                        borderRadius: 1,
                        textTransform: 'uppercase'
                    }}
                >
                    STALE
                </Box>
            ) : status !== 'neutral' && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getStatusColor(),
                        boxShadow: `0 0 8px ${getStatusColor()}80`
                    }}
                />
            )}

            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                {label}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {prefix}{value}{suffix}
                </Typography>
                {delta && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, color: getDeltaColor() }}>
                        {getDeltaIcon()}
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{delta.value}</Typography>
                        <Typography variant="caption" color="text.secondary">{delta.period}</Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                {history && history.length > 0 && (
                    <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <Sparkline data={history} color={getStatusColor()} height={32} />
                    </Box>
                )}
                {timeLabel && (
                    <Typography variant="caption" color={isStale ? 'error.main' : 'text.disabled'} sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                        {timeLabel}
                    </Typography>
                )}
            </Box>
        </Card>
    );
};
