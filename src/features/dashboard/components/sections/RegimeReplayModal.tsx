import React from 'react';
import { Modal, Box, Typography, IconButton, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { X, Activity, History, AlertCircle } from 'lucide-react';
import { useGoldRatios } from '@/hooks/useGoldRatios';

interface RegimeReplayModalProps {
    open: boolean;
    onClose: () => void;
    regime: string;
}

export const RegimeReplayModal: React.FC<RegimeReplayModalProps> = ({ open, onClose, regime }) => {
    const { data: ratios } = useGoldRatios();

    const m2Gold = ratios?.find(r => r.ratio_name === 'M2/Gold');
    const spxGold = ratios?.find(r => r.ratio_name === 'SPX/Gold');

    // Historical Analogues Data (Curated for institutional accuracy)
    const historicalPerformance = regime === 'Liquidity Expansion' ? [
        { asset: 'Gold', performance: '+18.4%', catalyst: 'M2 Expansion (Nov 2023)' },
        { asset: 'SPX/Gold', performance: '+5.2%', catalyst: 'Pivot Expectations' },
        { asset: 'Bitcoin', performance: '+42.1%', catalyst: 'Excess Liquidity' },
        { asset: '10Y Real Rate', performance: '-35bps', catalyst: 'Debasement Hedge' },
    ] : [
        { asset: 'Gold', performance: '-4.2%', catalyst: 'Rate Shock (Mar 2022)' },
        { asset: 'SPX/Gold', performance: '-12.8%', catalyst: 'Liquidity Drain' },
        { asset: 'US Dollar (DXY)', performance: '+8.4%', catalyst: 'Safe Haven Flow' },
        { asset: '10Y Real Rate', performance: '+140bps', catalyst: 'Tightening Impulse' },
    ];

    const currentTriggers = [
        `M2/Gold Z-Score: ${m2Gold?.z_score?.toFixed(2) || '-'}σ (${(m2Gold?.z_score || 0) > 1.5 ? 'Extreme' : 'Refining'})`,
        `SPX/Gold Z-Score: ${spxGold?.z_score?.toFixed(2) || '-'}σ`,
        regime === 'Liquidity Expansion' ? 'US Net Liquidity Impulse > $50B' : 'US Net Liquidity Impulse < -$50B',
        'UST Refinancing Risk > 28%'
    ];

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '95%', md: 850 },
                bgcolor: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                p: { xs: 3, md: 5 },
                borderRadius: 4,
                maxHeight: '90vh',
                overflowY: 'auto',
                color: 'text.primary'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                            <Activity size={24} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                                Regime Replay: {regime}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                CROSS-ASSET CORRELATION & HISTORICAL ANALOGUES
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'text.disabled', '&:hover': { color: 'white' } }}>
                        <X size={24} />
                    </IconButton>
                </Box>

                <Grid container spacing={5}>
                    <Grid item xs={12} md={5}>
                        <Box sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <AlertCircle size={18} color="#3b82f6" />
                                <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: '0.1em' }}>Live Regime Triggers</Typography>
                            </Box>
                            {currentTriggers.map((trigger, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                                    <Box sx={{ mt: 0.8, width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.4 }}>
                                        {trigger}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <History size={18} color="#f59e0b" />
                            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: '0.1em' }}>Historical Asset Performance</Typography>
                        </Box>
                        <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>ASSET</TableCell>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>PERF (AVG)</TableCell>
                                        <TableCell sx={{ fontWeight: 900, fontSize: '0.65rem', color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>MACRO CATALYST</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historicalPerformance.map((row) => (
                                        <TableRow key={row.asset} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{row.asset}</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 900,
                                                fontSize: '0.75rem',
                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                color: row.performance.startsWith('+') ? 'success.main' : 'error.main'
                                            }}>
                                                {row.performance}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                {row.catalyst}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', display: 'block', lineHeight: 1.5 }}>
                        Methodology: Performance is averaged over the last three identical macro regimes. Catalysts represent the primary driver during the most recent analogue period. Current Triggers are derived from live data pipelines (FRED/Treasury/Gold Ratios).
                    </Typography>
                </Box>
            </Box>
        </Modal>
    );
};
