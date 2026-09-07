import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { CHART_HEIGHTS } from '@/constants/chartDefaults';

interface MacroChartContainerProps {
    height?: number;
    children: React.ReactElement;
    className?: string;
    ariaLabel?: string;
    transcript?: React.ReactNode;
}

export const MacroChartContainer: React.FC<MacroChartContainerProps> = ({
    height = CHART_HEIGHTS.standard,
    children,
    className,
    ariaLabel,
    transcript,
}) => {
    const chartContent = (
        <div className={className} style={{ height, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    );

    if (transcript || ariaLabel) {
        return (
            <figure role="region" aria-label={ariaLabel} className="w-full m-0 p-0">
                {chartContent}
                {transcript}
            </figure>
        );
    }

    return chartContent;
};