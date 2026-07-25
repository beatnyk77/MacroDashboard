import { describe, it, expect } from 'vitest';
import { apiDocsMeta, countryMeta, mcpMeta } from '@/lib/seoTemplates';

const HOMEPAGE_PREFIX = 'Institutional macro intelligence terminal tracking global liquidity';

describe('seoTemplates', () => {
    it('never reuses homepage description prefix', () => {
        expect(apiDocsMeta().description.startsWith(HOMEPAGE_PREFIX)).toBe(false);
        expect(mcpMeta().description.startsWith(HOMEPAGE_PREFIX)).toBe(false);
        expect(countryMeta('India', 'IN').description.startsWith(HOMEPAGE_PREFIX)).toBe(false);
    });

    it('country meta includes country name', () => {
        const m = countryMeta('United States', 'US');
        expect(m.title).toContain('United States');
        expect(m.description).toContain('United States');
    });
});
