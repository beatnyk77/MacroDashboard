import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw, Info } from 'lucide-react';
import { useRegimeInterpretations } from '@/hooks/useRegimeInterpretations';
import { DataQualityBadge } from './DataQualityBadge';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    description?: string;
    interpretations?: string[];
    onRefresh?: () => void;
    isLoading?: boolean;
    lastUpdated?: Date | string | null;
    exportId?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    sectionId?: string;
    level?: 'h1' | 'h2';
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    interpretations,
    onRefresh,
    isLoading,
    lastUpdated,
    sectionId,
    level = 'h2',
    className
}) => {
    const dynamicInterpretations = useRegimeInterpretations(sectionId || '');
    const activeInterpretations = interpretations || (sectionId ? dynamicInterpretations : []);
    const HeadingTag = level;

    return (
        <div className={cn("flex flex-col gap-6 mb-12 group", className)}>
            <div className="flex items-end justify-between border-l-4 border-blue-500 pl-6 py-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <HeadingTag className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
                            {title}
                        </HeadingTag>
                        {lastUpdated && (
                            <div className="hidden md:block">
                                <DataQualityBadge timestamp={lastUpdated} size="small" />
                            </div>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-[0.05em]">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[0.65rem] font-black text-muted-foreground hover:text-primary hover:bg-white/10 transition-all active:scale-95"
                        >
                            <RefreshCw size={14} className={cn(isLoading && "animate-spin text-blue-400")} />
                            REFRESH SIGNAL
                        </button>
                    )}
                </div>
            </div>

            {activeInterpretations && activeInterpretations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeInterpretations.map((text, i) => (
                        <div key={i} className="relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10 backdrop-blur-sm group/item hover:bg-blue-500/[0.05] transition-colors">
                            <div className="mt-1 shrink-0 p-1 rounded-md bg-blue-500/10 text-blue-400">
                                <Info size={12} />
                            </div>
                            <p className="text-xs text-blue-100/70 leading-relaxed font-semibold">
                                {text}
                            </p>
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                        </div>
                    ))}
                </div>
            )}

            <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
        </div>
    );
};
