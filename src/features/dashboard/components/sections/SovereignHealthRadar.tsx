import React from 'react';
import { Box, Typography, Card, Grid, CircularProgress, Stack, Tooltip } from '@mui/material';
import { Shield, Info } from 'lucide-react';
import { useViewContext } from '@/context/ViewContext';
import { SectionHeader } from '@/components/SectionHeader';

export const SovereignHealthRadar: React.FC = () => {
    const { isInstitutionalView } = useViewContext();

    if (!isInstitutionalView) return null;

    // Institutional Scoring Logic (Simulated for Demo based on actual macro bounds)
    const calculateDebtScore = () => {
        // Debt/GDP proxy: Lower is better. Max 150%
        return 65; // Static for now
    };

    const calculateReserveScore = () => {
        // Gold/M2 proxy: Higher is better.
        return 42; // Static for now
    };

    const calculateMonetaryScore = () => {
        // Real rates proxy
        return 78;
    };

    const compositeScore = Math.floor((calculateDebtScore() + calculateReserveScore() + calculateMonetaryScore()) / 3);

    const getScoreColor = (s: number) => {
        if (s > 70) return '#10b981';
        if (s > 40) return '#f59e0b';
        return '#f43f5e';
    };

    return (
        <Card id="sovereign-health-radar" sx={{ p: 3, mb: 4, bgcolor: 'background.paper', position: 'relative', overflow: 'hidden' }}>
            <SectionHeader
                title="SOVEREIGN HEALTH ENGINE (G20)"
                icon={<Shield size={20} color="#3b82f6" />}
                exportId="sovereign-health-radar"
                action={
                    <Tooltip title="Institutional Alpha: Weighted index of Debt Sustainability, Reserve Adequacy, and Monetary Policy effectiveness.">
                        <Info size={14} color="#64748b" style={{ cursor: 'help' }} />
                    </Tooltip>
                }
            />

            <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={4}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                        <CircularProgress
                            variant="determinate"
                            value={compositeScore}
                            size={120}
                            thickness={4}
                            sx={{ color: getScoreColor(compositeScore) }}
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}
                        >
                            <Typography variant="h4" component="div" sx={{ fontWeight: 900 }}>
                                {compositeScore}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                INDEX
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Stack spacing={2.5}>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>DEBT SUSTAINABILITY</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>65/100</Typography>
                            </Box>
                            <Box sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.03)', height: 4, borderRadius: 1 }}>
                                <Box sx={{ width: '65%', bgcolor: '#10b981', height: '100%', borderRadius: 'inherit' }} />
                            </Box>
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>RESERVE ADEQUACY</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>42/100</Typography>
                            </Box>
                            <Box sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.03)', height: 4, borderRadius: 1 }}>
                                <Box sx={{ width: '42%', bgcolor: '#f59e0b', height: '100%', borderRadius: 'inherit' }} />
                            </Box>
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>MONETARY DISCIPLINE</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>78/100</Typography>
                            </Box>
                            <Box sx={{ width: '100%', bgcolor: 'rgba(255,255,255,0.03)', height: 4, borderRadius: 1 }}>
                                <Box sx={{ width: '78%', bgcolor: '#10b981', height: '100%', borderRadius: 'inherit' }} />
                            </Box>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Card>
    );
};
