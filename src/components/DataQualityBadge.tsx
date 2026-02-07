import React from 'react';
import { getDataQuality } from '@/utils/dataQuality';
import { cn } from '@/lib/utils';

interface DataQualityBadgeProps {
    timestamp: Date | string | null;
    size?: 'small' | 'medium';
    label?: boolean; // Show text label or just indicator
    className?: string;
}

/**
 * Unified data quality badge using green/yellow/red palette
 * Replaces scattered "NO DATA", "STALE", "LAGGED" badges
 * Reduces visual noise while maintaining data integrity signals
 */
export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
    timestamp,
    size = 'small',
    label = true,
    className
}) => {
    const quality = getDataQuality(timestamp);

    const config: Record<ReturnType<typeof getDataQuality>, {
        icon: string;
        baseColorClass: string;
        bgColorClass: string;
        borderColorClass: string;
        label: string;
    }> = {
        fresh: {
            icon: '✓',
            baseColorClass: 'text-emerald-500',
            bgColorClass: 'bg-emerald-500/15',
            borderColorClass: 'border-emerald-500/40',
            label: 'Fresh'
        },
        delayed: {
            icon: '⏱',
            baseColorClass: 'text-amber-500',
            bgColorClass: 'bg-amber-500/15',
            borderColorClass: 'border-amber-500/40',
            label: 'Delayed'
        },
        stale: {
            icon: '⚠',
            baseColorClass: 'text-rose-500',
            bgColorClass: 'bg-rose-500/15',
            borderColorClass: 'border-rose-500/40',
            label: 'Stale'
        },
    };

    const { icon, baseColorClass, bgColorClass, borderColorClass, label: labelText } = config[quality];

    return (
        <div
            className={cn(
                "inline-flex items-center justify-center font-bold tracking-tight rounded-full border border-solid",
                baseColorClass,
                bgColorClass,
                borderColorClass,
                size === 'small' ? "h-5 text-[0.7rem] px-2" : "h-6 text-[0.8rem] px-2.5",
                className
            )}
        >
            <span className={cn("mr-1", !label && "mr-0")}>
                {icon}
            </span>
            {label && (
                <span>{labelText}</span>
            )}
        </div>
    );
};
