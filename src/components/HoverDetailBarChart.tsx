import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';

interface HoverDetailBarChartProps {
    data: { date: string; value: number }[];
}

export const HoverDetailBarChart: React.FC<HoverDetailBarChartProps> = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
            <XAxis dataKey="date" hide />
            <Tooltip
                contentStyle={DEFAULT_TOOLTIP_STYLE}
                labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                cursor={{ fill: WHITE_ALPHA.faint }}
            />
            <Bar dataKey="value" fill={CHART_COLORS.west} radius={[2, 2, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);