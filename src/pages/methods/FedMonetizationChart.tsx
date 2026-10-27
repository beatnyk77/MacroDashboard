import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const monetizationData = [
    { year: '2000', ratio: 5.2 },
    { year: '2002', ratio: 6.1 },
    { year: '2004', ratio: 6.8 },
    { year: '2006', ratio: 6.3 },
    { year: '2008', ratio: 7.4 },
    { year: '2010', ratio: 12.6 },
    { year: '2012', ratio: 16.1 },
    { year: '2014', ratio: 18.7 },
    { year: '2016', ratio: 17.2 },
    { year: '2018', ratio: 15.8 },
    { year: '2020', ratio: 22.4 },
    { year: '2022', ratio: 19.3 },
    { year: '2024', ratio: 17.1 },
    { year: '2026', ratio: 16.4 },
];

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
    if (active && payload && payload.length) {
        const v = payload[0].value;
        return (
            <TerminalTooltipShell>
                <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
                <TerminalTooltipRow label="Fed share" valueClassName={v > 20 ? 'text-amber-400' : v > 15 ? 'text-orange-400' : 'text-slate-400'}>
                    {v.toFixed(1)}%
                </TerminalTooltipRow>
            </TerminalTooltipShell>
        );
    }
    return null;
}

export const FedMonetizationChart: React.FC = () => (
    <MacroChartContainer height={CHART_HEIGHTS.standard}>
        <AreaChart data={monetizationData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
                <linearGradient id="monetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.indigo} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.indigo} stopOpacity={0.02} />
                </linearGradient>
            </defs>
            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
            <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" />
            <YAxis {...DEFAULT_YAXIS_PROPS} width={60} domain={[0, 28]} unit="%" />
            <Tooltip content={<AreaTooltip />} />
            <ReferenceLine y={20} stroke={CHART_COLORS.gold} strokeDasharray="5 5" strokeOpacity={0.7} label={{ value: 'YCC threshold', fill: CHART_COLORS.gold, fontSize: 11, position: 'insideTopRight' }} />
            <Area type="monotone" dataKey="ratio" stroke={CHART_COLORS.indigo} strokeWidth={2} fill="url(#monetGrad)" dot={false} />
        </AreaChart>
    </MacroChartContainer>
);