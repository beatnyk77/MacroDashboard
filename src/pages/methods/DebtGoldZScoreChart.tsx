import React from 'react';
import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const debtGoldData = [
    { year: '2000', zscore: -0.8 },
    { year: '2002', zscore: -0.5 },
    { year: '2004', zscore: 0.1 },
    { year: '2006', zscore: 0.6 },
    { year: '2008', zscore: 1.1 },
    { year: '2010', zscore: 0.4 },
    { year: '2012', zscore: 0.9 },
    { year: '2014', zscore: 1.3 },
    { year: '2016', zscore: 1.4 },
    { year: '2018', zscore: 1.7 },
    { year: '2020', zscore: 2.0 },
    { year: '2022', zscore: 1.5 },
    { year: '2024', zscore: 2.3 },
];

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const z = payload[0].value;
        return (
            <TerminalTooltipShell>
                <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
                <TerminalTooltipRow
                    label="Z-score"
                    valueClassName={z > 2.0 ? 'text-amber-400' : z > 1.0 ? 'text-orange-400' : 'text-slate-400'}
                >
                    Z = {z > 0 ? '+' : ''}{z.toFixed(1)}σ
                </TerminalTooltipRow>
            </TerminalTooltipShell>
        );
    }
    return null;
}

export const DebtGoldZScoreChart: React.FC = () => (
    <>
        <MacroChartContainer height={CHART_HEIGHTS.standard}>
            <BarChart data={debtGoldData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" />
                <YAxis {...DEFAULT_YAXIS_PROPS} width={60} domain={[-1.5, 2.8]} />
                <Tooltip content={<BarTooltip />} />
                <ReferenceLine y={0} stroke={WHITE_ALPHA.soft} />
                <ReferenceLine y={2.0} stroke={CHART_COLORS.gold} strokeDasharray="5 5" strokeOpacity={0.6} />
                <Bar dataKey="zscore" radius={[3, 3, 0, 0]}>
                    {debtGoldData.map((entry) => (
                        <Cell key={entry.year} fill={entry.zscore > 2.0 ? CHART_COLORS.gold : entry.zscore > 1.0 ? CHART_COLORS.orange : CHART_COLORS.west} />
                    ))}
                </Bar>
            </BarChart>
        </MacroChartContainer>
        <Box display="flex" gap={3} mt={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 12, height: 12, bgcolor: CHART_COLORS.gold, borderRadius: '2px' }} /><Typography variant="caption" color="text.secondary">Z &gt; +2.0σ (Extreme gold undervaluation signal)</Typography></Box>
            <Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 12, height: 12, bgcolor: CHART_COLORS.orange, borderRadius: '2px' }} /><Typography variant="caption" color="text.secondary">Z +1.0σ to +2.0σ (Elevated)</Typography></Box>
        </Box>
    </>
);