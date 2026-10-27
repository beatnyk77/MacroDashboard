import React from 'react';
import { AreaChart, Area, YAxis } from 'recharts';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

interface HistoryPoint {
    value: number;
    date?: string;
}

interface NetLiquidityGaugeChartProps {
    history?: HistoryPoint[];
    color: string;
}

export const NetLiquidityGaugeChart: React.FC<NetLiquidityGaugeChartProps> = ({ history, color }) => (
    <MacroChartContainer height="fill">
        <AreaChart data={history}>
            <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} isAnimationActive={false} />
            <YAxis hide domain={['auto', 'auto']} />
        </AreaChart>
    </MacroChartContainer>
);