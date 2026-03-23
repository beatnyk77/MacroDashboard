import React from 'react';
import { Box, Typography, Grid, useTheme, alpha } from '@mui/material';
import {
    AlertCircle,
    ShieldAlert,
    Cpu,
    Banknote
} from 'lucide-react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea
} from 'recharts';
import { useWhiteCollarDistress } from '@/hooks/useWhiteCollarDistress';
import { MotionCard } from '@/components/MotionCard';

const HeatmapCell: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <Box sx={{
        p: 1.5,
        bgcolor: alpha(color, 0.1),
        borderLeft: `3px solid ${color}`,
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5
    }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, fontFamily: 'monospace' }}>
            {value}%
        </Typography>
    </Box>
);

export const WhiteCollarDebtMonitor: React.FC = () => {
    const { data: history } = useWhiteCollarDistress();
    const data = history[0];
    const theme = useTheme();

    if (!data) return null;

    const isDistress = data.distress_composite_score > 0;
    const accentColor = isDistress ? theme.palette.error.main : '#22d3ee'; // Cyan if stable, Red if distressed

    return (
        <Box sx={{ mb: 6 }}>
            {/* Header / Gauge Row */}
            <Box sx={{
                p: 3,
                mb: 3,
                bgcolor: 'rgba(2, 6, 23, 0.8)',
                border: `1px solid ${alpha(accentColor, 0.2)}`,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: '50%',
                                bgcolor: alpha(accentColor, 0.1),
                                color: accentColor,
                                border: `1px solid ${alpha(accentColor, 0.3)}`
                            }}>
                                {isDistress ? <ShieldAlert size={32} /> : <Cpu size={32} />}
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: -0.5 }}>
                                    {data.distress_composite_score.toFixed(1)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                                    SOLVENCY INDEX
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={9}>
                        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500, mb: 0.5 }}>
                            {data.interpretation}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AlertCircle size={12} /> SIGNAL: {isDistress ? 'ELEVATED' : 'STABLE'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Banknote size={12} /> TICKER: {data.bank_etf_price} USD
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Grid container spacing={3}>
                {/* Main Dual-Axis Chart */}
                <Grid item xs={12} lg={8}>
                    <MotionCard>
                        <Box sx={{ p: 2, height: 400 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                                Market Divergence: Bank Stocks vs Consumer Delinquency
                            </Typography>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={[...history].reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="as_of_date"
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={10}
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short' })}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        stroke="#22d3ee"
                                        fontSize={10}
                                        domain={['auto', 'auto']}
                                        label={{ value: 'Bank Price ($)', angle: -90, position: 'insideLeft', style: { fill: '#22d3ee', fontSize: 10 } }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#f87171"
                                        fontSize={10}
                                        label={{ value: 'Delinquency (%)', angle: 90, position: 'insideRight', style: { fill: '#f87171', fontSize: 10 } }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}
                                    />
                                    {/* Mock Recession Shading for visualization */}
                                    <ReferenceArea yAxisId="left" x1="2024-01-01" x2="2024-03-01" fill="rgba(255,255,255,0.03)" />

                                    <Line yAxisId="left" type="monotone" dataKey="bank_etf_price" stroke="#22d3ee" strokeWidth={2} dot={false} name="KBE (Bank ETF)" />
                                    <Line yAxisId="left" type="monotone" dataKey="symbol_cof_price" stroke="#fbbf24" strokeWidth={1} dot={false} name="COF" strokeDasharray="5 5" />
                                    <Bar yAxisId="right" dataKey="delinquency_credit_cards" fill="#f87171" opacity={0.3} name="CC Delinquency" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </Box>
                    </MotionCard>
                </Grid>

                {/* Heatmap & Correlations */}
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                        {/* 3x3 Heatmap */}
                        <Box sx={{
                            p: 2,
                            bgcolor: 'rgba(2, 6, 23, 0.4)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            flex: 1
                        }}>
                            <Typography variant="caption" sx={{ mb: 2, display: 'block', fontWeight: 700, color: 'text.secondary' }}>
                                SECTOR EXPOSURE SENSITIVITY
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={4}><HeatmapCell label="Prof Services" value={data.unemployment_prof_bus_services} color="#f87171" /></Grid>
                                <Grid item xs={4}><HeatmapCell label="Financials" value={data.unemployment_financial_activities} color="#fbbf24" /></Grid>
                                <Grid item xs={4}><HeatmapCell label="Small Biz" value={2.8} color="#22d3ee" /></Grid>

                                <Grid item xs={4}><HeatmapCell label="Prime Auto" value={Number((data.delinquency_consumer_loans * 0.8).toFixed(1))} color="#22d3ee" /></Grid>
                                <Grid item xs={4}><HeatmapCell label="Subprime CC" value={Number((data.delinquency_credit_cards * 1.5).toFixed(1))} color="#f87171" /></Grid>
                                <Grid item xs={4}><HeatmapCell label="Commercial RE" value={4.2} color="#fbbf24" /></Grid>

                                <Grid item xs={4}><HeatmapCell label="401(k) Flow" value={1.5} color="#fbbf24" /></Grid>
                                <Grid item xs={4}><HeatmapCell label="GRIT Gap" value={0.8} color="#22d3ee" /></Grid>
                                <Grid item xs={4}><HeatmapCell label="Sovereign" value={0.4} color="#22d3ee" /></Grid>
                            </Grid>
                        </Box>

                        {/* Correlation Panel */}
                        <Box sx={{
                            p: 2,
                            bgcolor: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 1
                        }}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 700, color: 'text.secondary' }}>
                                SYSTEMIC CORRELATIONS
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>vs 401(k) Hardships</Typography>
                                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.75rem' }}>
                                    {(data.correlation_401k * 100).toFixed(0)}%
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>vs GRIT Index</Typography>
                                <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 700, fontSize: '0.75rem' }}>
                                    {(data.correlation_grit * 100).toFixed(0)}%
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
