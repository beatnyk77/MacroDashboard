import { describe, it, expect } from 'vitest';
import { buildTradeFxJsonLd, TRADE_FX_FAQ_ENTRIES } from '../tradeFxSeo';

describe('tradeFxSeo', () => {
    it('defines five FAQ entries', () => {
        expect(TRADE_FX_FAQ_ENTRIES).toHaveLength(5);
    });

    it('includes FAQPage schema with five questions', () => {
        const schemas = buildTradeFxJsonLd();
        const faq = schemas.find((s) => s['@type'] === 'FAQPage');
        expect(faq).toBeDefined();
        const mainEntity = faq?.mainEntity as { name: string }[];
        expect(mainEntity).toHaveLength(5);
        expect(mainEntity[0].name).toContain('zero-cost collar');
    });

    it('includes WebApplication and BreadcrumbList schemas', () => {
        const types = buildTradeFxJsonLd().map((s) => s['@type']);
        expect(types).toContain('WebApplication');
        expect(types).toContain('BreadcrumbList');
        expect(types).toContain('FAQPage');
    });
});