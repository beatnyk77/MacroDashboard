import React, { useState } from 'react';
import { Box, Typography, Grid, Tabs, Tab, CircularProgress, Paper } from '@mui/material';
import { IndiaASIMap } from '../maps/IndiaASIMap';
import { useIndiaASI, StateASIStats } from '@/hooks/useIndiaASI';
import { styled } from '@mui/material/styles';
import { Factory, Users, TrendingUp } from 'lucide-react';

const GlassPaper = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: theme.spacing(2),
    padding: theme.spacing(3),
    height: '100%',
}));

export const ASISection: React.FC = () => {
    const { data, isLoading, error } = useIndiaASI();
    const [selectedMetric, setSelectedMetric] = useState<keyof StateASIStats>('total_gva');

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error loading ASI data</Typography>;

    const topStatesByGVA = [...(data || [])].sort((a, b) => b.total_gva - a.total_gva).slice(0, 5);
    const topStatesByEmployment = [...(data || [])].sort((a, b) => b.total_employment - a.total_employment).slice(0, 5);

    // Calculate national aggregates
    const nationalGVA = (data || []).reduce((sum, s) => sum + s.total_gva, 0);
    const nationalEmployment = (data || []).reduce((sum, s) => sum + s.total_employment, 0);
    const avgCapacityUtil = (data || []).reduce((sum, s) => sum + s.avg_capacity_utilization, 0) / (data?.length || 1);

    return (
        <Box sx={{ mt: 10 }}>
            <Box sx={{ mb: 6 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900, letterSpacing: '0.3em', fontSize: '0.65rem' }}>
                    Industrial Pulse
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.03em', mb: 1, textTransform: 'uppercase' }}>
                    Annual Survey of Industries
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', maxWidth: '800px' }}>
                    State-level industrial metrics from MoSPI ASI dataset: Gross Value Added, Employment, and Capacity Utilization across manufacturing, mining, and electricity sectors.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Map View */}
                <Grid item xs={12} lg={8}>
                    <GlassPaper>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Tabs value={selectedMetric} onChange={(_, v) => setSelectedMetric(v)} textColor="secondary" indicatorColor="secondary">
                                <Tab label="GVA" value="total_gva" />
                                <Tab label="Employment" value="total_employment" />
                                <Tab label="Capacity Util." value="avg_capacity_utilization" />
                            </Tabs>
                        </Box>
                        <IndiaASIMap data={data || []} metric={selectedMetric} />
                    </GlassPaper>
                </Grid>

                {/* Insights / Rankings */}
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                        {/* National Aggregates */}
                        <GlassPaper sx={{ bgcolor: 'rgba(0,0,0,0.3)' }}>
                            <Typography variant="overline" sx={{ fontWeight: 900, mb: 2, display: 'block', letterSpacing: '0.2em', fontSize: '0.6rem', color: 'primary.light' }}>
                                All India Aggregates
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Factory size={14} className="text-primary" />
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.6 }}>GVA</Typography>
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'mono', letterSpacing: '-0.03em', color: 'primary.main' }}>
                                        ₹{(nationalGVA / 100000).toFixed(1)}T
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Users size={14} className="text-secondary" />
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.6 }}>Employment</Typography>
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'mono', letterSpacing: '-0.03em', color: 'secondary.main' }}>
                                        {(nationalEmployment / 1000).toFixed(1)}M
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <TrendingUp size={14} className="text-success" />
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.6 }}>Avg Capacity</Typography>
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'mono', letterSpacing: '-0.03em', color: 'success.main' }}>
                                        {avgCapacityUtil.toFixed(1)}%
                                    </Typography>
                                </Grid>
                            </Grid>
                        </GlassPaper>

                        {/* Top States by GVA */}
                        <GlassPaper>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, fontSize: '0.9rem' }}>
                                Top States by GVA
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {topStatesByGVA.map((state, i) => (
                                    <Box key={state.state_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body2" sx={{ opacity: 0.3, fontWeight: 900, fontSize: '0.7rem' }}>{String(i + 1).padStart(2, '0')}</Typography>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '-0.01em' }}>{state.state_name}</Typography>
                                        </Box>
                                        <Typography sx={{ fontFamily: 'mono', fontWeight: 900, color: 'primary.main', fontSize: '1rem', letterSpacing: '-0.02em' }}>
                                            ₹{(state.total_gva / 100000).toFixed(2)}T
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </GlassPaper>

                        {/* Top States by Employment */}
                        <GlassPaper>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, fontSize: '0.9rem' }}>
                                Top States by Employment
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {topStatesByEmployment.slice(0, 3).map((state, i) => (
                                    <Box key={state.state_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body2" sx={{ opacity: 0.3, fontWeight: 900, fontSize: '0.7rem' }}>{String(i + 1).padStart(2, '0')}</Typography>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '-0.01em' }}>{state.state_name}</Typography>
                                        </Box>
                                        <Typography sx={{ fontFamily: 'mono', fontWeight: 900, color: 'secondary.main', fontSize: '1rem', letterSpacing: '-0.02em' }}>
                                            {(state.total_employment / 1000).toFixed(1)}M
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </GlassPaper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
