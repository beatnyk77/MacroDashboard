import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HoverDetailBarChartProps {
    data: { date: string; value: number }[];
}

export const HoverDetailBarChart: React.FC<HoverDetailBarChartProps> = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
            <XAxis dataKey="date" hide />
            <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', fontSize: '12px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 700 }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);