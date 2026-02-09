import React, { useState } from 'react';
import { Box, Typography, Grid, Tabs, Tab, CircularProgress, Paper } from '@mui/material';
import { IndiaEnergyMap } from '../maps/IndiaEnergyMap';
import { useIndiaEnergy, StateEnergyStats } from '@/hooks/useIndiaEnergy';
import { styled } from '@mui/material/styles';

const GlassPaper = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: theme.spacing(2),
    padding: theme.spacing(3),
    height: '100%',
}));

export const EnergySection: React.FC = () => {
    const { data, isLoading, error } = useIndiaEnergy();
    const [selectedMetric, setSelectedMetric] = useState<keyof StateEnergyStats>('coal_production');

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error loading energy data</Typography>;

    const topStates = [...(data || [])].sort((a, b) => Number(b[selectedMetric]) - Number(a[selectedMetric])).slice(0, 5);

    return (
        <Box sx={{ mt: 10 }}>
            <Box sx={{ mb: 6 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900, letterSpacing: '0.3em', fontSize: '0.65rem' }}>
                    Sector Pulse
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.03em', mb: 1, textTransform: 'uppercase' }}>
                    Energy Statistics
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Map View */}
                <Grid item xs={12} lg={8}>
                    <GlassPaper>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Tabs value={selectedMetric} onChange={(_, v) => setSelectedMetric(v)} textColor="secondary" indicatorColor="secondary">
                                <Tab label="Coal Prod." value="coal_production" />
                                <Tab label="Renewable Share" value="renewable_share" />
                                <Tab label="Electricity Cons." value="electricity_consumption" />
                            </Tabs>
                        </Box>
                        <IndiaEnergyMap data={data || []} metric={selectedMetric} />
                    </GlassPaper>
                </Grid>

                {/* Insights / Rankings */}
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                        <GlassPaper>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                                Top Performing States
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {topStates.map((state, i) => (
                                    <Box key={state.state_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body2" sx={{ opacity: 0.3, fontWeight: 900, fontSize: '0.7rem' }}>{String(i + 1).padStart(2, '0')}</Typography>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '-0.01em' }}>{state.state_name}</Typography>
                                        </Box>
                                        <Typography sx={{ fontFamily: 'mono', fontWeight: 900, color: 'secondary.main', fontSize: '1rem', letterSpacing: '-0.02em' }}>
                                            {Number(state[selectedMetric]).toLocaleString()}
                                            {selectedMetric === 'renewable_share' ? '%' : ''}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </GlassPaper>

                        <GlassPaper sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                            <Typography variant="overline" sx={{ fontWeight: 900, mb: 1, display: 'block', letterSpacing: '0.2em', fontSize: '0.6rem', color: 'secondary.light' }}>
                                Energy Intensity
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.6 }}>
                                Tracking the efficiency of energy usage relative to state-level economic output.
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                                <Typography variant="h2" sx={{ fontWeight: 900, color: 'secondary.main', fontFamily: 'mono', letterSpacing: '-0.05em', fontSize: '4rem' }}>
                                    15.4%
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.75rem', bgcolor: 'success.main', color: 'success.contrastText', px: 1, py: 0.25, borderRadius: 1 }}>
                                    -2.1%
                                </Typography>
                            </Box>
                        </GlassPaper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
