import { describe, it, expect } from 'vitest';
import { deriveInvoicingRegimeVerdict } from '../invoicingRegimeEngine';

describe('invoicingRegimeEngine', () => {
    it('returns maintain_usd with high confidence when CNY appreciation > 15% and elevated vol', () => {
        const verdict = deriveInvoicingRegimeVerdict(
            {
                cnyInrVolatilityRegime: 'elevated',
                usdInrVolatilityRegime: 'moderate',
                chinaMacroSentiment: 'neutral',
                dedolSignal: 'weak',
                rbiInterventionBias: 'neutral',
                cnyInr24mAppreciation: 23.6,
            },
            '2026-06-01',
        );
        expect(verdict.recommendation).toBe('maintain_usd');
        expect(verdict.confidenceLevel).toBe('high');
    });
});