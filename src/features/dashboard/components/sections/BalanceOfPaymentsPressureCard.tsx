import React from 'react';
import { Box, Typography, Paper, Tooltip, Chip, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, ReferenceLine } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { useBalanceOfPaymentsPressure } from '@/hooks/useBalanceOfPaymentsPressure';
import { Info } from 'lucide-react';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const BalanceOfPaymentsPressureCard: React.FC = () => {
    const { data, isLoading } = useBalanceOfPaymentsPressure();

    if (isLoading) {
        return <Paper sx={{ p: 3, height: 320, bgcolor: WHITE_ALPHA.ghost, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        if (status === 'danger') return CHART_COLORS.stress;
        if (status === 'warning') return CHART_COLORS.orange;
        return CHART_COLORS.expansion;
    };

    return (
        <Paper sx={{
            p: 3,
            height: '100%',
            bgcolor: WHITE_ALPHA.ghost,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: '0.1em' }}>
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
                <MacroChartContainer height="fill">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                        <XAxis
                            {...DEFAULT_XAXIS_PROPS}
                            dataKey="name"
                            axisLine={false}
                            tick={{ fill: WHITE_ALPHA.mid, fontSize: 12 }}
                        />
                        <YAxis
                            {...DEFAULT_YAXIS_PROPS}
                            width={60}
                            axisLine={false}
                            tick={{ fill: WHITE_ALPHA.mid, fontSize: 11 }}
                            label={{ value: 'Z-Score / % GDP', angle: -90, position: 'insideLeft', fill: WHITE_ALPHA.dim, fontSize: 11 }}
                        />
                        <RechartsTooltip
                            contentStyle={DEFAULT_TOOLTIP_STYLE}
                            labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                            itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                        />
                        <ReferenceLine y={0} stroke={WHITE_ALPHA.soft} />
                        <Bar dataKey="reerZ" name="REER Z-Score" fill={CHART_COLORS.indigo} radius={[4, 4, 0, 0]}>
                            {chartData?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.reerZ > 1.5 ? CHART_COLORS.stress : CHART_COLORS.indigo} />
                            ))}
                        </Bar>
                        <Bar dataKey="caGdp" name="Current Account % GDP" fill={CHART_COLORS.westDeep} radius={[4, 4, 0, 0]}>
                            {chartData?.map((entry, index) => (
                                <Cell key={`cell-ca-${index}`} fill={entry.caGdp < -3 ? CHART_COLORS.stress : CHART_COLORS.westDeep} />
                            ))}
                        </Bar>
                    </BarChart>
                </MacroChartContainer>
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
