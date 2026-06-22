import { describe, it, expect } from 'vitest';
import { ILLUSTRATIVE_INVOICING_RATES } from '../../constants/illustrativeInvoicingRates';
import {
    calculateHistoricalCostComparison,
    calculateInvoicingScenario,
    calculateDecisionScore,
    computeCnyInrAppreciation,
} from '../invoicingCalculations';
import { createDefaultFactors } from '../decisionFactors';

describe('invoicingCalculations', () => {
    it('shows CNY more expensive than USD over 24M with illustrative data', () => {
        const result = calculateHistoricalCostComparison(
            { monthlyImportValue: 1_00_00_000, periodMonths: 24 },
            ILLUSTRATIVE_INVOICING_RATES,
        );
        expect(result.summary.totalExtraCostCNY).toBeGreaterThan(0);
        expect(result.dataPoints.length).toBe(24);
    });

    it('CNY/INR appreciation May 2025 to Jun 2026 ≈ 23.6%', () => {
        const pct = computeCnyInrAppreciation(
            ILLUSTRATIVE_INVOICING_RATES,
            '2025-05',
            '2026-06',
        );
        expect(pct).toBeGreaterThan(22);
        expect(pct).toBeLessThan(25);
    });

    it('CNY scenario costs more than USD under default assumptions', () => {
        const rates = { usdInr: 84.1, cnyInr: 14.31 };
        const result = calculateInvoicingScenario(
            {
                notionalMonthly: 1_00_00_000,
                invoicingCurrency: 'USD',
                cnyAppreciationPct: 5,
                usdAppreciationPct: 2,
                horizonMonths: 12,
            },
            rates,
        );
        expect(result.cnyInvoicedTotalINR).toBeGreaterThan(result.usdInvoicedTotalINR);
    });

    it('calculateDecisionScore returns USD highest with defaults', () => {
        const scores = calculateDecisionScore(createDefaultFactors());
        expect(scores.usd).toBeGreaterThan(scores.cny);
        expect(scores.usd).toBeGreaterThan(scores.inr);
    });
});