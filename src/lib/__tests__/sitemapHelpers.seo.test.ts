import { describe, it, expect } from 'vitest';
import {
    dedupeSitemapRoutes,
    isSitemapNoindexPath,
    normalizeSitemapPath,
    sitemapLoc,
} from '@/lib/sitemapHelpers';

describe('sitemap SEO helpers', () => {
    it('flags intentional noindex paths', () => {
        expect(isSitemapNoindexPath('/labs/grit-index/')).toBe(true);
        expect(isSitemapNoindexPath('/india-equities')).toBe(true);
        expect(isSitemapNoindexPath('/methods/regime-scoring/')).toBe(true);
        expect(isSitemapNoindexPath('/api-docs/')).toBe(false);
    });

    it('lowercases country paths', () => {
        expect(normalizeSitemapPath('/countries/US/')).toBe('/countries/us/');
        expect(sitemapLoc('/countries/IN')).toBe('https://graphiquestor.com/countries/in/');
    });

    it('dedupe drops noindex and normalizes countries', () => {
        const out = dedupeSitemapRoutes([
            { url: '/countries/US', priority: '0.7', changefreq: 'weekly' },
            { url: '/labs/grit-index/', priority: '0.5', changefreq: 'monthly' },
            { url: '/api-docs', priority: '0.8', changefreq: 'monthly' },
        ]);
        expect(out.map((r) => r.url)).toEqual(['/countries/us', '/api-docs']);
    });
});
