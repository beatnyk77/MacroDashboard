const BASE_URL = 'https://graphiquestor.com';

/** Routes that are intentionally noindex — never advertise in sitemap. */
export const SITEMAP_NOINDEX_PATHS = new Set([
    '/methods/regime-scoring',
    '/methods/regime-scoring/',
    '/india-equities',
    '/india-equities/',
    '/labs/grit-index',
    '/labs/grit-index/',
]);

export function isSitemapNoindexPath(path: string): boolean {
    if (!path) return false;
    const bare = path.split(/[?#]/)[0];
    if (SITEMAP_NOINDEX_PATHS.has(bare)) return true;
    const withSlash = bare.endsWith('/') ? bare : `${bare}/`;
    const without = bare.replace(/\/+$/, '') || '/';
    return SITEMAP_NOINDEX_PATHS.has(withSlash) || SITEMAP_NOINDEX_PATHS.has(without);
}

/** Lowercase /countries/{iso} segments for sitemap locs. */
export function normalizeSitemapPath(path: string): string {
    const bare = path.split(/[?#]/)[0] || '/';
    const m = bare.match(/^(\/countries\/)([^/]+)(\/?)$/i);
    if (m) return `${m[1]}${m[2].toLowerCase()}${m[3] || ''}`;
    return bare;
}

/** Sitemap URLs use trailing slashes (except root). */
export function sitemapLoc(path: string, baseUrl = BASE_URL): string {
    if (path === '/') return `${baseUrl}/`;
    const normalized = normalizeSitemapPath(path.startsWith('/') ? path : `/${path}`);
    return `${baseUrl}${normalized.endsWith('/') ? normalized : `${normalized}/`}`;
}

/** Reject legacy/wrong macro-brief paths like /macro-brief/2026/06/22 */
export function isInvalidMacroBriefSitemapPath(loc: string): boolean {
    return /\/macro-brief\/\d{4}\/\d{2}\/\d{2}/.test(loc);
}

export interface SitemapRouteLike {
    url: string;
    priority: string;
    changefreq: string;
    lastmod?: string;
}

/** Dedupe by normalized sitemap loc; later entries win. Drop noindex paths. */
export function dedupeSitemapRoutes<T extends SitemapRouteLike>(routes: T[]): T[] {
    const byUrl = new Map<string, T>();
    for (const route of routes) {
        if (isSitemapNoindexPath(route.url)) continue;
        const normalized: T = {
            ...route,
            url: normalizeSitemapPath(route.url === '/' ? '/' : route.url.replace(/\/+$/, '') || '/'),
        };
        byUrl.set(sitemapLoc(normalized.url), normalized);
    }
    return [...byUrl.values()];
}