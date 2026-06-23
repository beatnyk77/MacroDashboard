import { describe, it, expect } from 'vitest';
import {
    sitemapLoc,
    dedupeSitemapRoutes,
    isInvalidMacroBriefSitemapPath,
} from '@/lib/sitemapHelpers';

describe('sitemapHelpers', () => {
    it('sitemapLoc adds trailing slash on non-root paths', () => {
        expect(sitemapLoc('/about')).toBe('https://graphiquestor.com/about/');
        expect(sitemapLoc('/')).toBe('https://graphiquestor.com/');
    });

    it('flags wrong macro-brief date segments', () => {
        expect(isInvalidMacroBriefSitemapPath('https://graphiquestor.com/macro-brief/2026/06/22/')).toBe(true);
        expect(isInvalidMacroBriefSitemapPath('https://graphiquestor.com/macro-brief/2026-06-22/')).toBe(false);
    });

    it('dedupes routes by normalized loc', () => {
        const deduped = dedupeSitemapRoutes([
            { url: '/blog/foo', priority: '0.7', changefreq: 'never', lastmod: '2026-01-01' },
            { url: '/blog/foo/', priority: '0.8', changefreq: 'weekly', lastmod: '2026-02-01' },
        ]);
        expect(deduped).toHaveLength(1);
        expect(deduped[0].priority).toBe('0.8');
    });
});