import React from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface DataQualityBadgeProps {
    type?: 'live' | 'simulated' | 'stale';
    lastUpdated?: string | Date | null;
    timestamp?: string | Date | null; // Alias for lastUpdated
    className?: string;
    size?: 'small' | 'medium' | 'large';
    label?: boolean;
}

export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
    type = 'live',
    lastUpdated,
    timestamp,
    className,
    size = 'medium',
    label = true
}) => {
    const effectiveDate = lastUpdated || timestamp;

    // Size maps
    const sizeClasses = {
        small: "px-1.5 py-0.5 text-xs",
        medium: "px-2.5 py-1 text-xs",
        large: "px-3 py-1.5 text-xs"
    };

    const iconSizes = {
        small: "w-2 h-2",
        medium: "w-3 h-3",
        large: "w-4 h-4"
    };

    return (
        <div className={cn(
            "flex items-center gap-2 rounded-full border uppercase tracking-uppercase font-black transition-all",
            sizeClasses[size],
            type === 'live' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
            type === 'simulated' && "bg-amber-500/10 border-amber-500/20 text-amber-500",
            type === 'stale' && "bg-rose-500/10 border-rose-500/20 text-rose-500",
            className
        )}>
            {type === 'live' && <Wifi className={iconSizes[size]} />}
            {type === 'simulated' && <AlertTriangle className={iconSizes[size]} />}
            {type === 'stale' && <WifiOff className={iconSizes[size]} />}

            {label && (
                <span>
                    {type === 'live' ? 'Live Feed' : type === 'simulated' ? 'Simulated Data' : 'Feed Stale'}
                </span>
            )}

            {effectiveDate && type !== 'simulated' && (
                <span className="opacity-50 border-l border-current pl-2 ml-1">
                    {new Date(effectiveDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
            )}
        </div>
    );
};
