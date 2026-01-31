import { Card, Box, Typography, useTheme, Alert, Modal, Fade, Backdrop, Grid, Divider } from '@mui/material';
import { ShieldAlert, ShieldCheck, X, Info, Target, TrendingDown, Activity } from 'lucide-react';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { Skeleton, IconButton } from '@mui/material';
import { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, YAxis } from 'recharts';

export const LiquidityAlarmCard: React.FC = () => {
    const theme = useTheme();
    const { data: liq, isLoading } = useNetLiquidity();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (isLoading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />;
    if (!liq) return null;

    // Smoothed distribution data for the histogram (representative of 25y distribution)
    const distributionData = [
        { bin: -3, count: 5 }, { bin: -2.5, count: 12 }, { bin: -2, count: 28 },
        { bin: -1.5, count: 52 }, { bin: -1, count: 84 }, { bin: -0.5, count: 110 },
        { bin: 0, count: 145 }, { bin: 0.5, count: 115 }, { bin: 1, count: 88 },
        { bin: 1.5, count: 56 }, { bin: 2, count: 32 }, { bin: 2.5, count: 14 }, { bin: 3, count: 6 }
    ];

    const isExtreme = liq.z_score < -2 || liq.z_score > 2;
    const isTightening = liq.alarm_status === 'TIGHTENING';

    const getStatusColor = () => {
        if (isExtreme) return theme.palette.error.main;
        if (isTightening) return theme.palette.warning.main;
        return theme.palette.success.main;
    };

    const getStatusIcon = () => {
        if (isExtreme) return <ShieldAlert size={20} />;
        if (isTightening) return <ShieldAlert size={20} />;
        return <ShieldCheck size={20} />;
    };

    return (
        <>
            <Card
                onClick={() => setIsModalOpen(true)}
                sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: isExtreme ? 'error.main' : isTightening ? 'warning.main' : 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        boxShadow: `0 0 40px ${getStatusColor()}40`,
                        transform: 'translateY(-4px)',
                        borderColor: getStatusColor()
                    }
                }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: getStatusColor() }}>{getStatusIcon()}</Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.12em', color: 'text.secondary' }}>
                            LIQUIDITY ALARM
                        </Typography>
                    </Box>
                    <Box sx={{
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                        bgcolor: `${getStatusColor()}20`,
                        border: `1px solid ${getStatusColor()}40`,
                        color: getStatusColor()
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem' }}>
                            {liq.alarm_status}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
                        ${liq.current_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}B
                    </Typography>
                    <Typography variant="caption" sx={{ color: (liq?.delta || 0) >= 0 ? 'success.main' : 'error.main', fontWeight: 800, bgcolor: (liq?.delta || 0) >= 0 ? 'success.main10' : 'error.main10', px: 1, py: 0.2, borderRadius: 0.5 }}>
                        {liq?.delta !== undefined && liq?.delta !== null ? (liq.delta >= 0 ? '+' : '') : ''}{liq?.delta !== undefined && liq?.delta !== null ? liq.delta.toFixed(1) : '-'}B
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.05em', display: 'block', fontSize: '0.6rem' }}>Z-SCORE (25Y)</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: getStatusColor() }}>
                            {liq?.z_score !== undefined && liq?.z_score !== null ? liq.z_score.toFixed(2) : '-'}σ
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.05em', display: 'block', fontSize: '0.6rem' }}>PERCENTILE</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {liq?.percentile !== undefined && liq?.percentile !== null ? liq.percentile.toFixed(1) : '-'}%
                        </Typography>
                    </Box>
                </Box>

                <Alert
                    severity={isExtreme ? "error" : isTightening ? "warning" : "success"}
                    sx={{
                        mt: 'auto',
                        px: 0,
                        py: 0,
                        bgcolor: 'transparent',
                        border: 'none',
                        '& .MuiAlert-message': {
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: 'text.secondary',
                            lineHeight: 1.4
                        },
                        '& .MuiAlert-icon': { display: 'none' }
                    }}
                >
                    {isExtreme
                        ? "CRITICAL: Extreme net liquidity deviation detected. High risk of asset repricing."
                        : isTightening
                            ? "WARNING: Liquidity is tightening. Volatility risk is increasing."
                            : "STABLE: System liquidity remains within historical normal bounds."}
                </Alert>

                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, bgcolor: getStatusColor(), opacity: 0.6 }} />
            </Card>

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(16px)', bgcolor: 'rgba(0,0,0,0.85)' } }}
            >
                <Fade in={isModalOpen}>
                    <Box sx={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: { xs: '95vw', md: 900 },
                        maxHeight: '95vh', overflowY: 'auto',
                        bgcolor: 'rgba(15, 23, 42, 0.95)', border: '1px solid', borderColor: 'rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        p: { xs: 4, md: 6 }, borderRadius: 4,
                        color: 'text.primary'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${getStatusColor()}20`, color: getStatusColor(), display: 'flex' }}>
                                        {getStatusIcon()}
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>Liquidity Regime Analysis</Typography>
                                </Box>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Visualizing the true net liquidity driving global asset prices.
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setIsModalOpen(false)} sx={{ color: 'text.disabled', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                                <X size={28} />
                            </IconButton>
                        </Box>

                        <Grid container spacing={6}>
                            <Grid item xs={12} md={7}>
                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <Activity size={18} color={theme.palette.primary.main} />
                                        <Typography variant="overline" sx={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em' }}>25-Year Z-Score Distribution</Typography>
                                    </Box>
                                    <Box sx={{ height: 300, width: '100%', position: 'relative' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <XAxis
                                                    dataKey="bin"
                                                    stroke="rgba(255,255,255,0.2)"
                                                    fontSize={11}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(v) => `${v}σ`}
                                                />
                                                <YAxis hide />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <Box sx={{ bgcolor: '#0f172a', p: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
                                                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, display: 'block' }}>Z-SCORE BIN</Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{payload[0].payload.bin}σ</Typography>
                                                                    <Box sx={{ mt: 1 }}>
                                                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800, display: 'block' }}>FREQUENCY</Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>{payload[0].value} Days</Typography>
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                    {distributionData.map((entry, index) => {
                                                        const isCurrentBin = Math.abs(entry.bin - liq.z_score) < 0.25;
                                                        return (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={isCurrentBin ? getStatusColor() : 'rgba(148, 163, 184, 0.15)'}
                                                                style={{ transition: 'all 0.5s ease' }}
                                                            />
                                                        );
                                                    })}
                                                </Bar>
                                                <ReferenceLine x={liq.z_score} stroke={getStatusColor()} strokeWidth={2} strokeDasharray="5 5" label={{ value: 'CURRENT', position: 'top', fill: getStatusColor(), fontSize: 10, fontWeight: 900 }} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>

                                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Target size={18} color={theme.palette.secondary.main} />
                                        <Typography variant="overline" sx={{ fontWeight: 900, fontSize: '0.75rem' }}>Formula & Methodology</Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, mb: 1, color: 'primary.light' }}>
                                        Net Liquidity = WALCL - TGA - RRP
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        Calculated as the Federal Reserve Total Assets (WALCL) minus the Treasury General Account (TGA) and Reverse Repo Facility (RRP). This represents the effective cash balance in the commercial banking system.
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={5}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                            <Info size={18} color={theme.palette.warning.main} />
                                            <Typography variant="overline" sx={{ fontWeight: 900, fontSize: '0.75rem' }}>Macro Significance</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'success.main' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>High Net Liquidity</Typography>
                                                <Typography variant="body2" color="text.secondary">Typical of 'Risk-On' regimes. Excess bank reserves fuel equity and crypto appreciation.</Typography>
                                            </Box>
                                            <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'error.main' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Low/Retracting Liquidity</Typography>
                                                <Typography variant="body2" color="text.secondary">Correlates with tightening cycles. Higher probability of volatility and credit stress.</Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{ p: 4, bgcolor: 'rgba(244, 63, 94, 0.05)', borderRadius: 4, border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                                            <TrendingDown size={18} color={theme.palette.error.main} />
                                            <Typography variant="overline" sx={{ fontWeight: 900, fontSize: '0.75rem', color: 'error.main' }}>Historical Risk Context</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'error.light', display: 'block', letterSpacing: '0.05em' }}>DEC 2018 (QT SHOCK)</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>Last {'\u003e'}2σ tightening regime. SPX declined 20% in 6 months as liquidity drained.</Typography>
                                            </Box>
                                            <Divider sx={{ opacity: 0.05 }} />
                                            <Box>
                                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'warning.light', display: 'block', letterSpacing: '0.05em' }}>MAR 2020 (COLLAPSE)</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>Rapid liquidity contraction preceded the 34% SPX correction.</Typography>
                                            </Box>
                                            <Divider sx={{ opacity: 0.05 }} />
                                            <Box>
                                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.light', display: 'block', letterSpacing: '0.05em' }}>JAN 2024 (RESILIENCE)</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>Positive liquidity z-score supported market resilience despite high rates.</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>
            </Modal>
        </>
    );
};
