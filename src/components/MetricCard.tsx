import React from 'react';
import { Card, Box, Typography, SxProps, Theme, Skeleton, Button } from '@mui/material';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { HoverDetail } from '@/components/HoverDetail';
import { formatNumber, formatDelta, formatPercentage } from '@/utils/formatNumber';
import { useViewContext } from '@/context/ViewContext';
import { FreshnessChip } from './FreshnessChip';
import { getStaleness } from '@/hooks/useStaleness';


interface MetricCardProps {
    label: string;
    metricId?: string;
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
    zScore?: number;
    percentile?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    metricId,
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
    chartType = 'line',
    zScore,
    percentile
}) => {
    const { isInstitutionalView } = useViewContext();
    const [isHighlighted, setIsHighlighted] = React.useState(false);

    React.useEffect(() => {
        const handleHighlight = (e: any) => {
            if (e.detail?.metricId === (metricId || label)) {
                setIsHighlighted(true);
                setTimeout(() => setIsHighlighted(false), 3000);

                // Optional: Scroll into view if not visible
                const element = document.getElementById(metricId || label);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        window.addEventListener('macro-dashboard-highlight', handleHighlight);
        return () => window.removeEventListener('macro-dashboard-highlight', handleHighlight);
    }, [metricId, label]);

    // Status color mapping for traffic lights
    const statusColorMap: Record<string, string> = {
        'safe': '#10b981',    // Emerald
        'neutral': '#3b82f6', // Blue
        'warning': '#f59e0b', // Amber
        'danger': '#ef4444'   // Crimson
    };

    // Get brief signal label (3-5 words max)
    const getSignalLabel = (status: string): string => {
        switch (status) {
            case 'safe': return 'HEALTHY';
            case 'neutral': return 'STABLE';
            case 'warning': return 'WATCH';
            case 'danger': return 'STRESS';
            default: return 'NORMAL';
        }
    };

    const isNullValue = value === null || value === undefined || value === '-' || value === '' ||
        (typeof value === 'number' && isNaN(value));

    const getStatusColor = () => {
        switch (status) {
            case 'safe': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'danger': return '#ef4444';
            default: return 'rgba(255,255,255,0.4)';
        }
    };

    const { state: stalenessState, label: timeLabel } = getStaleness(lastUpdated, frequency);



    const isExtreme = (!isLoading && !isNullValue) && (
        (typeof percentile === 'number' && (percentile > 95 || percentile < 5)) ||
        (typeof zScore === 'number' && Math.abs(zScore) >= 2.5)
    );

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
                border: isHighlighted ? '2px solid' : '1px solid',
                borderColor: isHighlighted ? 'primary.main' : 'divider',
                bgcolor: 'background.paper',
                animation: isHighlighted ? 'pulse-highlight 1.5s infinite' : 'none',
                '@keyframes pulse-highlight': {
                    '0%': { boxShadow: '0 0 0px 0px rgba(59, 130, 246, 0)' },
                    '50%': { boxShadow: '0 0 20px 5px rgba(59, 130, 246, 0.4)' },
                    '100%': { boxShadow: '0 0 0px 0px rgba(59, 130, 246, 0)' }
                },
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.5)',
                    transform: 'translateY(-2px)',
                },
                ...sx
            }}
            id={metricId || label}
        >
            {isExtreme && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bgcolor: 'rgba(59, 130, 246, 0.15)',
                        color: 'primary.main',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        px: 1,
                        py: 0.5,
                        borderBottomRightRadius: 4,
                        zIndex: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderRight: '1px solid rgba(59, 130, 246, 0.2)',
                        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                    }}
                >
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 1s infinite' }} />
                    Historical Extreme
                </Box>
            )}

            {stalenessState !== 'fresh' && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10
                    }}
                >
                    <FreshnessChip status={stalenessState} lastUpdated={lastUpdated} />
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

            <Box sx={{ mb: 2, minHeight: 64 }}>
                {isLoading ? (
                    <Skeleton variant="text" width="80%" height={64} />
                ) : isNullValue ? (
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.disabled', opacity: 0.5 }}>
                        No data
                    </Typography>
                ) : (
                    <Box>
                        {/* Primary Value - Unmissable */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                            {/* Traffic Light Status Dot */}
                            {status !== 'neutral' && (
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: statusColorMap[status],
                                        boxShadow: `0 0 12px ${statusColorMap[status]} `,
                                        flexShrink: 0
                                    }}
                                />
                            )}
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 900,
                                    letterSpacing: '-0.04em',
                                    color: 'text.primary',
                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                    lineHeight: 1
                                }}
                            >
                                {prefix}{formatNumber(typeof value === 'string' ? parseFloat(value) : value, { decimals: 2, notation: 'standard' })}{suffix}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {delta && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.3,
                                    borderRadius: 1,
                                    bgcolor: `rgba(255, 255, 255, 0.03)`,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    color: getDeltaColor()
                                }}>
                                    {getDeltaIcon()}
                                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem' }}>{delta.value}</Typography>
                                </Box>
                            )}

                            {isInstitutionalView && typeof zScore === 'number' && !isNaN(zScore) && (
                                <Box
                                    sx={{
                                        px: 1,
                                        py: 0.3,
                                        borderRadius: 1,
                                        bgcolor: Math.abs(zScore) > 2 ? 'error.main' : 'rgba(255,255,255,0.05)',
                                        border: '1px solid',
                                        borderColor: Math.abs(zScore) > 2 ? 'error.main' : 'divider',
                                        color: Math.abs(zScore) > 2 ? 'white' : 'text.secondary'
                                    }}
                                >
                                    <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>
                                        Z: {formatDelta(zScore, { decimals: 1 })}
                                    </Typography>
                                </Box>
                            )}

                            {/* Signal Label */}
                            {status !== 'neutral' && (
                                <Typography
                                    variant="overline"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        letterSpacing: '0.1em',
                                        color: statusColorMap[status],
                                        ml: 'auto'
                                    }}
                                >
                                    {getSignalLabel(status)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {isInstitutionalView && typeof percentile === 'number' && !isNaN(percentile) && !isLoading && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'text.secondary' }}>
                            INSTITUTIONAL PERCENTILE (120Y+)
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.7rem', color: percentile > 90 || percentile < 10 ? 'warning.main' : 'primary.main' }}>
                            {formatPercentage(percentile, { decimals: 1 })}
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, height: 4, overflow: 'hidden' }}>
                        <Box sx={{
                            width: `${Math.max(0, Math.min(100, percentile))}% `,
                            bgcolor: percentile > 90 || percentile < 10 ? 'warning.main' : 'primary.main',
                            height: '100%',
                            transition: 'width 1s ease'
                        }} />
                    </Box>
                </Box>
            )}

            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box sx={{ flexGrow: 1 }}>
                    {history && history.length > 0 && (
                        <Box sx={{ height: 32, opacity: 0.7 }}>
                            <Sparkline data={history} color={getStatusColor()} height={32} />
                        </Box>
                    )}
                    <Typography variant="caption" sx={{
                        color: stalenessState === 'overdue' ? 'error.main' : (stalenessState === 'lagged' ? 'warning.main' : 'text.disabled'),
                        fontSize: '0.6rem',
                        fontWeight: 600
                    }}>
                        Refreshed {timeLabel}
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
                        opacity: 0.15,
                        '&:hover': { opacity: 0.8, bgcolor: 'transparent' },
                        color: 'text.secondary'
                    }}
                >
                    <ExternalLink size={12} />
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
