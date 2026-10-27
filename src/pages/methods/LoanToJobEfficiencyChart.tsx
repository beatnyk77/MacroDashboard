import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const ljeData = [
    { quarter: 'Q1 22', creditGrowth: 8.2, epfo: 1450, ratio: 5.7 },
    { quarter: 'Q2 22', creditGrowth: 12.0, epfo: 1520, ratio: 7.9 },
    { quarter: 'Q3 22', creditGrowth: 17.1, epfo: 1640, ratio: 10.4 },
    { quarter: 'Q4 22', creditGrowth: 16.4, epfo: 1700, ratio: 9.6 },
    { quarter: 'Q1 23', creditGrowth: 15.8, epfo: 1580, ratio: 10.0 },
    { quarter: 'Q2 23', creditGrowth: 16.2, epfo: 1490, ratio: 10.9 },
    { quarter: 'Q3 23', creditGrowth: 14.9, epfo: 1620, ratio: 9.2 },
    { quarter: 'Q4 23', creditGrowth: 16.1, epfo: 1550, ratio: 10.4 },
    { quarter: 'Q1 24', creditGrowth: 15.5, epfo: 1430, ratio: 10.8 },
    { quarter: 'Q2 24', creditGrowth: 14.8, epfo: 1510, ratio: 9.8 },
    { quarter: 'Q3 24', creditGrowth: 13.2, epfo: 1460, ratio: 9.0 },
    { quarter: 'Q4 24', creditGrowth: 11.8, epfo: 1540, ratio: 7.7 },
];

function LjTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
    if (active && payload && payload.length) {
        return (
            <TerminalTooltipShell>
                <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
                <div className="space-y-1">
                    {payload.map(p => (
                        <TerminalTooltipRow key={p.name} label={p.name} swatch={p.color}>
                            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                            {p.name === 'Credit Growth' ? '%' : p.name === 'EPFO Additions' ? 'k' : 'x'}
                        </TerminalTooltipRow>
                    ))}
                </div>
            </TerminalTooltipShell>
        );
    }
    return null;
}

export const LoanToJobEfficiencyChart: React.FC = () => (
    <MacroChartContainer height={CHART_HEIGHTS.standard}>
        <LineChart data={ljeData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
            <XAxis {...DEFAULT_XAXIS_PROPS} dataKey="quarter" />
            <YAxis {...DEFAULT_YAXIS_PROPS} width={60} yAxisId="left" domain={[5, 20]} label={{ value: 'Credit %', angle: -90, position: 'insideLeft', fill: CHART_COLORS.tick, fontSize: 11 }} />
            <YAxis {...DEFAULT_YAXIS_PROPS} width={60} yAxisId="right" orientation="right" domain={[1200, 1800]} label={{ value: 'EPFO (k)', angle: 90, position: 'insideRight', fill: CHART_COLORS.tick, fontSize: 11 }} />
            <Tooltip content={<LjTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.75rem', color: CHART_COLORS.label }} />
            <Line yAxisId="left" type="monotone" dataKey="creditGrowth" name="Credit Growth" stroke={CHART_COLORS.indigo} strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="epfo" name="EPFO Additions" stroke={CHART_COLORS.expansion} strokeWidth={2} dot={false} strokeDasharray="5 5" />
        </LineChart>
    </MacroChartContainer>
);