import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { CHART_HEIGHTS } from '@/constants/chartDefaults';
import { cn } from '@/lib/utils';

interface MacroChartContainerProps {
    /** Pixel height (use CHART_HEIGHTS), 'fill' to fill a sized parent, or a percentage of the parent. */
    height?: number | 'fill' | `${number}%`;
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
    // Fixed height + minHeight reserve the slot before measurement (no layout shift);
    // min-w-0 lets the container shrink inside flex/grid parents instead of overflowing.
    // 'fill' and percentage heights defer to a parent that already has a definite height.
    const style = typeof height === 'number'
        ? { height, minHeight: height }
        : { height: height === 'fill' ? '100%' : height };
    const chartContent = (
        <div className={cn('w-full min-w-0', className)} style={style}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
