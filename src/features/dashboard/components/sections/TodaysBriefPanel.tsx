import React, { useMemo } from 'react';
import { Box, Card, Typography, Grid, Chip, useTheme, Stack, Divider } from '@mui/material';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Newspaper, Calendar } from 'lucide-react';
import { useRegime } from '@/hooks/useRegime';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { useMacroHeadlines, MacroHeadline } from '@/hooks/useMacroHeadlines';

export const TodaysBriefPanel: React.FC = () => {
    const theme = useTheme();
    const { data: regime } = useRegime();
    const { data: liquidity } = useNetLiquidity();
    const { data: events } = useMacroEvents();
    const { data: headlines } = useMacroHeadlines();

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
            bgcolor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Accent */}
            <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 150,
                height: 150,
                background: `radial-gradient(circle, ${theme.palette.primary.main}10 0%, transparent 70%)`,
                zIndex: 0
            }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, position: 'relative', zIndex: 1 }}>
                <Box>
                    <Typography variant="overline" sx={{
                        fontWeight: 900,
                        letterSpacing: '0.15em',
                        color: 'primary.main',
                        fontSize: '0.7rem'
                    }}>
                        TODAY'S INTELLIGENCE BRIEF
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        {formatDate(new Date())}
                    </Typography>
                </Box>
                <Chip
                    label="INSTITUTIONAL GRADE"
                    size="small"
                    sx={{
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        color: 'primary.light',
                        border: '1px solid',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        fontWeight: 900,
                        fontSize: '0.65rem'
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
                                {liquidityDelta ? `${liquidityDelta > 0 ? '+' : ''}${(liquidityDelta / 1e9).toFixed(1)}B net change (7D)` : 'Awaiting fresh feed'}
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
                                dynamicBriefing.map((item, idx) => (
                                    <Box
                                        key={idx}
                                        onClick={() => handleScrollTo(item.anchor)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 1.5,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { pl: 1, color: 'primary.main' }
                                        }}
                                    >
                                        <Box sx={{
                                            mt: 0.7,
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            bgcolor: item.trend === 'up' ? 'success.main' : item.trend === 'down' ? 'error.main' : 'text.disabled',
                                            flexShrink: 0
                                        }} />
                                        <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>
                                            {item.label}
                                        </Typography>
                                    </Box>
                                ))
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

