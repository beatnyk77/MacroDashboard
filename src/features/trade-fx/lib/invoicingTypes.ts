import type { VolatilityRegime } from './tradeFxTypes';

export type InvoicingCurrency = 'USD' | 'CNY' | 'INR';

export type MonthlyRatePoint = {
    month: string;
    usdInr: number;
    cnyInr: number;
};

export type CostComparatorInput = {
    monthlyImportValue: number;
    periodMonths: 12 | 24;
};

export type CostDataPoint = {
    month: string;
    usdInvoicedCostINR: number;
    cnyInvoicedCostINR: number;
    differenceINR: number;
    cumulativeDifferenceINR: number;
};

export type CostComparatorSummary = {
    totalExtraCostCNY: number;
    percentageDifference: number;
    worstMonthCNY: string;
    currentMonthDelta: number;
    verdictLabel: string;
};

export type CostComparatorResult = {
    period: string;
    dataPoints: CostDataPoint[];
    summary: CostComparatorSummary;
};

export type RegimeVerdict = {
    recommendation: 'maintain_usd' | 'monitor_cny' | 'neutral' | 'explore_inr';
    confidenceLevel: 'high' | 'moderate' | 'low';
    headline: string;
    rationale: string[];
    keyIndicatorsToWatch: string[];
    freshness: string;
};

export type DecisionFactor = {
    id: string;
    label: string;
    description: string;
    simpleWeight: number;
    userWeight: number;
    usdScore: number;
    cnyScore: number;
    inrScore: number;
    commentary: string;
    advancedNote: string;
};

export type ScenarioInput = {
    notionalMonthly: number;
    invoicingCurrency: InvoicingCurrency;
    cnyAppreciationPct: number;
    usdAppreciationPct: number;
    horizonMonths: number;
};

export type CollarHandoffParams = {
    notionalFC: number;
    currency: InvoicingCurrency;
    currentSpot: number;
    forwardRate: number;
    horizonMonths: number;
    suggestedFloor: number;
    suggestedCap: number;
};

export type ScenarioResult = {
    usdInvoicedTotalINR: number;
    cnyInvoicedTotalINR: number;
    inrInvoicedTotalINR: number;
    relativeCostDifference: number;
    verdict: string;
    collarHandoffParams: CollarHandoffParams;
};

export type InvoicingRegimeSignals = {
    cnyInrVolatilityRegime: VolatilityRegime;
    usdInrVolatilityRegime: VolatilityRegime;
    chinaMacroSentiment: 'supportive' | 'neutral' | 'cautionary';
    dedolSignal: 'strong' | 'moderate' | 'weak';
    rbiInterventionBias: 'supportive' | 'neutral' | 'cautionary';
    cnyInr24mAppreciation: number;
};

export type NaturalHedgePathway = {
    id: string;
    title: string;
    feasibility: 'low_medium' | 'medium' | 'medium_high';
    description: string;
    requirements: string[];
    gqSignal: string;
    gqSignalLink: string;
    cta: string;
    ctaPartner: 'skydo' | null;
};