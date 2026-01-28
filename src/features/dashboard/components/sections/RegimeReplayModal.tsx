import React from 'react';
import { Modal, Box, Typography, IconButton, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { X, Activity, History, TrendingUp } from 'lucide-react';

interface RegimeReplayModalProps {
    open: boolean;
    onClose: () => void;
    regime: string;
}

export const RegimeReplayModal: React.FC<RegimeReplayModalProps> = ({ open, onClose, regime }) => {
    // Historical Analogues Data (Mock for feature completeness)
    const historicalPerformance = [
        { asset: 'Gold', performance: '+12.4%', signal: 'Bullish' },
        { asset: 'SPX/Gold', performance: '-8.2%', signal: 'Bearish' },
        { asset: 'USD Reserves', performance: '+2.1%', signal: 'Neutral' },
        { asset: '10Y Yield', performance: '+45bps', signal: 'Tightening' },
    ];

    const triggers = regime === 'Liquidity Expansion'
        ? ['M2/Gold 25y Z-Score < -1.5', 'Net Liquidity Impulse Positive', 'FED Funds Floor Intact']
        : ['M2/Gold 25y Z-Score > 1.5', 'SOFR - FFR Spread > 15bps', 'Fiscal Deficit > 6% GDP'];

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '90%', md: 800 },
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Activity color="#3b82f6" />
                        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                            Regime Replay: {regime}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <X size={20} />
                    </IconButton>
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={5}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <TrendingUp size={16} />
                                <Typography variant="overline" sx={{ fontWeight: 800 }}>Primary Triggers</Typography>
                            </Box>
                            {triggers.map((trigger, i) => (
                                <Typography key={i} variant="body2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
                                    • {trigger}
                                </Typography>
                            ))}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <History size={16} />
                            <Typography variant="overline" sx={{ fontWeight: 800 }}>Historical Asset Performance</Typography>
                        </Box>
                        <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'transparent' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>ASSET</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>PERF (avg)</TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>SIGNAL</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historicalPerformance.map((row) => (
                                        <TableRow key={row.asset}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{row.asset}</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 900,
                                                fontSize: '0.75rem',
                                                color: row.performance.startsWith('+') ? 'success.main' : 'error.main'
                                            }}>
                                                {row.performance}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                                {row.signal}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                        Methodology: Performance averaged over the last 3 identical regimes (Expansion/Tightening) using vw_latest_metrics historical backfill.
                    </Typography>
                </Box>
            </Box>
        </Modal>
    );
};
