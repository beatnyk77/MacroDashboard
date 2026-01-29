import React from 'react';
import { Box, Card, Typography, Grid, Chip, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { useRegime } from '@/hooks/useRegime';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';

interface KeyMove {
    label: string;
    anchor: string;
    trend: 'up' | 'down' | 'neutral';
}

export const TodaysBriefPanel: React.FC = () => {
    const theme = useTheme();
    const { data: regime } = useRegime();
    const { data: liquidity } = useNetLiquidity();

    // Use 7D delta from liquidity data
    const liquidityDelta = liquidity?.delta || null;

    const liquidityStatus = liquidityDelta
        ? liquidityDelta > 0 ? 'Expanding' : 'Contracting'
        : 'Unknown';

    const liquidityColor = liquidityDelta
        ? liquidityDelta > 0 ? theme.palette.success.main : theme.palette.error.main
        : theme.palette.text.disabled;

    // Key moves - these would ideally be auto-generated from top delta changes
    // For now, using representative examples based on sections
    const keyMoves: KeyMove[] = [
        { label: 'G20 real rate negative again', anchor: '#macro-orientation-section', trend: 'down' },
        { label: 'BRICS+ gold share up +2.3pp', anchor: '#de-dollarization-section', trend: 'up' },
        { label: 'India macro pulse improving', anchor: '#india-macro-section', trend: 'up' }
    ];

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
            borderColor: 'divider'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="overline" sx={{
                        fontWeight: 900,
                        letterSpacing: '0.15em',
                        color: 'primary.main',
                        fontSize: '0.7rem'
                    }}>
                        TODAY'S BRIEF
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                        {formatDate(new Date())}
                    </Typography>
                </Box>
                <Chip
                    label="INSTITUTIONAL SUMMARY"
                    size="small"
                    sx={{
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        color: 'primary.light',
                        border: '1px solid',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        fontWeight: 800,
                        fontSize: '0.65rem'
                    }}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Regime State */}
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            {getStatusIcon(getRegimeStatus())}
                            <Typography variant="caption" sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                letterSpacing: '0.1em',
                                color: 'text.secondary',
                                textTransform: 'uppercase'
                            }}>
                                Regime
                            </Typography>
                        </Box>
                        <Typography variant="h5" sx={{
                            fontWeight: 900,
                            color: getRegimeColor(),
                            mb: 0.5
                        }}>
                            {regime?.regimeLabel || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                            {regime?.timestamp ? new Date(regime.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </Typography>
                    </Box>
                </Grid>

                {/* Liquidity Status */}
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            {liquidityDelta && liquidityDelta > 0 ? (
                                <TrendingUp size={16} color={theme.palette.success.main} />
                            ) : (
                                <TrendingDown size={16} color={theme.palette.error.main} />
                            )}
                            <Typography variant="caption" sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                letterSpacing: '0.1em',
                                color: 'text.secondary',
                                textTransform: 'uppercase'
                            }}>
                                Liquidity
                            </Typography>
                        </Box>
                        <Typography variant="h5" sx={{
                            fontWeight: 900,
                            color: liquidityColor,
                            mb: 0.5
                        }}>
                            {liquidityStatus}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                            {liquidityDelta ? `${liquidityDelta > 0 ? '+' : ''}${(liquidityDelta / 1e9).toFixed(0)}B (7D)` : 'No data'}
                        </Typography>
                    </Box>
                </Grid>

                {/* Key Moves */}
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        p: 2.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%'
                    }}>
                        <Typography variant="caption" sx={{
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            letterSpacing: '0.1em',
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            mb: 1.5,
                            display: 'block'
                        }}>
                            Key Moves
                        </Typography>
                        <Box component="ul" sx={{ m: 0, p: 0, pl: 0, listStyle: 'none' }}>
                            {keyMoves.map((move, idx) => (
                                <Box
                                    component="li"
                                    key={idx}
                                    onClick={() => handleScrollTo(move.anchor)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        py: 0.75,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            pl: 1,
                                            color: 'primary.main'
                                        }
                                    }}
                                >
                                    <Box sx={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        bgcolor: move.trend === 'up' ? 'success.main' : move.trend === 'down' ? 'error.main' : 'text.disabled',
                                        flexShrink: 0
                                    }} />
                                    <Typography variant="body2" sx={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'text.primary'
                                    }}>
                                        {move.label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Card>
    );
};
