import React from 'react';
import { Box, Typography, Card, Tooltip, Chip } from '@mui/material';
import { Flag, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { usePresidentialPolicies } from '@/hooks/usePresidentialPolicies';

export const PresidentialPolicyTracker: React.FC = () => {
    const { data: policies, isLoading } = usePresidentialPolicies();

    if (isLoading || !policies || policies.length === 0) return null;

    return (
        <Card sx={{
            p: 3,
            height: '100%',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flag size={18} color="#ef4444" />
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.1em', color: 'text.secondary' }}>
                        POLICY IMPACT TRACKER: TRUMP 2.0
                    </Typography>
                </Box>
                <Chip
                    label="Deterministic"
                    size="small"
                    sx={{ fontSize: '0.6rem', fontWeight: 900, bgcolor: 'rgba(255,255,255,0.05)', color: 'text.disabled' }}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {policies.slice(0, 4).map((policy, idx) => (
                    <Box key={policy.id} sx={{
                        pb: 2,
                        borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        position: 'relative'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {new Date(policy.event_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {policy.policy_score > 0 ? (
                                    <TrendingUp size={14} color="#10b981" />
                                ) : (
                                    <TrendingDown size={14} color="#ef4444" />
                                )}
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {policy.event_name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                Correlation:
                            </Typography>
                            <Tooltip title={policy.impact_notes} arrow>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                                    <Typography variant="caption" sx={{
                                        fontWeight: 800,
                                        color: policy.policy_score > 0 ? 'success.light' : 'error.light',
                                        bgcolor: policy.policy_score > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        px: 0.5,
                                        borderRadius: 0.5
                                    }}>
                                        {policy.category.toUpperCase()} {policy.policy_score > 0 ? 'EXPANSION' : 'PROTECTIONIST'}
                                    </Typography>
                                    <Info size={12} color="#94a3b8" />
                                </Box>
                            </Tooltip>
                        </Box>
                    </Box>
                ))}
            </Box>

            <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                    Historical Analogue: Similar tariff phase (2018) correlates with DXY +3.2% in 90 days.
                </Typography>
            </Box>
        </Card>
    );
};
