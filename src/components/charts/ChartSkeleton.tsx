import React from 'react';
import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
    height?: number;
    className?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = 200, className }) => (
    <div
        className={cn('w-full animate-pulse rounded-lg bg-white/5', className)}
        style={{ height }}
        aria-hidden="true"
    />
);