import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const fdmData = [
    { year: '2000', us: 12.1, japan: 21.3, india: 30.2 },
    { year: '2003', us: 10.8, japan: 23.1, india: 28.5 },
    { year: '2006', us: 11.4, japan: 25.0, india: 23.1 },
    { year: '2009', us: 12.3, japan: 28.4, india: 20.1 },
    { year: '2012', us: 11.2, japan: 31.2, india: 22.0 },
    { year: '2015', us: 8.3, japan: 30.8, india: 19.5 },
    { year: '2018', us: 9.0, japan: 29.1, india: 18.2 },
    { year: '2020', us: 10.1, japan: 26.5, india: 17.8 },
    { year: '2022', us: 12.5, japan: 25.2, india: 19.8 },
    { year: '2023', us: 17.8, japan: 26.0, india: 20.4 },
    { year: '2024', us: 21.3, japan: 25.8, india: 19.1 },
];

function FdmTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
    if (active && payload && payload.length) {
        return (
            <TerminalTooltipShell>
                <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
                <div className="space-y-1">
                    {payload.map(p => (
                        <TerminalTooltipRow key={p.name} label={p.name} swatch={p.color}>
                            {p.value.toFixed(1)}%{p.value > 20 ? ' (elevated)' : ''}
                        </TerminalTooltipRow>
                    ))}
                </div>
            </TerminalTooltipShell>
        );
    }
    return null;
}

export const FiscalDominanceMeterChart: React.FC = () => (
    <MacroChartContainer height={CHART_HEIGHTS.standard}>
        <LineChart data={fdmData} margin={{ top: 5, right: 20, left: -5, bottom: 0 }}>
            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
            <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="year" />
            <YAxis {...DEFAULT_YAXIS_PROPS} width={60} domain={[5, 40]} unit="%" />
            <Tooltip content={<FdmTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.75rem', color: CHART_COLORS.label }} />
            <ReferenceLine y={20} stroke={CHART_COLORS.stress} strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: 'Fiscal Dominance Zone', fill: CHART_COLORS.stress, fontSize: 11, position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="us" name="United States" stroke={CHART_COLORS.stress} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="japan" name="Japan" stroke={CHART_COLORS.gold} strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="india" name="India" stroke={CHART_COLORS.indigo} strokeWidth={2} dot={false} strokeDasharray="3 3" />
        </LineChart>
    </MacroChartContainer>
);