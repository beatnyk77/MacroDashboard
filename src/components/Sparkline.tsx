import React, { Suspense, lazy } from 'react';
import { ChartSkeleton } from '@/components/charts/ChartSkeleton';

interface SparklineProps {
    data: { date: string; value: number }[];
    color?: string;
    height?: number;
}

const SparklineImpl = lazy(() =>
    import('./SparklineImpl').then(m => ({ default: m.SparklineImpl }))
);

export const Sparkline: React.FC<SparklineProps> = ({ data, color, height = 40 }) => {
    if (!data || data.length === 0) return null;

    return (
        <Suspense fallback={<ChartSkeleton height={height} className="min-w-[60px]" />}>
            <SparklineImpl data={data} color={color} height={height} />
        </Suspense>
    );
};