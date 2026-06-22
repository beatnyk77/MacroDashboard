import { formatInrIndian } from './formatInr';
import type {
    CollarHandoffParams,
    CostComparatorInput,
    CostComparatorResult,
    DecisionFactor,
    MonthlyRatePoint,
    ScenarioInput,
    ScenarioResult,
} from './invoicingTypes';
import type { VolatilityRegime } from './tradeFxTypes';

function formatMonthLabel(month: string): string {
    const [year, mon] = month.split('-');
    const date = new Date(Number(year), Number(mon) - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function sliceRates(rates: MonthlyRatePoint[], periodMonths: 12 | 24): MonthlyRatePoint[] {
    if (rates.length <= periodMonths) return rates;
    return rates.slice(-periodMonths);
}

/**
 * Calculates side-by-side monthly INR cost for USD vs CNY invoicing
 * using actual historical rate data.
 */
export function calculateHistoricalCostComparison(
    input: CostComparatorInput,
    historicalRates: MonthlyRatePoint[],
): CostComparatorResult {
    const window = sliceRates(historicalRates, input.periodMonths);
    if (window.length === 0) {
        return {
            period: '—',
            dataPoints: [],
            summary: {
                totalExtraCostCNY: 0,
                percentageDifference: 0,
                worstMonthCNY: '—',
                currentMonthDelta: 0,
                verdictLabel: 'Insufficient rate history for comparison.',
            },
        };
    }

    const base = window[0];
    let cumulative = 0;
    let worstDelta = -Infinity;
    let worstMonth = base.month;

    const dataPoints = window.map((row) => {
        const usdInvoicedCostINR =
            input.monthlyImportValue * (row.usdInr / base.usdInr);
        const cnyInvoicedCostINR =
            input.monthlyImportValue * (row.cnyInr / base.cnyInr);
        const differenceINR = cnyInvoicedCostINR - usdInvoicedCostINR;
        cumulative += differenceINR;

        if (differenceINR > worstDelta) {
            worstDelta = differenceINR;
            worstMonth = row.month;
        }

        return {
            month: row.month,
            usdInvoicedCostINR,
            cnyInvoicedCostINR,
            differenceINR,
            cumulativeDifferenceINR: cumulative,
        };
    });

    const totalExtraCostCNY = cumulative;
    const last = dataPoints[dataPoints.length - 1];
    const totalUsd = dataPoints.reduce((s, d) => s + d.usdInvoicedCostINR, 0);
    const percentageDifference =
        totalUsd > 0 ? (totalExtraCostCNY / totalUsd) * 100 : 0;

    const savedLabel = formatInrIndian(Math.abs(totalExtraCostCNY), false);
    const verdictLabel =
        totalExtraCostCNY > 0
            ? `USD invoicing saved ${savedLabel} over ${input.periodMonths} months vs CNY invoicing`
            : totalExtraCostCNY < 0
              ? `CNY invoicing saved ${savedLabel} over ${input.periodMonths} months vs USD invoicing`
              : 'USD and CNY invoicing costs were equivalent over this period';

    return {
        period: `${formatMonthLabel(window[0].month)} – ${formatMonthLabel(window[window.length - 1].month)}`,
        dataPoints,
        summary: {
            totalExtraCostCNY,
            percentageDifference,
            worstMonthCNY: worstMonth,
            currentMonthDelta: last?.differenceINR ?? 0,
            verdictLabel,
        },
    };
}

/**
 * Generates scenario P&L under different invoicing currencies.
 */
export function calculateInvoicingScenario(
    input: ScenarioInput,
    currentRates: { usdInr: number; cnyInr: number },
): ScenarioResult {
    const horizon = input.horizonMonths;
    const baseMonthlyInr = input.notionalMonthly;

    const usdFactor = 1 + input.usdAppreciationPct / 100;
    const cnyFactor = 1 + input.cnyAppreciationPct / 100;

    const usdInvoicedTotalINR =
        baseMonthlyInr * horizon * usdFactor;
    const cnyInvoicedTotalINR =
        baseMonthlyInr * horizon * cnyFactor;
    const inrInvoicedTotalINR = baseMonthlyInr * horizon;

    const relativeCostDifference = cnyInvoicedTotalINR - usdInvoicedTotalINR;

    let verdict: string;
    if (usdInvoicedTotalINR < cnyInvoicedTotalINR) {
        verdict = `Under these assumptions, USD invoicing costs ${formatInrIndian(usdInvoicedTotalINR, false)} over ${horizon} months — ${formatInrIndian(relativeCostDifference, false)} less than CNY invoicing.`;
    } else if (cnyInvoicedTotalINR < usdInvoicedTotalINR) {
        verdict = `Under these assumptions, CNY invoicing costs ${formatInrIndian(cnyInvoicedTotalINR, false)} over ${horizon} months — ${formatInrIndian(Math.abs(relativeCostDifference), false)} less than USD invoicing.`;
    } else {
        verdict = `USD and CNY invoicing costs are equivalent under these assumptions over ${horizon} months.`;
    }

    return {
        usdInvoicedTotalINR,
        cnyInvoicedTotalINR,
        inrInvoicedTotalINR,
        relativeCostDifference,
        verdict,
        collarHandoffParams: deriveCollarHandoffParams(input, currentRates),
    };
}

/**
 * Scores each invoicing currency on each decision factor.
 * Normalized to 0–100 for each currency.
 */
export function calculateDecisionScore(factors: DecisionFactor[]): {
    usd: number;
    cny: number;
    inr: number;
} {
    const weightSum = factors.reduce((s, f) => s + f.userWeight, 0);
    if (weightSum === 0) return { usd: 0, cny: 0, inr: 0 };

    const rawUsd = factors.reduce((s, f) => s + f.userWeight * f.usdScore, 0) / weightSum;
    const rawCny = factors.reduce((s, f) => s + f.userWeight * f.cnyScore, 0) / weightSum;
    const rawInr = factors.reduce((s, f) => s + f.userWeight * f.inrScore, 0) / weightSum;

    return {
        usd: Math.round((rawUsd / 5) * 100),
        cny: Math.round((rawCny / 5) * 100),
        inr: Math.round((rawInr / 5) * 100),
    };
}

/**
 * Derives collar handoff parameters from scenario inputs.
 */
export function deriveCollarHandoffParams(
    scenario: ScenarioInput,
    currentRates: { usdInr: number; cnyInr: number },
): CollarHandoffParams {
    const spot =
        scenario.invoicingCurrency === 'CNY'
            ? currentRates.cnyInr
            : currentRates.usdInr;
    const forwardRate = spot * (1 + scenario.usdAppreciationPct / 100 / 12);

    return {
        notionalFC: scenario.notionalMonthly * scenario.horizonMonths,
        currency: scenario.invoicingCurrency,
        currentSpot: spot,
        forwardRate,
        horizonMonths: scenario.horizonMonths,
        suggestedFloor: Number((spot * 0.97).toFixed(4)),
        suggestedCap: Number((spot * 1.03).toFixed(4)),
    };
}

export function computeCnyInrAppreciation(
    rates: MonthlyRatePoint[],
    fromMonth: string,
    toMonth: string,
): number {
    const from = rates.find((r) => r.month === fromMonth);
    const to = rates.find((r) => r.month === toMonth);
    if (!from || !to || from.cnyInr <= 0) return 0;
    return ((to.cnyInr - from.cnyInr) / from.cnyInr) * 100;
}

export function computeMonthlyReturns(rates: MonthlyRatePoint[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < rates.length; i++) {
        const prev = rates[i - 1].cnyInr;
        const curr = rates[i].cnyInr;
        if (prev > 0) returns.push((curr - prev) / prev);
    }
    return returns;
}

export function computeCnyInrVolatility(rates: MonthlyRatePoint[]): VolatilityRegime {
    const returns = computeMonthlyReturns(rates);
    if (returns.length < 3) return 'moderate';

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
        returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    const monthlyVol = Math.sqrt(variance);
    const annualizedPct = monthlyVol * Math.sqrt(12) * 100;

    if (annualizedPct < 6) return 'low';
    if (annualizedPct < 9) return 'moderate';
    if (annualizedPct < 13) return 'elevated';
    return 'high';
}

export function findDivergenceMonth(rates: MonthlyRatePoint[]): string | null {
    if (rates.length < 4) return null;

    for (let i = 3; i < rates.length; i++) {
        const window = rates.slice(i - 3, i + 1);
        const usdMoves = window.slice(1).map((r, idx) => {
            const prev = window[idx].usdInr;
            return prev > 0 ? (r.usdInr - prev) / prev : 0;
        });
        const cnyMoves = window.slice(1).map((r, idx) => {
            const prev = window[idx].cnyInr;
            return prev > 0 ? (r.cnyInr - prev) / prev : 0;
        });
        const usdCum = usdMoves.reduce((a, b) => a + b, 0);
        const cnyCum = cnyMoves.reduce((a, b) => a + b, 0);
        if (cnyCum - usdCum > 0.02) return rates[i].month;
    }
    return rates[Math.floor(rates.length / 2)]?.month ?? null;
}

export function getCurrentRates(rates: MonthlyRatePoint[]): {
    usdInr: number;
    cnyInr: number;
} {
    const last = rates[rates.length - 1];
    return { usdInr: last?.usdInr ?? 84, cnyInr: last?.cnyInr ?? 14 };
}