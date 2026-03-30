import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, Database, History } from 'lucide-react';

interface DataProvenanceBadgeProps {
    source: string;
    methodology?: string;
    lastVerified?: string | Date | null;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const DataProvenanceBadge: React.FC<DataProvenanceBadgeProps> = ({
    source,
    methodology,
    lastVerified,
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

    return (
        <div className={cn(
            "inline-flex items-center rounded-full border border-white/12 bg-white/5 text-white/40 font-black uppercase tracking-widest",
            sizeClasses[size],
            className
        )}>
            <div className="flex items-center gap-1.5 border-r border-white/12 pr-2 mr-0.5">
                <ShieldCheck className={cn("text-emerald-500", iconSizes[size])} />
                <span className="text-white/60">{source}</span>
            </div>
            
            {methodology && (
                <div className="flex items-center gap-1.5 border-r border-white/12 pr-2 mr-0.5">
                    <Database className={iconSizes[size]} />
                    <span>{methodology}</span>
                </div>
            )}

            <div className="flex items-center gap-1.5">
                <History className={iconSizes[size]} />
                <span>
                    {lastVerified 
                        ? `Verified ${new Date(lastVerified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                        : 'Audit Pending'
                    }
                </span>
            </div>
        </div>
    );
};
