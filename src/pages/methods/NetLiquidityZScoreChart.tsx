import React from 'react';
import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const netLiqData = [
    { date: 'Jan 2020', value: 0.3, zscore: 0.4 },
    { date: 'Apr 2020', value: -1.8, zscore: -2.1 },
    { date: 'Jul 2020', value: 1.2, zscore: 1.5 },
    { date: 'Jan 2021', value: 2.1, zscore: 2.4 },
    { date: 'Jul 2021', value: 1.8, zscore: 2.0 },
    { date: 'Jan 2022', value: 0.6, zscore: 0.8 },
    { date: 'Jul 2022', value: -1.4, zscore: -1.7 },
    { date: 'Jan 2023', value: -0.9, zscore: -1.1 },
    { date: 'Jul 2023', value: 0.2, zscore: 0.3 },
    { date: 'Jan 2024', value: 0.8, zscore: 1.0 },
    { date: 'Jul 2024', value: 1.1, zscore: 1.3 },
    { date: 'Jan 2025', value: 0.5, zscore: 0.6 },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const z = payload[0].value;
        return (
            <TerminalTooltipShell>
                <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
                <TerminalTooltipRow label="Z-score" valueClassName={z > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    Z = {z > 0 ? '+' : ''}{z.toFixed(2)}σ
                </TerminalTooltipRow>
            </TerminalTooltipShell>
        );
    }
    return null;
}

export const NetLiquidityZScoreChart: React.FC = () => (
    <>
        <MacroChartContainer height={CHART_HEIGHTS.standard}>
            <AreaChart data={netLiqData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id="nlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.west} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.west} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="date" />
                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} domain={[-2.5, 3]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke={WHITE_ALPHA.soft} />
                <ReferenceLine y={1.5} stroke={CHART_COLORS.expansion} strokeDasharray="5 5" strokeOpacity={0.5} />
                <ReferenceLine y={-1.5} stroke={CHART_COLORS.stress} strokeDasharray="5 5" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="zscore" stroke={CHART_COLORS.west} fill="url(#nlGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
        </MacroChartContainer>
        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 20, height: 2, bgcolor: CHART_COLORS.expansion, opacity: 0.5 }}/><Typography variant="caption" color="text.secondary">+1.5σ Bull threshold</Typography></Box>
            <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 20, height: 2, bgcolor: CHART_COLORS.stress, opacity: 0.5 }}/><Typography variant="caption" color="text.secondary">−1.5σ Bear threshold</Typography></Box>
        </Box>
    </>
);