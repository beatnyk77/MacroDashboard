import React from 'react';
import { Box, Typography, Card, Tooltip, Chip, LinearProgress } from '@mui/material';
import { Flag, ShieldAlert, Zap, Info, Target } from 'lucide-react';
import { usePresidentialPolicies } from '@/hooks/usePresidentialPolicies';

export const PresidentialPolicyTracker: React.FC = () => {
    const { data: policies, isLoading } = usePresidentialPolicies();

    if (isLoading || !policies || policies.length === 0) return null;

    return (
        <Card sx={{
            p: 4,
            height: '100%',
            bgcolor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                bgcolor: 'error.main',
                opacity: 0.8
            }
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Target size={18} color="#ef4444" />
                        <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: '0.2em', color: 'text.secondary', fontSize: '0.75rem' }}>
                            ADMINISTRATION INTELLIGENCE
                        </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                        Policy Impact Monitor: Trump 2.0
                    </Typography>
                </Box>
                <Chip
                    label="H-S CONFIDENCE"
                    size="small"
                    sx={{
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        color: 'error.light',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {policies.slice(0, 4).map((policy, idx) => {
                    const absScore = Math.abs(policy.policy_score);
                    const isPositive = policy.policy_score > 0;

                    return (
                        <Box key={policy.id} sx={{
                            position: 'relative',
                            pb: 2,
                            borderBottom: idx < policies.slice(0, 4).length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isPositive ? <Zap size={14} color="#f59e0b" /> : <ShieldAlert size={14} color="#ef4444" />}
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: isPositive ? 'warning.light' : 'error.light', letterSpacing: '0.05em' }}>
                                        {policy.category.toUpperCase()}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>
                                    {new Date(policy.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary', lineHeight: 1.3 }}>
                                {policy.event_name}
                            </Typography>

                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 700 }}>
                                        MARKET IMPACT MAGNITUDE
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: isPositive ? 'success.light' : 'error.light' }}>
                                        {absScore * 10}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={absScore * 10}
                                    sx={{
                                        height: 4,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: isPositive ? 'success.main' : 'error.main'
                                        }
                                    }}
                                />
                            </Box>

                            <Tooltip title={policy.impact_notes} arrow placement="top">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5, cursor: 'help' }}>
                                    <Info size={12} color="#64748b" />
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', fontWeight: 600 }}>
                                        Institutional Impact Attribution...
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Box>
                    );
                })}
            </Box>

            <Box sx={{
                mt: 'auto',
                pt: 2,
                px: 2,
                py: 1.5,
                bgcolor: 'rgba(239, 68, 68, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(239, 68, 68, 0.1)'
            }}>
                <Typography variant="caption" sx={{ color: 'error.light', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flag size={10} /> MACRO ANALOGUE: 2018 Tariff Phase correlates with DXY +3.2% (90D).
                </Typography>
            </Box>
        </Card>
    );
};
