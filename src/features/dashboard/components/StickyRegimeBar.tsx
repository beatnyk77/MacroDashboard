import { Box, Typography, Modal, Fade, Backdrop, IconButton, Grid } from '@mui/material';
import { useRegime } from '@/hooks/useRegime';

import { useState } from 'react';
import { X, History, TrendingUp, TrendingDown, Play } from 'lucide-react';

export const StickyRegimeBar: React.FC = () => {
    const { data: regimeData } = useRegime();
    const [isReplayOpen, setIsReplayOpen] = useState(false);

    if (!regimeData) return null;

    const getRegimeColor = (label: string) => {
        if (label.includes('Expansion')) return '#10b981';
        if (label.includes('Tightening')) return '#ef4444';
        return '#3b82f6';
    };

    return (
        <Box sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1200,
            bgcolor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 1,
            px: 4,
            mx: -4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em' }}>
                    CURRENT REGIME
                </Typography>
                <Box
                    onClick={() => setIsReplayOpen(true)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: `${getRegimeColor(regimeData.regimeLabel)}20`,
                        border: `1px solid ${getRegimeColor(regimeData.regimeLabel)}40`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: `${getRegimeColor(regimeData.regimeLabel)}30`,
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }
                    }}>
                    <Play size={12} fill={getRegimeColor(regimeData.regimeLabel)} color={getRegimeColor(regimeData.regimeLabel)} />
                    <Typography variant="caption" sx={{ fontWeight: 900, color: getRegimeColor(regimeData.regimeLabel), fontSize: '0.75rem' }}>
                        {regimeData.regimeLabel.toUpperCase()}
                    </Typography>
                </Box>
            </Box>

            <Modal
                open={isReplayOpen}
                onClose={() => setIsReplayOpen(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(10px)', bgcolor: 'rgba(0,0,0,0.8)' } }}
            >
                <Fade in={isReplayOpen}>
                    <Box sx={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: { xs: '90vw', md: 700 },
                        bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                        boxShadow: 24, p: { xs: 3, md: 5 }, borderRadius: 2
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <History size={20} color={getRegimeColor(regimeData.regimeLabel)} />
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Regime Replay</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">Diagnostic: {regimeData.regimeLabel}</Typography>
                            </Box>
                            <IconButton onClick={() => setIsReplayOpen(false)} sx={{ color: 'text.disabled' }}><X size={24} /></IconButton>
                        </Box>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="overline" sx={{ fontWeight: 800, mb: 2, display: 'block' }}>Triggering Metrics</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {[
                                        { name: 'Net Liquidity Z-Score', impact: 'High', value: (regimeData.pulseScore / 10).toFixed(1) + 'σ' },
                                        { name: 'Market Breadth', impact: 'Medium', value: 'Positive' },
                                        { name: 'Momentum Alignment', impact: 'Medium', value: 'Strong' }
                                    ].map((m, i) => (
                                        <Box key={i} sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.name}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.light' }}>{m.value}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="overline" sx={{ fontWeight: 800, mb: 2, display: 'block' }}>Historical Asset Perf.</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {[
                                        { name: 'Gold', perf: '+12.4%', up: true },
                                        { name: 'SPX/Gold', perf: '-8.2%', up: false },
                                        { name: 'USD Reserves', perf: '+2.1%', up: true }
                                    ].map((m, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.name}</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: m.up ? 'success.main' : 'error.main' }}>
                                                {m.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                <Typography variant="caption" sx={{ fontWeight: 900 }}>{m.perf}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                                <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.main', opacity: 0.1, borderRadius: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'white', fontStyle: 'italic' }}>
                                        "Similar regimes in 2018/2022 saw significant safe-haven demand."
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>
            </Modal>



            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    PULSE: {regimeData.pulseScore.toFixed(1)}
                </Typography>
                <Box sx={{ width: 60, height: 4, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ width: `${regimeData.pulseScore}%`, height: '100%', bgcolor: getRegimeColor(regimeData.regimeLabel) }} />
                </Box>
            </Box>
        </Box>
    );
};
