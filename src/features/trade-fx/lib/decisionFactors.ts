import type { DecisionFactor } from './invoicingTypes';

const FACTOR_DEFAULTS: Omit<DecisionFactor, 'userWeight'>[] = [
    {
        id: 'volatility_differential',
        label: 'Historical & expected volatility differential',
        description: 'CNY/INR vs USD/INR volatility over 24 months',
        simpleWeight: 9,
        usdScore: 5,
        cnyScore: 2,
        inrScore: 3,
        commentary:
            'CNY/INR has shown higher volatility than USD/INR over the last 24 months, driven by both China policy moves and RBI USD intervention. USD invoicing has provided more stable INR cost predictability.',
        advancedNote:
            'CNY/INR 24M realized vol approx 12–15% annualized vs USD/INR 6–8%. Hedging instrument availability for CNY is more limited in India — forward markets thinner, options pricing less competitive.',
    },
    {
        id: 'supplier_pricing_buffer',
        label: 'Supplier pricing buffer & negotiation leverage',
        description: 'Chinese suppliers typically price 2–5% cushion into USD quotes',
        simpleWeight: 7,
        usdScore: 4,
        cnyScore: 3,
        inrScore: 3,
        commentary:
            'Most Chinese exporters quote a USD price with an implicit FX buffer. Switching to CNY invoicing often does NOT reduce the invoice value by the same buffer — the supplier captures it as margin.',
        advancedNote:
            'Request parallel quotes in USD and CNY to benchmark the actual buffer. If CNY quote / current CNY/USD rate ≈ USD quote × 0.97–0.98, the supplier has shared ~2–3% buffer.',
    },
    {
        id: 'hedging_availability',
        label: 'Hedging instrument availability & cost',
        description: 'Forward and option availability for each currency in India',
        simpleWeight: 8,
        usdScore: 5,
        cnyScore: 2,
        inrScore: 4,
        commentary:
            'USD/INR forwards and options are liquid, competitively priced, and available from all major Indian banks. CNY/INR hedging is available but at wider spreads and shorter tenors.',
        advancedNote:
            'RBI guidelines govern CNY forward booking — check AD category bank limits. CNY/INR option market is thin; zero-cost collar structures may not be available at economically attractive terms.',
    },
    {
        id: 'payment_platform_friction',
        label: 'Payment platform & banking friction',
        description: 'Operational cost and convenience of each settlement path',
        simpleWeight: 5,
        usdScore: 5,
        cnyScore: 2,
        inrScore: 2,
        commentary:
            'USD settlement is standard — supported by all Indian banks and platforms like Skydo and Karbon. CNY settlement requires specialized banking channels and may incur higher correspondent fees.',
        advancedNote:
            'SWIFT MT 103 for CNY requires a CNY correspondent bank. Ask your bank for all-in cost including nostro charges, correspondent fees, and FX conversion margin.',
    },
    {
        id: 'accounting_treatment',
        label: 'Accounting & hedge accounting treatment',
        description: 'P&L volatility from revaluation under Ind AS / IFRS',
        simpleWeight: 6,
        usdScore: 4,
        cnyScore: 2,
        inrScore: 5,
        commentary:
            'Under Ind AS 21, foreign currency payables must be revalued at each balance sheet date. Higher CNY/INR volatility creates larger unrealized P&L swings.',
        advancedNote:
            'Hedge accounting designation (Ind AS 109) requires formal documentation and effectiveness testing. USD hedging documentation is well-established in India.',
    },
    {
        id: 'strategic_relationship',
        label: 'Strategic relationship & negotiation leverage',
        description: 'Long-term value of currency flexibility in supplier negotiations',
        simpleWeight: 4,
        usdScore: 4,
        cnyScore: 3,
        inrScore: 2,
        commentary:
            'USD invoicing gives access to a global benchmark rate and flexibility to compare suppliers across geographies. CNY invoicing creates bilateral dependency.',
        advancedNote:
            'If you are a significant buyer, negotiate currency clause flexibility — ability to switch between USD and CNY based on a pre-agreed trigger.',
    },
    {
        id: 'dedol_inr_feasibility',
        label: 'De-dollarization / INR invoicing feasibility',
        description: 'Viability of settling China trade in INR via emerging corridors',
        simpleWeight: 3,
        usdScore: 3,
        cnyScore: 3,
        inrScore: 2,
        commentary:
            'India-China INR settlement corridors are emerging but not yet operationally mainstream for most SME importers. Currently rated low-medium feasibility for China corridor.',
        advancedNote:
            'RBI has been expanding the list of banks authorized for INR trade settlement. Feasibility depends on your Chinese supplier\'s bank having an INR Vostro account.',
    },
];

export const DEFAULT_DECISION_FACTORS: DecisionFactor[] = FACTOR_DEFAULTS.map((f) => ({
    ...f,
    userWeight: f.simpleWeight,
}));

export function createDefaultFactors(): DecisionFactor[] {
    return DEFAULT_DECISION_FACTORS.map((f) => ({ ...f }));
}

export function getTopFactors(
    factors: DecisionFactor[],
    count = 3,
): DecisionFactor[] {
    return [...factors]
        .sort((a, b) => b.simpleWeight * Math.max(b.usdScore - b.cnyScore, 0) - a.simpleWeight * Math.max(a.usdScore - a.cnyScore, 0))
        .slice(0, count);
}

export function getRecommendedCurrency(scores: {
    usd: number;
    cny: number;
    inr: number;
}): 'USD' | 'CNY' | 'INR' {
    if (scores.usd >= scores.cny && scores.usd >= scores.inr) return 'USD';
    if (scores.cny >= scores.inr) return 'CNY';
    return 'INR';
}