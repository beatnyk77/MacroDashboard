import { describe, it, expect } from 'vitest';
import {
    getConceptByGlossarySlug,
    getConceptByMethodsPath,
    getConceptByMetricId,
    getConceptByPath,
} from '@/lib/conceptHub';

describe('conceptHub soft hierarchy', () => {
    it('maps net liquidity z-score across three surfaces', () => {
        const byMetric = getConceptByMetricId('net-liquidity-zscore');
        expect(byMetric?.primaryPath).toBe('/metrics/net-liquidity-zscore');
        expect(byMetric?.methodologyPath).toContain('/methods/');
        expect(byMetric?.definitionPath).toContain('/glossary/');

        const byGloss = getConceptByGlossarySlug('net-liquidity-z-score');
        expect(byGloss?.primaryPath).toBe('/metrics/net-liquidity-zscore');

        const byMethod = getConceptByMethodsPath('/methods/net-liquidity-z-score/');
        expect(byMethod?.primaryPath).toBe('/metrics/net-liquidity-zscore');
    });

    it('getConceptByPath assigns roles', () => {
        expect(getConceptByPath('/metrics/m2-gold-ratio/')?.role).toBe('primary');
        expect(getConceptByPath('/glossary/m2-gold-ratio')?.role).toBe('definition');
        expect(getConceptByPath('/methods/m2-gold-ratio/')?.role).toBe('methodology');
    });

    it('returns undefined for unmapped paths', () => {
        expect(getConceptByPath('/about')).toBeUndefined();
        expect(getConceptByGlossarySlug('not-a-real-slug-xyz')).toBeUndefined();
    });
});
