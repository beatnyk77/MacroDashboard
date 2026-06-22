import React from 'react';
import { TrailNavLink } from '@/components/TrailLink';
import { FreshnessChip } from '@/components/FreshnessChip';
import { resolveWeekendFreshness } from '@/lib/marketFreshness';
import { cn } from '@/lib/utils';
import { JargonTooltip } from './JargonTooltip';
import { MACRO_HEDGING_IMPLICATIONS } from '../constants/macroHedgingImplications';
import type { MacroRegimeSignal, Role, TimeHorizon } from '../lib/tradeFxTypes';

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

function renderDetailWithJargon(detail: string, source: MacroRegimeSignal['source']): React.ReactNode {
    if (source === 'india_pulse' && /reserves/i.test(detail)) {
        const parts = detail.split(/(reserves)/i);
        return parts.map((part, i) =>
            part.toLowerCase() === 'reserves' ? (
                <JargonTooltip key={i} term="reserves buffer">
                    {part}
                </JargonTooltip>
            ) : (
                <React.Fragment key={i}>{part}</React.Fragment>
            ),
        );
    }
    if (source === 'dedol_lab' && /corridor/i.test(detail)) {
        const parts = detail.split(/(corridors?)/i);
        return parts.map((part, i) =>
            /^corridors?$/i.test(part) ? (
                <JargonTooltip key={i} term="de-dollarisation corridor">
                    {part}
                </JargonTooltip>
            ) : (
                <React.Fragment key={i}>{part}</React.Fragment>
            ),
        );
    }
    return detail;
}

function handleCtaClick(scrollTarget: string, onHorizonChange?: (h: TimeHorizon) => void, horizon?: TimeHorizon) {
    if (horizon && onHorizonChange) {
        onHorizonChange(horizon);
    }
    document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

interface MacroDriversPanelProps {
    signals: MacroRegimeSignal[];
    role: Role;
    onHorizonChange?: (horizon: TimeHorizon) => void;
    className?: string;
}

export const MacroDriversPanel: React.FC<MacroDriversPanelProps> = ({
    signals,
    role,
    onHorizonChange,
    className,
}) => (
    <aside className={cn('space-y-3', className)}>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0">
            Macro Drivers
        </h2>
        {signals.map((signal) => {
            const styles = SENTIMENT_STYLES[signal.sentiment];
            const freshness = resolveWeekendFreshness(signal.staleness, signal.freshness);
            const implication = MACRO_HEDGING_IMPLICATIONS[signal.source];

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
                            status={freshness.status}
                            lastUpdated={signal.freshness}
                            label={freshness.label}
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
                        {renderDetailWithJargon(signal.detail, signal.source)}
                    </p>

                    <p className="text-xs text-amber-400/80 mt-2 italic border-t border-white/5 pt-2 m-0 leading-relaxed">
                        {implication.hedgingImplication[role]}
                    </p>

                    {implication.collarCTA ? (
                        <button
                            type="button"
                            onClick={() =>
                                handleCtaClick(
                                    implication.collarCTA!.scrollTarget,
                                    onHorizonChange,
                                    implication.collarCTA!.horizon,
                                )
                            }
                            className="text-xs text-[#B8860B] underline mt-1 block text-left hover:text-[#D4A017] transition-colors bg-transparent border-0 p-0 cursor-pointer"
                        >
                            {implication.collarCTA.label}
                        </button>
                    ) : null}

                    {signal.source === 'dedol_lab' ? (
                        <a
                            href="#invoicing-framework"
                            className="text-xs text-[#B8860B]/90 underline mt-1 block hover:text-[#D4A017] transition-colors"
                        >
                            China importers: see Invoicing Currency Decision Framework ↓
                        </a>
                    ) : null}

                    <TrailNavLink
                        to={signal.link}
                        className="text-[10px] font-black uppercase tracking-wider text-[#B8860B]/80 hover:text-[#B8860B] transition-colors mt-2 inline-block"
                    >
                        View pulse →
                    </TrailNavLink>
                </article>
            );
        })}
    </aside>
);