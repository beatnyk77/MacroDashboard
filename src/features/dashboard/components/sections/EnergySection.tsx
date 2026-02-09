import React, { useState } from 'react';
import { Box, Typography, Grid, Tabs, Tab, CircularProgress, Paper } from '@mui/material';
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
    if (error || !data || data.length === 0) return (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {error ? 'Error loading energy data' : 'No state energy data available at the moment.'}
            </Typography>
        </Paper>
    );

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
                {/* Heatmap View */}
                <Grid item xs={12} lg={8}>
                    <GlassPaper sx={{ p: 4, height: '100%', minHeight: 600 }}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <span className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-[0.15em]">
                                    Sub-National Energy Matrix
                                </span>
                                <h3 className="text-xl font-black text-foreground tracking-tight">
                                    State-Level Performance
                                </h3>
                            </div>
                            <Tabs
                                value={selectedMetric}
                                onChange={(_, v) => setSelectedMetric(v as keyof StateEnergyStats)}
                                className="bg-white/5 p-1 rounded-lg"
                                TabIndicatorProps={{ style: { display: 'none' } }}
                            >
                                {['coal_production', 'renewable_share', 'electricity_consumption'].map((m) => (
                                    <Tab
                                        key={m}
                                        label={m.replace('_', ' ')}
                                        value={m}
                                        className={`min-h-[32px] h-[32px] text-[0.65rem] font-extrabold uppercase tracking-wider rounded-md transition-all ${selectedMetric === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    />
                                ))}
                            </Tabs>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {data?.sort((a, b) => (b[selectedMetric as keyof typeof b] as number) - (a[selectedMetric as keyof typeof a] as number)).map((state) => {
                                const val = state[selectedMetric as keyof typeof state] as number;
                                // Calculate relative intensity for color
                                const maxVal = Math.max(...(data || []).map(d => d[selectedMetric as keyof typeof d] as number));
                                const intensity = (val / maxVal);

                                let color = 'bg-slate-800';
                                if (selectedMetric === 'coal_production') {
                                    color = `rgba(249, 115, 22, ${0.1 + intensity * 0.9})`; // Orange
                                } else if (selectedMetric === 'renewable_share') {
                                    color = `rgba(16, 185, 129, ${0.1 + intensity * 0.9})`; // Green
                                } else {
                                    color = `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`; // Blue
                                }

                                return (
                                    <div
                                        key={state.state_code}
                                        className="p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all cursor-crosshair"
                                        style={{ backgroundColor: color }}
                                    >
                                        <div className="relative z-10">
                                            <span className="text-[0.6rem] font-black text-white/70 uppercase tracking-widest block mb-1 truncate">
                                                {state.state_name}
                                            </span>
                                            <div className="text-lg font-black text-white tracking-tighter shadow-sm">
                                                {selectedMetric === 'renewable_share' ? val.toFixed(1) + '%' :
                                                    selectedMetric === 'electricity_consumption' ? Math.round(val).toLocaleString() + ' MW' :
                                                        val.toFixed(1) + ' MT'}
                                            </div>
                                        </div>
                                        {/* Grain/Texture overlay */}
                                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-between items-center text-[0.6rem] text-muted-foreground/60 font-medium italic">
                            <span>Intensity indicates relative magnitude across states.</span>
                            <span>Source: MoSPI • CEA</span>
                        </div>
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
