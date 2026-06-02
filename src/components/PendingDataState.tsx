import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PendingDataStateProps {
    height?: number;
    accentColor?: 'amber' | 'blue' | 'rose';
    statusText: string;
    onRetry?: () => void;
}

const ACCENT: Record<
    NonNullable<PendingDataStateProps['accentColor']>,
    { badge: string; bar: string; button: string; icon: string }
> = {
    amber: {
        badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        bar: 'bg-amber-500/20',
        button: 'border-amber-500/20 text-amber-400 hover:bg-amber-500/10',
        icon: 'text-amber-400',
    },
    blue: {
        badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        bar: 'bg-blue-500/20',
        button: 'border-blue-500/20 text-blue-400 hover:bg-blue-500/10',
        icon: 'text-blue-400',
    },
    rose: {
        badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        bar: 'bg-rose-500/20',
        button: 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10',
        icon: 'text-rose-400',
    },
};

const BAR_WIDTHS = ['75%', '55%', '88%', '42%'];

export const PendingDataState: React.FC<PendingDataStateProps> = ({
    height = 400,
    accentColor = 'amber',
    statusText,
    onRetry,
}) => {
    const accent = ACCENT[accentColor];

    return (
        <div
            className="flex flex-col items-center justify-center bg-black/40 border border-white/[0.07] rounded-[2.5rem] backdrop-blur-3xl px-8 py-10"
            style={{ height }}
        >
            {/* Skeleton bars */}
            <div className="w-full max-w-sm flex flex-col gap-4 mb-8">
                {BAR_WIDTHS.map((w, i) => (
                    <div
                        key={i}
                        className={cn('h-5 rounded-full animate-pulse', accent.bar)}
                        style={{
                            width: w,
                            animationDelay: `${i * 120}ms`,
                            opacity: 0.5 + (i % 2) * 0.2,
                        }}
                    />
                ))}
            </div>

            {/* Status badge */}
            <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest mb-4',
                accent.badge,
            )}>
                <Clock className={cn('w-3 h-3 shrink-0', accent.icon)} />
                <span>{statusText}</span>
            </div>

            {/* Retry button */}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className={cn(
                        'flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors',
                        accent.button,
                    )}
                >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                </button>
            )}
        </div>
    );
};
