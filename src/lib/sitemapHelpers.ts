const BASE_URL = 'https://graphiquestor.com';

/** Sitemap URLs use trailing slashes (except root). */
export function sitemapLoc(path: string, baseUrl = BASE_URL): string {
    if (path === '/') return `${baseUrl}/`;
    const normalized = path.startsWith('/') ? path : `/${path}`;
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

/** Dedupe by normalized sitemap loc; later entries win. */
export function dedupeSitemapRoutes<T extends SitemapRouteLike>(routes: T[]): T[] {
    const byUrl = new Map<string, T>();
    for (const route of routes) {
        byUrl.set(sitemapLoc(route.url), route);
    }
    return [...byUrl.values()];
}