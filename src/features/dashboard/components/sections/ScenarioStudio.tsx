import React, { useState, useMemo } from 'react';
import { Box, Typography, Card, Grid, Slider, Stack, Divider } from '@mui/material';
import { Target, TrendingUp, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useViewContext } from '@/context/ViewContext';

// Institutional Baselines for Simulation (124Y Context)
const BASELINES = {
    RATIO_M2_GOLD: { mean: 10.69, stddev: 3.37 },
    US_M2: { current: 21200 }, // Approx B
    GOLD: { current: 2800 }     // Approx USD
};

export const ScenarioStudio: React.FC = () => {
    const { isInstitutionalView } = useViewContext();
    const { data: m2Data } = useLatestMetric('US_M2');

    // Simulation State
    const [simGold, setSimGold] = useState(3000);
    const [simM2Growth, setSimM2Growth] = useState(5); // %

    // Calculations
    const currentM2 = m2Data?.value || BASELINES.US_M2.current;
    const simM2 = currentM2 * (1 + simM2Growth / 100);
    const simRatio = simM2 / simGold;

    const zScore = (simRatio - BASELINES.RATIO_M2_GOLD.mean) / BASELINES.RATIO_M2_GOLD.stddev;

    // Normal Distribution Percentile Approximation
    const getPercentile = (z: number) => {
        const p = 0.5 * (1 + erf(z / Math.sqrt(2)));
        return p * 100;
    };
    const percentile = getPercentile(zScore);

    const regimeLabel = useMemo(() => {
        if (zScore > 3) return 'Hyper-Debasement (Post-GFC/WWII)';
        if (zScore > 2) return 'Monetary Expansion (1970s Peak)';
        if (zScore < 1) return 'Sound Money Anchor (Historical Mean)';
        return 'Standard Fiat Expansion';
    }, [zScore]);

    if (!isInstitutionalView) return null;

    return (
        <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Target color="#3b82f6" size={24} />
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Scenario Studio <Typography component="span" variant="h5" color="text.secondary" sx={{ fontWeight: 400 }}>(Beta)</Typography>
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                    <Card sx={{ p: 4, height: '100%', bgcolor: 'background.paper' }}>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>Simulation Inputs</Typography>

                        <Stack spacing={4} sx={{ mt: 3 }}>
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Simulated Gold Price (USD)</Typography>
                                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800 }}>${simGold.toLocaleString()}</Typography>
                                </Box>
                                <Slider
                                    value={simGold}
                                    onChange={(_, v) => setSimGold(v as number)}
                                    min={2000}
                                    max={25000}
                                    step={500}
                                    marks={[
                                        { value: 2800, label: 'Current' },
                                        { value: 10000, label: '$10K' },
                                        { value: 25000, label: '$25K' }
                                    ]}
                                    sx={{
                                        '& .MuiSlider-markLabel': { fontSize: '0.65rem', fontWeight: 700 }
                                    }}
                                />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>M2 Annual Growth Rate</Typography>
                                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800 }}>{simM2Growth}%</Typography>
                                </Box>
                                <Slider
                                    value={simM2Growth}
                                    onChange={(_, v) => setSimM2Growth(v as number)}
                                    min={-5}
                                    max={50}
                                    step={1}
                                    marks={[
                                        { value: 0, label: 'Flat' },
                                        { value: 15, label: '1970s Avg' },
                                        { value: 40, label: '2020 Peak' }
                                    ]}
                                    sx={{
                                        '& .MuiSlider-markLabel': { fontSize: '0.65rem', fontWeight: 700 }
                                    }}
                                />
                            </Box>
                        </Stack>

                        <Box sx={{ mt: 6, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Info size={14} color="#94a3b8" />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                    INSTITUTIONAL MODELING NOTE
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                This engine uses 124 years of fiscal and monetary data to recalculate sovereign stress levels.
                                High Gold targets ($10K+) simulate extreme reserve displacement or currency reset scenarios.
                            </Typography>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card sx={{ p: 4, height: '100%', bgcolor: 'rgba(59, 130, 246, 0.03)', border: '1px solid', borderColor: 'primary.main', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}>
                            <TrendingUp size={120} color="#3b82f6" />
                        </Box>

                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900 }}>Simulated Outputs</Typography>

                        <Stack spacing={3} sx={{ mt: 3 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>M2 / GOLD RATIO</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 900 }}>{simRatio.toFixed(2)}</Typography>
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>INSTITUTIONAL Z-SCORE</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 900, color: Math.abs(zScore) > 2 ? 'error.main' : 'primary.main' }}>
                                        {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}σ
                                    </Typography>
                                </Box>
                                <Box sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
                                    <Box sx={{
                                        width: `${Math.min(100, Math.max(0, (percentile)))}%`,
                                        height: '100%',
                                        bgcolor: Math.abs(zScore) > 2 ? 'error.main' : 'primary.main',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </Box>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', fontSize: '0.65rem' }}>
                                    Percentile Rank: <strong>{percentile.toFixed(1)}%</strong>
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 1 }} />

                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>REGIME PROJECTION</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                    {zScore > 2 ? <AlertTriangle size={18} color="#f43f5e" /> : <ShieldCheck size={18} color="#10b981" />}
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{regimeLabel}</Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>SIMULATED LIQUIDITY POOL</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>${(simM2 / 1000).toFixed(1)}T</Typography>
                                <Typography variant="caption" color="text.disabled">
                                    {(simM2 / currentM2 - 1) > 0 ? '+' : ''}{((simM2 / currentM2 - 1) * 100).toFixed(1)}% vs Current
                                </Typography>
                            </Box>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// Simple Erf function for browser
function erf(x: number) {
    // constants
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    // Save the sign of x
    const sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);

    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}
