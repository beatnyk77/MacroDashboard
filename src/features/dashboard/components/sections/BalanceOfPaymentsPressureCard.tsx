import React from 'react';
import { Box, Typography, Paper, Tooltip, Chip, Stack } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, ReferenceLine } from 'recharts';
import { useBalanceOfPaymentsPressure } from '@/hooks/useBalanceOfPaymentsPressure';
import { Info } from 'lucide-react';

export const BalanceOfPaymentsPressureCard: React.FC = () => {
    const { data, isLoading } = useBalanceOfPaymentsPressure();

    if (isLoading) {
        return <Paper sx={{ p: 3, height: 320, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">Loading BoP Pressure...</Typography>
        </Paper>;
    }

    // Chart data: Z-Score of REER vs Current Account % GDP
    const chartData = data?.map(c => ({
        name: c.code,
        fullName: c.name,
        reerZ: c.reer_z_score,
        caGdp: c.ca_gdp_value,
        status: c.status
    }));

    const getStatusColor = (status: string) => {
        if (status === 'danger') return '#f44336';
        if (status === 'warning') return '#ff9800';
        return '#4caf50';
    };

    return (
        <Paper sx={{
            p: 3,
            height: '100%',
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em' }}>
                        BoP Pressure Monitor (REER + CA)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                        External Vulnerability
                    </Typography>
                </Box>
                <Tooltip title="Tracks Real Effective Exchange Rate (REER) overvaluation vs. Current Account deficits. High REER + Deep CA Deficit = High Currency Pressure.">
                    <Info size={16} style={{ opacity: 0.5, cursor: 'help' }} />
                </Tooltip>
            </Stack>

            <Box sx={{ height: 200, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                            label={{ value: 'Z-Score / % GDP', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '4px' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                        <Bar dataKey="reerZ" name="REER Z-Score" fill="#3f51b5" radius={[4, 4, 0, 0]}>
                            {chartData?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.reerZ > 1.5 ? '#f44336' : '#3f51b5'} />
                            ))}
                        </Bar>
                        <Bar dataKey="caGdp" name="Current Account % GDP" fill="#009688" radius={[4, 4, 0, 0]}>
                            {chartData?.map((entry, index) => (
                                <Cell key={`cell-ca-${index}`} fill={entry.caGdp < -3 ? '#f44336' : '#009688'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                {data?.map(c => (
                    <Chip
                        key={c.code}
                        label={`${c.code}: ${c.reer_z_score.toFixed(1)}Z / ${c.ca_gdp_value.toFixed(1)}%`}
                        size="small"
                        sx={{
                            bgcolor: `${getStatusColor(c.status)}15`,
                            color: getStatusColor(c.status),
                            border: `1px solid ${getStatusColor(c.status)}30`,
                            fontWeight: 600,
                            fontSize: '0.7rem'
                        }}
                    />
                ))}
            </Stack>
        </Paper>
    );
};
