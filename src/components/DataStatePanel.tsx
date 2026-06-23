import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PendingDataState } from '@/components/PendingDataState';

type DataStateVariant = 'empty' | 'error' | 'pending';

interface DataStatePanelProps {
    variant: DataStateVariant;
    title: string;
    description?: string;
    onRetry?: () => void;
    height?: number;
    accentColor?: 'amber' | 'blue' | 'rose';
    compact?: boolean;
    className?: string;
}

const ACCENT_DOT: Record<NonNullable<DataStatePanelProps['accentColor']>, string> = {
    amber: 'bg-amber-400/60',
    blue: 'bg-blue-400/60',
    rose: 'bg-rose-400/60',
};

export const DataStatePanel: React.FC<DataStatePanelProps> = ({
    variant,
    title,
    description,
    onRetry,
    height = 200,
    accentColor = 'blue',
    compact = false,
    className,
}) => {
    if (variant === 'pending') {
        return (
            <PendingDataState
                height={height}
                accentColor={accentColor}
                statusText={title}
                onRetry={onRetry}
            />
        );
    }

    if (compact) {
        return (
            <div className={cn('flex items-center gap-2', className)} role="status">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                <div>
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                    {description && (
                        <span className="text-xs text-muted-foreground/55 ml-1">— {description}</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-black/20 px-8 py-10',
                className
            )}
            style={{ minHeight: height }}
            role="status"
        >
            <div className={cn('w-2 h-2 rounded-full mb-4', ACCENT_DOT[accentColor])} />
            <h4 className="text-sm font-semibold text-foreground/90 mb-1">{title}</h4>
            {description && (
                <p className="text-xs text-muted-foreground/60 text-center max-w-sm leading-relaxed">
                    {description}
                </p>
            )}
            {onRetry && variant === 'error' && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors duration-200"
                >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                </button>
            )}
        </div>
    );
};