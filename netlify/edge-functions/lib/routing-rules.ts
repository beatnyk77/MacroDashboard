/**
 * Pure routing decisions for the `seo-routing` edge function (no Netlify/Deno imports,
 * so vitest can exercise it directly).
 */

export type RouteDecision =
    | { type: 'pass' }
    | { type: 'redirect'; location: string }
    | { type: 'not-found' }
    | { type: 'file' };

const patternCache = new Map<string, RegExp>();

function toRegExp(pattern: string): RegExp {
    let re = patternCache.get(pattern);
    if (!re) {
        const body = pattern
            .split('/')
            .map((seg) => {
                if (seg === '*') return '.*';
                if (seg.startsWith(':')) return '[^/]+';
                return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            })
            .join('/');
        re = new RegExp(`^${body}$`);
        patternCache.set(pattern, re);
    }
    return re;
}

const matchesAny = (pathname: string, patterns: readonly string[]) =>
    patterns.some((p) => toRegExp(p).test(pathname));

export function decideRoute(
    pathname: string,
    appRoutes: readonly string[],
    passThroughRoutes: readonly string[],
): RouteDecision {
    if (pathname === '/') return { type: 'pass' };

    const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
    if (lastSegment.includes('.')) return { type: 'file' };

    const slashed = pathname.endsWith('/') ? pathname : `${pathname}/`;
    if (matchesAny(slashed, passThroughRoutes)) return { type: 'pass' };
    if (matchesAny(slashed, appRoutes)) {
        return slashed === pathname ? { type: 'pass' } : { type: 'redirect', location: slashed };
    }
    return { type: 'not-found' };
}
