import { Card, Box, Typography, useTheme, Alert, Modal, Fade, Backdrop, Grid, Divider } from '@mui/material';
import { ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { Skeleton, IconButton } from '@mui/material';
import { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export const LiquidityAlarmCard: React.FC = () => {
    const theme = useTheme();
    const { data: liq, isLoading } = useNetLiquidity();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (isLoading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />;
    if (!liq) return null;

    // Mock distribution data for the histogram
    const distributionData = [
        { bin: -3, count: 2 }, { bin: -2, count: 5 }, { bin: -1, count: 20 },
        { bin: 0, count: 45 }, { bin: 1, count: 18 }, { bin: 2, count: 8 }, { bin: 3, count: 2 }
    ];

    const isExtreme = liq.alarm_status === 'EXTREME';
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
                        boxShadow: `0 0 30px ${getStatusColor()}30`,
                        transform: 'translateY(-4px)',
                        borderColor: getStatusColor()
                    }
                }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: getStatusColor() }}>{getStatusIcon()}</Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.1em', color: 'text.secondary' }}>
                            LIQUIDITY ALARM
                        </Typography>
                    </Box>
                    <Box sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: `${getStatusColor()}20`,
                        border: `1px solid ${getStatusColor()}40`,
                        color: getStatusColor()
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                            {liq.alarm_status}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                        ${liq.current_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}B
                    </Typography>
                    <Typography variant="body2" sx={{ color: liq.delta >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                        {liq.delta >= 0 ? '+' : ''}{liq.delta.toFixed(1)}B (Daily)
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, display: 'block' }}>Z-SCORE (25Y)</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: getStatusColor() }}>
                            {liq.z_score.toFixed(2)}σ
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, display: 'block' }}>PERCENTILE</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {liq.percentile.toFixed(1)}%
                        </Typography>
                    </Box>
                </Box>

                {(isExtreme || isTightening) && (
                    <Alert
                        severity={isExtreme ? "error" : "warning"}
                        sx={{
                            mt: 'auto',
                            py: 0,
                            px: 1,
                            '& .MuiAlert-message': { fontSize: '0.75rem', fontWeight: 600 },
                            bgcolor: 'transparent',
                            border: 'none'
                        }}
                        icon={false}
                    >
                        {isExtreme
                            ? "Extreme Deviation: Last similar event (Mar 2020) preceded SPX -34% correction."
                            : "Liquidity Tightening: Historical correlation suggests increased volatility ahead."}
                    </Alert>
                )}

                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, opacity: 0.2, pointerEvents: 'none' }}>
                    {/* Visual filler for trend */}
                    <Box sx={{ width: '100%', height: '100%', bgcolor: getStatusColor() }} />
                </Box>
            </Card>

            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(10px)', bgcolor: 'rgba(0,0,0,0.8)' } }}
            >
                <Fade in={isModalOpen}>
                    <Box sx={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: { xs: '90vw', md: 800 },
                        maxHeight: '90vh', overflowY: 'auto',
                        bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                        boxShadow: 24, p: { xs: 3, md: 5 }, borderRadius: 2
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box sx={{ color: getStatusColor() }}>{getStatusIcon()}</Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Liquidity Regime Analysis</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">25-Year Distribution & Historical Context</Typography>
                            </Box>
                            <IconButton onClick={() => setIsModalOpen(false)} sx={{ color: 'text.disabled' }}><X size={24} /></IconButton>
                        </Box>

                        <Grid container spacing={4}>
                            <Grid item xs={12} md={7}>
                                <Typography variant="overline" sx={{ fontWeight: 800, mb: 2, display: 'block' }}>Z-Score Distribution (25Y)</Typography>
                                <Box sx={{ height: 250, width: '100%', mt: 2 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={distributionData}>
                                            <XAxis dataKey="bin" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px' } as React.CSSProperties}
                                                labelStyle={{ color: '#94a3b8', fontWeight: 700 }}
                                            />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                {distributionData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.bin === Math.round(liq.z_score) ? getStatusColor() : '#1e293b'}
                                                    />
                                                ))}
                                            </Bar>
                                            <ReferenceLine x={Math.round(liq.z_score)} stroke={getStatusColor()} strokeDasharray="3 3" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="overline" sx={{ fontWeight: 800, mb: 2, display: 'block' }}>Historical Context</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'error.main', display: 'block' }}>MAR 2020 (SIMILAR Z-SCORE)</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>SPX -34% in 30 days following extreme tightening regime.</Typography>
                                        </Box>
                                        <Divider sx={{ opacity: 0.1 }} />
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'warning.main', display: 'block' }}>AUG 2015 (SHOCK EVENT)</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Market breadth collapsed 15% as liquidity z-score dipped below -2σ.</Typography>
                                        </Box>
                                        <Divider sx={{ opacity: 0.1 }} />
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'success.main', display: 'block' }}>NOV 2023 (EXPANSION)</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Shift from negative to positive z-score triggered +10% SPX rally.</Typography>
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
