import React from 'react';
import { TrailNavLink } from '@/components/TrailLink';
import { FreshnessChip } from '@/components/FreshnessChip';
import { cn } from '@/lib/utils';
import type { MacroRegimeSignal } from '../lib/tradeFxTypes';

const SOURCE_LABELS: Record<MacroRegimeSignal['source'], string> = {
    india_pulse: 'India Pulse',
    us_pulse: 'US Pulse',
    dedol_lab: 'De-Dol Lab',
    commodities: 'Commodities',
    currency_wars: 'Currency Wars',
};

const SENTIMENT_STYLES: Record<
    MacroRegimeSignal['sentiment'],
    { badge: string; border: string }
> = {
    supportive: {
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        border: 'border-l-emerald-500/50',
    },
    neutral: {
        badge: 'bg-amber-500/10 text-amber-400/90 border-amber-500/25',
        border: 'border-l-amber-500/40',
    },
    cautionary: {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        border: 'border-l-rose-500/50',
    },
};

interface MacroDriversPanelProps {
    signals: MacroRegimeSignal[];
    className?: string;
}

export const MacroDriversPanel: React.FC<MacroDriversPanelProps> = ({
    signals,
    className,
}) => (
    <aside className={cn('space-y-3', className)}>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0">
            Macro Drivers
        </h2>
        {signals.map((signal) => {
            const styles = SENTIMENT_STYLES[signal.sentiment];
            return (
                <article
                    key={signal.source}
                    className={cn(
                        'border border-white/10 bg-white/[0.02] rounded-xl px-4 py-3 border-l-2',
                        styles.border,
                    )}
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                            {SOURCE_LABELS[signal.source]}
                        </span>
                        <FreshnessChip
                            status={signal.staleness}
                            lastUpdated={signal.freshness}
                        />
                    </div>

                    <h3 className="text-xs font-black text-white/85 mb-1.5 m-0">
                        {signal.label}
                    </h3>

                    <span
                        className={cn(
                            'inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border mb-2',
                            styles.badge,
                        )}
                    >
                        {signal.sentiment}
                    </span>

                    <p className="text-[11px] text-white/50 leading-relaxed m-0 mb-2">
                        {signal.detail}
                    </p>

                    <TrailNavLink
                        to={signal.link}
                        className="text-[10px] font-black uppercase tracking-wider text-[#B8860B]/80 hover:text-[#B8860B] transition-colors"
                    >
                        View pulse →
                    </TrailNavLink>
                </article>
            );
        })}
    </aside>
);