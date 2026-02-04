import React from 'react';
import { Card, Typography, Box, Skeleton, useTheme, Button } from '@mui/material';
import { Sparkline } from '@/components/Sparkline';
import { ExternalLink } from 'lucide-react';
import { HoverDetail } from '@/components/HoverDetail';
import { formatNumber, formatDelta, formatPercentage } from '@/utils/formatNumber';
import { FreshnessChip, FreshnessStatus } from './FreshnessChip';

interface RatioCardProps {
    primaryLabel: string;
    metricId?: string;
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
    description?: string;
    methodology?: string;
    stats?: { label: string; value: string | number; color?: string }[];
    chartType?: 'line' | 'bar';
}

const getZScoreColor = (z: number) => {
    if (z > 2) return '#ef4444';     // Crimson
    if (z < -2) return '#10b981';    // Emerald
    return 'rgba(255,255,255,0.4)';  // Muted
};

export const RatioCard: React.FC<RatioCardProps> = ({
    primaryLabel,
    metricId,
    subtitle,
    value,
    zScore,
    percentile,
    history,
    lastUpdated,
    isLoading,
    source = 'Composite Data',
    frequency = 'Daily',
    description,
    methodology,
    stats = [],
    chartType = 'line'
}) => {
    const theme = useTheme();
    const [isHighlighted, setIsHighlighted] = React.useState(false);

    React.useEffect(() => {
        const handleHighlight = (e: any) => {
            if (e.detail?.metricId === (metricId || primaryLabel)) {
                setIsHighlighted(true);
                setTimeout(() => setIsHighlighted(false), 3000);

                const element = document.getElementById(metricId || primaryLabel);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        window.addEventListener('macro-dashboard-highlight', handleHighlight);
        return () => window.removeEventListener('macro-dashboard-highlight', handleHighlight);
    }, [metricId, primaryLabel]);

    const isNullValue = value === null || value === undefined || value === '-' || value === '' ||
        (typeof value === 'number' && isNaN(value));

    const formattedValue = isNullValue ? 'No data' : formatNumber(typeof value === 'string' ? parseFloat(value) : value, { decimals: 2, notation: 'standard' });

    const isStaleFlag = (lastUpdated: any) => {
        if (!lastUpdated) return false;
        const diff = new Date().getTime() - new Date(lastUpdated).getTime();
        const maxStaleMs = frequency?.toLowerCase() === 'monthly' ? 32 * 24 * 60 * 60 * 1000 : 2 * 24 * 60 * 60 * 1000;
        return diff > maxStaleMs;
    };

    const getStaleness = (): { state: FreshnessStatus; label: string } => {
        if (!lastUpdated) return { state: 'no_data', label: 'No data' };

        const updateDate = new Date(lastUpdated);
        const now = new Date();
        const diffMs = now.getTime() - updateDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        let timeLabel = '';
        if (diffHours < 1) timeLabel = 'Just now';
        else if (diffHours < 24) timeLabel = `${Math.floor(diffHours)}h ago`;
        else timeLabel = `${Math.floor(diffHours / 24)}d ago`;

        const expectedHours = (frequency?.toLowerCase() === 'monthly') ? 31 * 24 : 48;

        if (diffHours > expectedHours * 3) return { state: 'overdue', label: `${timeLabel}` };
        if (diffHours > expectedHours * 1.5) return { state: 'stale', label: `${timeLabel}` };
        if (diffHours > expectedHours) return { state: 'lagged', label: `${timeLabel}` };
        return { state: 'fresh', label: `${timeLabel}` };
    };

    const { state: stalenessState, label: timeLabel } = getStaleness();

    const cardContent = (
        <Card
            sx={{
                p: 2.5,
                height: 250,
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
            }}
            id={metricId || primaryLabel}
        >
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
                    </Box>

                    {!isLoading && typeof zScore === 'number' && !isNaN(zScore) && (
                        <Box
                            sx={{
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                                bgcolor: Math.abs(zScore) > 2 ? `${getZScoreColor(zScore)}` : `${getZScoreColor(zScore)}15`,
                                border: '1px solid',
                                borderColor: `${getZScoreColor(zScore)}25`,
                                animation: Math.abs(zScore) > 2 ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.7 },
                                    '100%': { opacity: 1 }
                                }
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 900, color: Math.abs(zScore) > 2 ? 'white' : getZScoreColor(zScore), fontSize: '0.65rem' }}>
                                Z: {formatDelta(zScore, { decimals: 1 })}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.7 }}>
                    {subtitle}
                </Typography>
            </Box>

            <Box sx={{ mb: 2, minHeight: 40, display: 'flex', alignItems: 'baseline', gap: 1 }}>
                {isLoading ? (
                    <Skeleton variant="text" width="60%" height={40} />
                ) : isNullValue ? (
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.disabled', opacity: 0.5 }}>
                        No data
                    </Typography>
                ) : (
                    <>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.04em' }}>
                            {formattedValue}
                        </Typography>
                        {typeof zScore === 'number' && !isNaN(zScore) && Math.abs(zScore) > 2 && (
                            <Box sx={{
                                bgcolor: getZScoreColor(zScore),
                                borderRadius: '50%',
                                width: 8,
                                height: 8,
                                alignSelf: 'center'
                            }} />
                        )}
                    </>
                )}
            </Box>

            <Box sx={{ mb: 2.5 }}>
                {typeof percentile === 'number' && !isNaN(percentile) && !isLoading && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em' }}>VALUATION PERCENTILE</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.7rem', color: percentile > 90 || percentile < 10 ? 'warning.main' : 'primary.main' }}>
                                {formatPercentage(percentile, { decimals: 0 })}
                            </Typography>
                        </Box>
                        <Box sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, height: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box sx={{
                                width: `${Math.min(100, Math.max(0, percentile))}%`,
                                bgcolor: percentile > 90 || percentile < 10 ? 'warning.main' : 'primary.main',
                                height: '100%',
                                borderRadius: 'inherit',
                            }} />
                        </Box>
                    </Box>
                )}
            </Box>

            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box sx={{ flexGrow: 1 }}>
                    {history && history.length > 0 && (
                        <Box sx={{ height: 32, opacity: 0.6 }}>
                            <Sparkline data={history} height={32} color={theme.palette.text.disabled} />
                        </Box>
                    )}
                    {timeLabel && (
                        <Typography variant="caption" sx={{ color: stalenessState === 'stale' || stalenessState === 'overdue' ? 'error.main' : 'text.disabled', fontSize: '0.6rem', fontWeight: 600 }}>
                            Updated {timeLabel}
                        </Typography>
                    )}
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
            title={primaryLabel}
            subtitle={subtitle}
            detailContent={{
                description,
                methodology,
                source,
                stats: [
                    { label: 'Z-Score', value: formatDelta(zScore, { decimals: 2 }) || 'N/A', color: zScore ? getZScoreColor(zScore) : undefined },
                    { label: 'Percentile', value: formatPercentage(percentile, { decimals: 1 }) || 'N/A' },
                    { label: 'Frequency', value: frequency },
                    ...stats
                ],
                history: history,
                chartType
            }}
        >
            {cardContent}
        </HoverDetail>
    );
};
