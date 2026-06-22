import { describe, it, expect } from 'vitest';
import { buildTradeFxJsonLd, TRADE_FX_FAQ_ENTRIES } from '../tradeFxSeo';

describe('tradeFxSeo', () => {
    it('defines seven FAQ entries', () => {
        expect(TRADE_FX_FAQ_ENTRIES).toHaveLength(7);
    });

    it('includes FAQPage schema with seven questions', () => {
        const schemas = buildTradeFxJsonLd();
        const faq = schemas.find((s) => s['@type'] === 'FAQPage');
        expect(faq).toBeDefined();
        const mainEntity = faq?.mainEntity as { name: string }[];
        expect(mainEntity).toHaveLength(7);
        expect(mainEntity[0].name).toContain('USD/INR hedging');
    });

    it('includes WebApplication and FAQPage schemas', () => {
        const types = buildTradeFxJsonLd().map((s) => s['@type']);
        expect(types).toContain('WebApplication');
        expect(types).toContain('FAQPage');
        expect(types).not.toContain('BreadcrumbList');
    });

    it('uses audit-spec WebApplication fields', () => {
        const app = buildTradeFxJsonLd().find((s) => s['@type'] === 'WebApplication');
        expect(app?.operatingSystem).toBe('Web');
        expect(app?.url).toBe('https://graphiquestor.com/trade-fx/');
    });
});