import React, { useMemo } from 'react';
import { Box, Card, Typography, Grid, Chip, useTheme, Stack, Divider } from '@mui/material';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Newspaper, Calendar } from 'lucide-react';
import { useRegime } from '@/hooks/useRegime';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { useMacroEvents } from '@/hooks/useMacroEvents';
import { useMacroHeadlines, MacroHeadline } from '@/hooks/useMacroHeadlines';
import { formatBillions } from '@/utils/formatNumber';



interface TodaysBriefPanelProps {
    sx?: any;
}

export const TodaysBriefPanel: React.FC<TodaysBriefPanelProps> = ({ sx }) => {
    const theme = useTheme();
    const { data: regime } = useRegime();
    const { data: liquidity } = useNetLiquidity();
    const { data: events } = useMacroEvents();
    const { data: headlines } = useMacroHeadlines();

    // Restoration of missing variables for JSX
    const liquidityDelta = liquidity?.delta || null;
    const liquidityStatus = liquidityDelta ? (liquidityDelta > 0 ? 'Expanding' : 'Contracting') : 'Awaiting Data';
    const liquidityColor = liquidityDelta ? (liquidityDelta > 0 ? theme.palette.success.main : theme.palette.error.main) : theme.palette.text.disabled;

    const today = useMemo(() => new Date(), []);
    const keyEvent = useMemo(() => {
        if (!events) return null;
        return events
            .filter(e => new Date(e.event_date).toDateString() === today.toDateString())
            .sort((a) => a.impact_level === 'High' ? -1 : 1)[0];
    }, [events, today]);

    // Mapping headlines to briefing items
    const dynamicBriefing = useMemo(() => {
        if (!headlines || headlines.length === 0) return [];
        return headlines.slice(0, 5).map((h: MacroHeadline) => ({
            label: h.title,
            anchor: '#macro-orientation-section', // Default anchor
            trend: h.title.includes('↑') || h.title.includes('positive') ? 'up' :
                (h.title.includes('↓') || h.title.includes('negative') ? 'down' : 'neutral')
        }));
    }, [headlines]);

    const handleScrollTo = (anchor: string) => {
        const element = document.querySelector(anchor);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleHighlight = (label: string, anchor: string) => {
        // 1. Scroll to section
        handleScrollTo(anchor);

        // 2. Map keywords to Metric IDs
        let metricId = '';
        const lowerLabel = label.toLowerCase();

        if (lowerLabel.includes('liquidity') || lowerLabel.includes('fed') || lowerLabel.includes('m2')) metricId = 'NET_LIQUIDITY';
        else if (lowerLabel.includes('dollar') || lowerLabel.includes('dxy') || lowerLabel.includes('usd')) metricId = 'DXY_INDEX';
        else if (lowerLabel.includes('gold') || lowerLabel.includes('precious')) metricId = 'GOLD_PRICE';
        else if (lowerLabel.includes('oil') || lowerLabel.includes('wti') || lowerLabel.includes('crude') || lowerLabel.includes('energy')) metricId = 'CRUDE_OIL';
        else if (lowerLabel.includes('yield') || lowerLabel.includes('treasury') || lowerLabel.includes('curve') || lowerLabel.includes('rates')) metricId = 'YIELD_CURVE';
        else if (lowerLabel.includes('volatility') || lowerLabel.includes('vix') || lowerLabel.includes('fear')) metricId = 'VIX_INDEX';

        if (metricId) {
            // Give a small delay for scroll to start
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('macro-dashboard-highlight', {
                    detail: { metricId }
                }));
            }, 100);
        }
    };

    const getRegimeColor = () => {
        if (!regime) return theme.palette.primary.main;
        const label = regime.regimeLabel.toLowerCase();
        if (label.includes('expansion') || label.includes('recovery')) return theme.palette.success.main;
        if (label.includes('tightening') || label.includes('slowdown')) return theme.palette.error.main;
        return theme.palette.primary.main;
    };

    const getRegimeStatus = () => {
        if (!regime) return 'neutral';
        const label = regime.regimeLabel.toLowerCase();
        if (label.includes('expansion') || label.includes('recovery')) return 'safe';
        if (label.includes('tightening') || label.includes('slowdown')) return 'danger';
        return 'neutral';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'safe': return <Activity size={16} color={theme.palette.success.main} />;
            case 'danger': return <AlertCircle size={16} color={theme.palette.error.main} />;
            default: return <Activity size={16} color={theme.palette.primary.main} />;
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Card sx={{
            mb: 4,
            p: { xs: 2.5, md: 4 },
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main',
            bgcolor: '#0a1929', // Deep Navy - Institutional House View
            border: '1px solid',
            borderColor: 'rgba(59, 130, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5)',
            ...sx
        }}>
            {/* Subtle Gradient Overlay */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 40%)',
                pointerEvents: 'none'
            }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, position: 'relative', zIndex: 1 }}>
                <Box>
                    <Typography
                        variant="overline"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: '0.2em',
                            color: 'primary.main',
                            fontSize: '0.75rem',
                            fontFamily: '"Inter", sans-serif',
                            display: 'block',
                            mb: 1
                        }}
                    >
                        GRAPHIQUESTOR INTELLIGENCE
                    </Typography>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 400, // Regular weight for serif looks more premium
                            color: 'text.primary',
                            letterSpacing: '-0.01em',
                            fontFamily: '"Merriweather", "Georgia", serif', // Institutional Serif
                            lineHeight: 1.2
                        }}
                    >
                        {formatDate(new Date())}
                    </Typography>
                </Box>
                <Chip
                    label="PROPRIETARY VIEW"
                    size="small"
                    sx={{
                        bgcolor: 'rgba(59, 130, 246, 0.15)',
                        color: 'primary.light',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontWeight: 900,
                        fontSize: '0.65rem',
                        letterSpacing: '0.05em'
                    }}
                />
            </Box>

            <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                {/* Column 1: Core Signals */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={2}>
                        <Box sx={{
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                {getStatusIcon(getRegimeStatus())}
                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase' }}>
                                    Regime Consensus
                                </Typography>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: getRegimeColor(), mb: 0.5 }}>
                                {regime?.regimeLabel || 'Neutral Persistence'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', fontWeight: 600 }}>
                                {regime?.timestamp ? `Model updated ${new Date(regime.timestamp).toLocaleDateString()}` : 'Real-time detection active'}
                            </Typography>
                        </Box>

                        <Box sx={{
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.02)',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                {liquidityDelta && liquidityDelta > 0 ? (
                                    <TrendingUp size={16} color={theme.palette.success.main} />
                                ) : (
                                    <TrendingDown size={16} color={theme.palette.error.main} />
                                )}
                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase' }}>
                                    Liquidity Impulse
                                </Typography>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: liquidityColor, mb: 0.5 }}>
                                {liquidityStatus}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', fontWeight: 600 }}>
                                {liquidityDelta ? `${liquidityDelta > 0 ? '+' : ''}${formatBillions(liquidityDelta / 1e9, { decimals: 1 })} net change (7D)` : 'Awaiting fresh feed'}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>

                {/* Column 2: Market Briefing */}
                <Grid item xs={12} md={5}>
                    <Box sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Newspaper size={16} color={theme.palette.primary.main} />
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase' }}>
                                LIVE INTELLIGENCE FEED
                            </Typography>
                        </Box>
                        <Stack spacing={1.5} divider={<Divider sx={{ borderColor: 'rgba(255,255,255,0.03)' }} />}>
                            {dynamicBriefing.length > 0 ? (
                                dynamicBriefing.map((item, idx) => {
                                    // Extract the actual headline object from the hook data if possible
                                    const rawHeadline = headlines?.find(h => h.title === item.label);

                                    return (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                            <Box sx={{
                                                mt: 0.7,
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                bgcolor: item.trend === 'up' ? 'success.main' : item.trend === 'down' ? 'error.main' : 'text.disabled',
                                                flexShrink: 0
                                            }} />
                                            <Typography
                                                variant="body2"
                                                component="a"
                                                href={rawHeadline?.link || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => {
                                                    if (!rawHeadline?.link || rawHeadline.link.includes('example.com')) {
                                                        e.preventDefault();
                                                        handleHighlight(item.label, item.anchor);
                                                    }
                                                }}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: 'text.primary',
                                                    lineHeight: 1.3,
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    '&:hover': { color: 'primary.main' }
                                                }}
                                                title={item.label}
                                            >
                                                {item.label}
                                            </Typography>
                                        </Box>
                                    );
                                })
                            ) : (
                                <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', display: 'block', py: 2 }}>
                                    Awaiting institutional signal ingest...
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                </Grid>

                {/* Column 3: Scheduled Focus */}
                <Grid item xs={12} md={3}>
                    <Box sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(59, 130, 246, 0.05)',
                        border: '1px dashed',
                        borderColor: 'primary.main',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Calendar size={16} color={theme.palette.secondary.main} />
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase' }}>
                                Today's Key Alpha
                            </Typography>
                        </Box>

                        {keyEvent ? (
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, lineHeight: 1.2 }}>
                                    {keyEvent.event_name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <Chip label={keyEvent.country} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900, bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <Chip
                                        label={keyEvent.impact_level.toUpperCase()}
                                        size="small"
                                        sx={{
                                            height: 16,
                                            fontSize: '0.55rem',
                                            fontWeight: 900,
                                            bgcolor: keyEvent.impact_level === 'High' ? 'error.main' : 'warning.main',
                                            color: 'white'
                                        }}
                                    />
                                </Box>
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Forecast</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 800, fontFamily: 'monospace' }}>{keyEvent.forecast || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Previous</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 800, fontFamily: 'monospace' }}>{keyEvent.previous || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 900 }}>ACTUAL</Typography>
                                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 900, fontFamily: 'monospace' }}>{keyEvent.actual || 'PENDING'}</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        ) : (
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1, opacity: 0.5 }}>
                                <AlertCircle size={24} />
                                <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 700 }}>
                                    No high-impact releases scheduled for today.
                                </Typography>
                            </Box>
                        )}

                        <Typography
                            variant="caption"
                            onClick={() => handleScrollTo('#macro-calendar')}
                            sx={{
                                mt: 'auto',
                                pt: 2,
                                textAlign: 'right',
                                color: 'primary.main',
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontSize: '0.6rem',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            VIEW FULL CALENDAR →
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Card>
    );
};

