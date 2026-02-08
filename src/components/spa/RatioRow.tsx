import React from 'react';
import { cn } from '@/lib/utils';

interface RatioRowProps {
    title: string;
    value: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    label?: string;
    children?: React.ReactNode;
    className?: string;
}

/**
 * RatioRow - A full-width row component for displaying a primary metric
 * with large typography (4xl) and supporting visualization.
 */
export const RatioRow: React.FC<RatioRowProps> = ({
    title,
    value,
    subtitle,
    trend,
    label,
    children,
    className,
}) => {
    return (
        <div className={cn(
            "spa-card flex flex-col lg:flex-row lg:items-center justify-between gap-8",
            className
        )}>
            <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        {label || 'Signal'}
                    </span>
                    {trend && (
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            trend === 'up' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                trend === 'down' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                                    "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        )} />
                    )}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground/80">
                    {title}
                </h2>
                <div className="flex flex-col">
                    <span className="spa-hero-value text-blue-400">
                        {value}
                    </span>
                    {subtitle && (
                        <span className="text-sm font-medium text-muted-foreground/50">
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full flex justify-end">
                {children}
            </div>
        </div>
    );
};
