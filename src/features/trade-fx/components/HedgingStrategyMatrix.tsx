import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    getArchetypeFitLevel,
    scrollToAffiliateCta,
    sortArchetypesByFit,
    type ArchetypeFitLevel,
} from '../lib/hedgingArchetypes';
import type { HedgingArchetype, Role, VolatilityRegime } from '../lib/tradeFxTypes';

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
            className={cn(
                'relative flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-5 transition-opacity',
                isLowFit && 'opacity-50',
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-black text-white/90 m-0 leading-snug pr-2">
                    {archetype.name}
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
                {archetype.keyMacroTrigger}
            </p>

            <p className="text-[11px] text-white/45 leading-relaxed m-0 mb-2">
                <span className="text-white/35 font-bold uppercase tracking-wider text-[9px] mr-1">
                    Commonly considered when:
                </span>
                {archetype.typicalRegimeFit}
            </p>

            <p className="text-[11px] text-white/50 leading-relaxed m-0 mb-4 flex-1">
                {roleContext}
            </p>

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
                    <span className="text-white/55">{formatRegimeLabel(volatilityRegime)}</span>{' '}
                    regime — ordered by illustrative fit, not recommendation.
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