import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, Database, History, AlertTriangle } from 'lucide-react';
import type { AuthorityMetricSnapshot } from '@/lib/authority/metricContract';

interface DataProvenanceBadgeProps {
    snapshot: AuthorityMetricSnapshot;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const DataProvenanceBadge: React.FC<DataProvenanceBadgeProps> = ({
    snapshot,
    className,
    size = 'md'
}) => {
    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs gap-1.5",
        md: "px-3 py-1 text-xs gap-2",
        lg: "px-4 py-1.5 text-sm gap-2.5"
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-3.5 h-3.5",
        lg: "w-4 h-4"
    };

    const isVerified = snapshot.data_status === 'verified' || snapshot.data_status === 'corrected';
    const isUnavailable = snapshot.data_status === 'unavailable';
    const StatusIcon = isVerified ? ShieldCheck : AlertTriangle;
    
    const statusColors = isVerified 
        ? "text-emerald-500" 
        : isUnavailable 
            ? "text-red-500" 
            : "text-amber-500";

    return (
        <div className={cn(
            "inline-flex flex-wrap items-center rounded border border-white/12 bg-white/5 text-white/40 font-mono uppercase tracking-widest",
            sizeClasses[size],
            className
        )}>
            <div className="flex items-center gap-1.5 border-r border-white/12 pr-2 mr-0.5">
                <StatusIcon className={cn(statusColors, iconSizes[size])} />
                <span className="text-white/60">
                    {snapshot.source.source_name ?? 'Unknown Source'}
                </span>
            </div>
            
            {snapshot.methodology_version && (
                <div className="flex items-center gap-1.5 border-r border-white/12 pr-2 mr-0.5">
                    <Database className={iconSizes[size]} />
                    <span>v{snapshot.methodology_version}</span>
                </div>
            )}

            <div className="flex items-center gap-1.5">
                <History className={iconSizes[size]} />
                <span>
                    {snapshot.observed_at 
                        ? `Observed ${new Date(snapshot.observed_at).toISOString().split('T')[0]}`
                        : 'No Date'}
                </span>
            </div>
            
            <div className="flex items-center gap-1.5 pl-2 ml-0.5 border-l border-white/12">
                <span>
                    {snapshot.published_at 
                        ? `Pub ${new Date(snapshot.published_at).toISOString().split('T')[0]}`
                        : 'Draft'}
                </span>
            </div>
        </div>
    );
};
