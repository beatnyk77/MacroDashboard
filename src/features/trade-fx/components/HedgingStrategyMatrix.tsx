import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { JargonTooltip } from './JargonTooltip';
import {
    getArchetypeFitLevel,
    scrollToAffiliateCta,
    scrollToArchetypeCard,
    sortArchetypesByFit,
    type ArchetypeFitLevel,
} from '../lib/hedgingArchetypes';
import type { HedgingArchetype, Role, VolatilityRegime } from '../lib/tradeFxTypes';

const MATRIX_COLUMNS = ['Strategy', 'Protection', 'Cost', 'Upside', 'Regime Fit'] as const;

const FIT_BADGE_STYLES: Record<ArchetypeFitLevel, string> = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/10 text-amber-400/90 border-amber-500/25',
    low: 'bg-white/5 text-white/35 border-white/10',
};

const PROTECTION_STYLES: Record<HedgingArchetype['protectionLevel'], string> = {
    high: 'text-emerald-400/90',
    medium: 'text-amber-400/90',
    low: 'text-white/45',
};

const ROLE_CONTEXT: Record<HedgingArchetype['id'], Record<Role, string>> = {
    natural: {
        exporter:
            'Long USD receivables: structural INR invoicing or payable matching reduces net FC exposure without derivatives.',
        importer:
            'Short USD payables: align procurement with INR revenue or local sourcing to offset currency mismatch.',
        balanced:
            'Exporters: match receivables with payables. Importers: offset USD payables via INR revenue streams.',
    },
    full_forward: {
        exporter:
            'Lock USD/INR on confirmed receivables; forgo spot upside but eliminate settlement uncertainty.',
        importer:
            'Fix payable rate on committed USD imports; accept forward premium in exchange for budget certainty.',
        balanced:
            'Exporters lock receivable rates; importers fix payable rates — both sacrifice spot participation for certainty.',
    },
    partial_hedge: {
        exporter:
            'Hedge a defined share of receivables; retain spot exposure on balance while monitoring regime signals.',
        importer:
            'Cover core payable tranches; leave tactical purchases open to INR appreciation scenarios.',
        balanced:
            'Split exposure: hedge committed flows, monitor GraphiQuestor pulses for incremental booking decisions.',
    },
    zero_collar: {
        exporter:
            'Protect receivable floor via put structure; cap participation above strike — common when premium outlay is constrained.',
        importer:
            'Cap payable escalation via call structure; forgo deep INR appreciation savings below put strike.',
        balanced:
            'Exporters: floor protection with capped upside. Importers: ceiling on payables with limited downside savings.',
    },
    standalone_put: {
        exporter:
            'Pay premium for asymmetric protection on receivables while retaining full spot upside above strike.',
        importer:
            'Less common for importers; call options or forwards typically preferred for payable rate caps.',
        balanced:
            'Exporters: premium put for tail protection. Importers: consider call structures or forwards for payables.',
    },
};

function formatRegimeLabel(regime: VolatilityRegime): string {
    if (regime === 'low') return 'low-volatility';
    if (regime === 'moderate') return 'moderate-volatility';
    if (regime === 'elevated') return 'elevated-volatility';
    return 'high-volatility';
}

function ProtectionBadge({ level }: { level: HedgingArchetype['protectionLevel'] }) {
    return (
        <span className={cn('text-[10px] font-black uppercase', PROTECTION_STYLES[level])}>
            {level}
        </span>
    );
}

function RegimeFitBadge({ fit }: { fit: ArchetypeFitLevel }) {
    return (
        <span
            className={cn(
                'text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border',
                FIT_BADGE_STYLES[fit],
            )}
        >
            {fit}
        </span>
    );
}

function renderMacroTrigger(trigger: string, archetypeId: string): React.ReactNode {
    if (archetypeId === 'full_forward') {
        return (
            <>
                India Pulse + RBI intervention bias +{' '}
                <JargonTooltip term="volatility regime">low-vol regime</JargonTooltip>
            </>
        );
    }
    if (archetypeId === 'zero_collar') {
        return (
            <>
                Rising <JargonTooltip term="volatility regime">volatility regime</JargonTooltip> +
                exporter-favorable macro
            </>
        );
    }
    if (trigger.includes('hedging windows') || trigger.includes('hedging window')) {
        return trigger.replace(
            /hedging windows?/i,
            (match) => `<hedging>${match}</hedging>`,
        ) === trigger ? (
            trigger
        ) : (
            <>
                {trigger.split(/(hedging windows?)/i).map((part, i) =>
                    /^hedging windows?$/i.test(part) ? (
                        <JargonTooltip key={i} term="hedging window">
                            {part}
                        </JargonTooltip>
                    ) : (
                        <React.Fragment key={i}>{part}</React.Fragment>
                    ),
                )}
            </>
        );
    }
    return trigger;
}

interface HedgingStrategyMatrixProps {
    role: Role;
    volatilityRegime: VolatilityRegime;
    className?: string;
}

interface ArchetypeCardProps {
    archetype: HedgingArchetype;
    role: Role;
    volatilityRegime: VolatilityRegime;
}

const ArchetypeCard: React.FC<ArchetypeCardProps> = ({
    archetype,
    role,
    volatilityRegime,
}) => {
    const fitLevel = getArchetypeFitLevel(archetype, volatilityRegime, role);
    const isLowFit = fitLevel === 'low';
    const roleContext = ROLE_CONTEXT[archetype.id]?.[role] ?? archetype.typicalRegimeFit;

    const card = (
        <article
            id={`archetype-${archetype.id}`}
            className={cn(
                'relative flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-5 transition-opacity scroll-mt-28',
                isLowFit && 'opacity-50',
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-black text-white/90 m-0 leading-snug pr-2">
                    {archetype.id === 'zero_collar' ? (
                        <JargonTooltip term="zero-cost collar">{archetype.name}</JargonTooltip>
                    ) : (
                        archetype.name
                    )}
                </h3>
                <span
                    className={cn(
                        'shrink-0 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300/80',
                    )}
                >
                    <BookOpen size={10} aria-hidden />
                    Educational only
                </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
                <span
                    className={cn(
                        'text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border',
                        FIT_BADGE_STYLES[fitLevel],
                    )}
                >
                    {fitLevel} regime fit
                </span>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 bg-white/[0.03] text-white/40">
                    Protection:{' '}
                    <span className={PROTECTION_STYLES[archetype.protectionLevel]}>
                        {archetype.protectionLevel}
                    </span>
                </span>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 bg-white/[0.03] text-white/40">
                    Cost: {archetype.costDrag}
                </span>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 bg-white/[0.03] text-white/40">
                    Upside: {archetype.upsideParticipation}
                </span>
            </div>

            <p className="text-[11px] text-white/55 leading-relaxed m-0 mb-2">
                <span className="text-white/35 font-bold uppercase tracking-wider text-[9px] mr-1">
                    Macro trigger:
                </span>
                {renderMacroTrigger(archetype.keyMacroTrigger, archetype.id)}
            </p>

            <p className="text-[11px] text-white/45 leading-relaxed m-0 mb-2">
                <span className="text-white/35 font-bold uppercase tracking-wider text-[9px] mr-1">
                    Typically used when:
                </span>
                {archetype.typicalRegimeFit}
            </p>

            <p className="text-[11px] text-white/50 leading-relaxed m-0 mb-3 flex-1">
                {roleContext}
            </p>

            <details className="mt-2 mb-4">
                <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
                    Notes for treasury teams ↓
                </summary>
                <p className="text-xs text-white/40 mt-2 pl-2 border-l border-white/10 m-0 leading-relaxed">
                    {archetype.id === 'full_forward' ? (
                        <>
                            Pricing uses <JargonTooltip term="forward rate">forward points</JargonTooltip>{' '}
                            based on interest rate differential (India vs US). Monitor forward premium
                            erosion on longer tenors.
                        </>
                    ) : (
                        archetype.treasuryNote
                    )}
                </p>
            </details>

            <button
                type="button"
                onClick={scrollToAffiliateCta}
                className="w-full mt-auto px-4 py-2.5 rounded-lg border border-[#B8860B]/40 bg-[#B8860B]/10 text-[10px] font-black uppercase tracking-wider text-[#B8860B] hover:bg-[#B8860B]/20 transition-colors"
            >
                {archetype.partnerCTALabel}
            </button>
        </article>
    );

    if (!isLowFit) return card;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="cursor-help">{card}</div>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="max-w-[240px] bg-slate-950 border-white/10 text-[11px] text-white/70"
            >
                Less commonly considered in current {formatRegimeLabel(volatilityRegime)} regime.
            </TooltipContent>
        </Tooltip>
    );
};

export const HedgingStrategyMatrix: React.FC<HedgingStrategyMatrixProps> = ({
    role,
    volatilityRegime,
    className,
}) => {
    const sortedArchetypes = useMemo(
        () => sortArchetypesByFit(volatilityRegime, role),
        [volatilityRegime, role],
    );

    return (
        <section className={cn('space-y-4', className)}>
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0 mb-1">
                    Hedging Strategy Matrix
                </h2>
                <p className="text-[11px] text-white/40 m-0 leading-relaxed">
                    Archetypes commonly considered by market participants in a{' '}
                    <JargonTooltip term="volatility regime">
                        <span className="text-white/55">{formatRegimeLabel(volatilityRegime)}</span>
                    </JargonTooltip>{' '}
                    regime — ordered by illustrative fit, not recommendation.
                </p>
            </div>

            <div className="overflow-x-auto mb-6">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/10 text-white/40 text-left">
                            {MATRIX_COLUMNS.map((col) => (
                                <th
                                    key={col}
                                    className="py-2 pr-4 font-medium uppercase tracking-wider"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedArchetypes.map((archetype) => {
                            const fitLevel = getArchetypeFitLevel(
                                archetype,
                                volatilityRegime,
                                role,
                            );
                            return (
                                <tr
                                    key={archetype.id}
                                    className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                                    onClick={() => scrollToArchetypeCard(archetype.id)}
                                >
                                    <td className="py-2 pr-4 text-white font-medium">
                                        {archetype.name}
                                    </td>
                                    <td className="py-2 pr-4">
                                        <ProtectionBadge level={archetype.protectionLevel} />
                                    </td>
                                    <td className="py-2 pr-4 text-white/45">{archetype.costDrag}</td>
                                    <td className="py-2 pr-4 text-white/45">
                                        {archetype.upsideParticipation}
                                    </td>
                                    <td className="py-2 pr-4">
                                        <RegimeFitBadge fit={fitLevel} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <p className="text-xs text-white/30 mt-2 m-0">
                    Click any row to see detailed context. Ordered by illustrative regime fit — not
                    a recommendation.
                </p>
            </div>

            <TooltipProvider delayDuration={200}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedArchetypes.map((archetype) => (
                        <ArchetypeCard
                            key={archetype.id}
                            archetype={archetype}
                            role={role}
                            volatilityRegime={volatilityRegime}
                        />
                    ))}
                </div>
            </TooltipProvider>
        </section>
    );
};