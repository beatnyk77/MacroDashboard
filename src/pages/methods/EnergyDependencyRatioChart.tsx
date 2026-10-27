import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

const edrData = [
    { country: 'India', edr: 88, oilCADImpact: 15 },
    { country: 'Japan', edr: 92, oilCADImpact: 22 },
    { country: 'Germany', edr: 65, oilCADImpact: 9 },
    { country: 'China', edr: 18, oilCADImpact: 4 },
    { country: 'USA', edr: -3, oilCADImpact: -1 },
    { country: 'Russia', edr: -180, oilCADImpact: -40 },
    { country: 'Saudi', edr: -210, oilCADImpact: -55 },
];

function EdrTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
    if (active && payload && payload.length) {
        return (
            <TerminalTooltipShell>
                <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
                <div className="space-y-1">
                    {payload.map(p => (
                        <TerminalTooltipRow key={p.name} label="EDR" valueClassName={p.value < 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {p.value}%
                        </TerminalTooltipRow>
                    ))}
                </div>
            </TerminalTooltipShell>
        );
    }
    return null;
}

export const EnergyDependencyRatioChart: React.FC = () => (
    <MacroChartContainer height={CHART_HEIGHTS.standard}>
        <ComposedChart data={edrData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} horizontal={false} />
            <XAxis {...DEFAULT_XAXIS_PROPS} type="number" domain={[-250, 100]} unit="%" />
            <YAxis {...DEFAULT_YAXIS_PROPS} type="category" dataKey="country" width={55} />
            <Tooltip content={<EdrTooltip />} />
            <Bar dataKey="edr" fill={CHART_COLORS.expansion} radius={[0, 3, 3, 0]}
                label={{ position: 'right', fontSize: 11, fill: CHART_COLORS.label, formatter: (v: number) => `${v}%` }} />
        </ComposedChart>
    </MacroChartContainer>
);