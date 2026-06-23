import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { CHART_HEIGHTS } from '@/constants/chartDefaults';

interface MacroChartContainerProps {
    height?: number;
    children: React.ReactElement;
    className?: string;
}

export const MacroChartContainer: React.FC<MacroChartContainerProps> = ({
    height = CHART_HEIGHTS.standard,
    children,
    className,
}) => (
    <div className={className} style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
            {children}
        </ResponsiveContainer>
    </div>
);