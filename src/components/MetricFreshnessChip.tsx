import React from 'react';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MetricFreshnessChipProps {
    metricId: string;
    sourceLabel?: string;
    className?: string;
}

export const MetricFreshnessChip: React.FC<MetricFreshnessChipProps> = ({
    metricId,
    sourceLabel,
    className,
}) => {
    const { data: metric, isLoading } = useLatestMetric(metricId);

    if (isLoading) {
        return (
            <Skeleton
                className={cn('h-6 w-24 rounded-full', className)}
                aria-label="Loading data freshness"
            />
        );
    }

    if (!metric) {
        if (!sourceLabel) return null;
        return (
            <span className={cn('label-mono', className)}>
                Source: {sourceLabel}
            </span>
        );
    }

    const freshness = getStaleness(metric.lastUpdated, metric.frequency);

    return (
        <FreshnessChip
            status={freshness.state}
            lastUpdated={metric.lastUpdated}
            isProvisional={metric.isProvisional}
            sourceRef={metric.sourceRef}
            provenance={metric.provenance}
        />
    );
};