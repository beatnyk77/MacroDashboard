import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { decideRoute } from '../../netlify/edge-functions/lib/routing-rules';
import {
    APP_ROUTE_PATTERNS,
    PASS_THROUGH_ROUTE_PATTERNS,
} from '../../netlify/edge-functions/lib/known-routes.generated';
// @ts-expect-error — plain .mjs build script without type declarations
import { extractRoutePatterns, scopeSpaFallback } from '../generate-route-manifest.mjs';

const ROOT = path.resolve(__dirname, '../..');
const decide = (p: string) => decideRoute(p, APP_ROUTE_PATTERNS, PASS_THROUGH_ROUTE_PATTERNS);

describe('seo-routing edge decisions', () => {
    it('301s known routes without a trailing slash', () => {
        expect(decide('/metrics/gold-silver-ratio')).toEqual({
            type: 'redirect',
            location: '/metrics/gold-silver-ratio/',
        });
        expect(decide('/labs/gov-financial-position')).toEqual({
            type: 'redirect',
            location: '/labs/gov-financial-position/',
        });
        expect(decide('/macro-brief/2026-07-30')).toEqual({ type: 'redirect', location: '/macro-brief/2026-07-30/' });
    });

    it('passes canonical slash URLs and root through', () => {
        expect(decide('/')).toEqual({ type: 'pass' });
        expect(decide('/glossary/tga/')).toEqual({ type: 'pass' });
        expect(decide('/regime-digest/2026/02/')).toEqual({ type: 'pass' });
    });

    it('404s paths no route renders, with or without slash', () => {
        expect(decide('/this-does-not-exist/')).toEqual({ type: 'not-found' });
        expect(decide('/this-does-not-exist')).toEqual({ type: 'not-found' });
        expect(decide('/glossary/tga/extra/')).toEqual({ type: 'not-found' });
    });

    it('leaves static-redirect sources to public/_redirects (no double hop)', () => {
        for (const p of ['/countries', '/countries/', '/countries/in', '/countries/in/', '/labs/india', '/trade/uk/x', '/thematics']) {
            expect(decide(p)).toEqual({ type: 'pass' });
        }
    });

    it('leaves files to the static layer', () => {
        expect(decide('/acam.xml')).toEqual({ type: 'file' });
        expect(decide('/sitemap.xml')).toEqual({ type: 'file' });
    });

    it('scopes the blanket SPA rewrite to app routes so unknown URLs 404', () => {
        const src = fs.readFileSync(path.join(ROOT, 'public/_redirects'), 'utf8');
        const out = scopeSpaFallback(src, ['/glossary/:slug/', '/labs/']);
        expect(out).not.toMatch(/^\/\*\s+\/index\.html\s+200/m);
        expect(out).toContain('/glossary/:slug /index.html 200');
        expect(out).toContain('/labs /index.html 200');
        expect(out).toContain('/countries/* /labs/sovereign-stress/ 301');
        expect(() => scopeSpaFallback('/a /b 301\n', [])).toThrow();
    });

    it('never redirects or 404s a URL listed in the sitemap', () => {
        const sitemap = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8');
        const paths = [...sitemap.matchAll(/<loc>https:\/\/graphiquestor\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
        expect(paths.length).toBeGreaterThan(0);
        const broken = paths.filter((p) => decide(p).type !== 'pass');
        expect(broken).toEqual([]);
    });

    it('generated manifest is in sync with App.tsx and _redirects', () => {
        const fresh = extractRoutePatterns(
            fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8'),
            fs.readFileSync(path.join(ROOT, 'public/_redirects'), 'utf8'),
        );
        expect(fresh.appRoutes).toEqual([...APP_ROUTE_PATTERNS]);
        expect(fresh.passThroughRoutes).toEqual([...PASS_THROUGH_ROUTE_PATTERNS]);
    });
});
