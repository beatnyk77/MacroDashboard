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

    it('normalizes path locs and trailing slashes', () => {
        expect(normalizeSitemapPath('/intel/india/')).toBe('/intel/india/');
        expect(sitemapLoc('/intel/india')).toBe('https://graphiquestor.com/intel/india/');
    });

    it('dedupe drops noindex and normalizes paths', () => {
        const out = dedupeSitemapRoutes([
            { url: '/intel/india', priority: '0.9', changefreq: 'daily' },
            { url: '/labs/grit-index/', priority: '0.5', changefreq: 'monthly' },
            { url: '/api-docs', priority: '0.8', changefreq: 'monthly' },
        ]);
        expect(out.map((r) => r.url)).toEqual(['/intel/india', '/api-docs']);
    });
});
