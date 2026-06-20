import type { HedgingArchetype, Role, VolatilityRegime } from './tradeFxTypes';

export const HEDGING_ARCHETYPES: HedgingArchetype[] = [
    {
        id: 'natural',
        name: 'Natural / Structural Hedge',
        typicalRegimeFit: 'Strong when INR invoicing or matching payables possible',
        protectionLevel: 'high',
        costDrag: 'lowest',
        upsideParticipation: 'full',
        keyMacroTrigger: 'De-Dollarization Pulse shows viable INR settlement corridors',
        regimeFilter: () => true,
        partnerCTA: 'Explore INR invoicing support',
        partnerCTALabel: 'Explore with Skydo',
    },
    {
        id: 'full_forward',
        name: 'Full Forward Contract',
        typicalRegimeFit: 'Elevated volatility or clear directional pressure',
        protectionLevel: 'high',
        costDrag: 'moderate',
        upsideParticipation: 'none',
        keyMacroTrigger: 'India Pulse + RBI intervention bias + low-vol regime',
        regimeFilter: (regime) => regime === 'low' || regime === 'moderate',
        partnerCTA: 'Discuss forward booking with partner bank',
        partnerCTALabel: 'Request Bank Intro',
    },
    {
        id: 'partial_hedge',
        name: 'Partial Hedge + Active Monitor',
        typicalRegimeFit: 'Balanced regime or uncertain outlook',
        protectionLevel: 'medium',
        costDrag: 'low',
        upsideParticipation: 'partial',
        keyMacroTrigger: 'Mixed signals across US/India pulses',
        regimeFilter: (regime) => regime === 'moderate',
        partnerCTA: 'Set alert + review in 2 weeks',
        partnerCTALabel: 'Set Rate Alert',
    },
    {
        id: 'zero_collar',
        name: 'Zero-Cost Collar / Put Spread',
        typicalRegimeFit: 'Want downside protection without full premium outlay',
        protectionLevel: 'high',
        costDrag: 'lowest',
        upsideParticipation: 'capped',
        keyMacroTrigger: 'Rising volatility regime + exporter-favorable macro',
        regimeFilter: (regime) => regime === 'low' || regime === 'moderate',
        partnerCTA: 'Structure collar via partner desk',
        partnerCTALabel: 'Request Collar Pricing',
    },
    {
        id: 'standalone_put',
        name: 'Standalone Put Option',
        typicalRegimeFit: 'High-conviction protection needed; willing to pay premium',
        protectionLevel: 'high',
        costDrag: 'premium',
        upsideParticipation: 'full',
        keyMacroTrigger: 'Sharp move expected or event risk (policy dates)',
        regimeFilter: (regime) => regime === 'elevated' || regime === 'high',
        partnerCTA: 'Price protective options',
        partnerCTALabel: 'Request Options Pricing',
    },
];

export type ArchetypeFitLevel = 'high' | 'medium' | 'low';

const FIT_LEVEL_ORDER: Record<ArchetypeFitLevel, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

export function getArchetypeFitLevel(
    archetype: HedgingArchetype,
    regime: VolatilityRegime,
    role: Role,
): ArchetypeFitLevel {
    if (!archetype.regimeFilter(regime, role)) return 'low';
    if (archetype.id === 'natural') return 'medium';
    return 'high';
}

export function getArchetypeFitScore(
    archetype: HedgingArchetype,
    regime: VolatilityRegime,
    role: Role,
): number {
    return archetype.regimeFilter(regime, role) ? 1 : 0;
}

export function sortArchetypesByFit(
    regime: VolatilityRegime,
    role: Role,
): HedgingArchetype[] {
    return [...HEDGING_ARCHETYPES].sort((a, b) => {
        const levelA = FIT_LEVEL_ORDER[getArchetypeFitLevel(a, regime, role)];
        const levelB = FIT_LEVEL_ORDER[getArchetypeFitLevel(b, regime, role)];
        return levelB - levelA;
    });
}

export const TRADE_FX_AFFILIATE_CTA_ID = 'trade-fx-affiliate-cta';

export function scrollToAffiliateCta(): void {
    document.getElementById(TRADE_FX_AFFILIATE_CTA_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
    });
}