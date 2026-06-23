import React from 'react';
import { cn } from '@/lib/utils';
import { CardSkeleton } from '@/components/ui/skeleton';

interface SectionLoadingFallbackProps {
    minHeight?: number | string;
    label?: string;
    className?: string;
}

export const SectionLoadingFallback: React.FC<SectionLoadingFallbackProps> = ({
    minHeight = 200,
    label = 'Loading module',
    className,
}) => (
    <div
        className={cn(
            'w-full rounded-xl border border-white/5 bg-card/30 p-6',
            className
        )}
        style={{ minHeight }}
        role="status"
        aria-label={label}
    >
        <CardSkeleton lines={3} />
        <span className="sr-only">{label}</span>
    </div>
);