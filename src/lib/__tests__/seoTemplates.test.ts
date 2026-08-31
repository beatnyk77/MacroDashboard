import { describe, it, expect } from 'vitest';
import { apiDocsMeta, mcpMeta } from '@/lib/seoTemplates';

const HOMEPAGE_PREFIX = 'Institutional macro intelligence terminal tracking global liquidity';

describe('seoTemplates', () => {
    it('never reuses homepage description prefix', () => {
        expect(apiDocsMeta().description.startsWith(HOMEPAGE_PREFIX)).toBe(false);
        expect(mcpMeta().description.startsWith(HOMEPAGE_PREFIX)).toBe(false);
    });
});
