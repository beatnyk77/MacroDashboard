import React from 'react';
import { cn } from '@/lib/utils';

interface LiveStatusIndicatorProps {
    source: string;
    className?: string;
}

export const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({ source, className }) => {
    return (
        <div className={cn("inline-flex items-center gap-2", className)}>
            <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            </div>
            <span className="text-[0.6rem] font-bold text-emerald-400 uppercase tracking-widest leading-none pt-[1px]">
                Live: Connected to {source}
            </span>
        </div>
    );
};
