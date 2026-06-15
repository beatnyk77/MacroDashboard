import { BrandConfig } from '@/config/brandConfig';

/** React Router `path` prop — trailing slash on all non-root routes. */
export const trailRoute = (path: string): string =>
    path === '/' || path === '*' ? path : withTrailingSlash(path);

/**
 * Enforce trailing slash on internal paths (root stays `/`).
 */
export function withTrailingSlash(path: string): string {
    if (!path || path === '/') return '/';
    const [pathname, ...rest] = path.split(/(?=[?#])/);
    const base = pathname.endsWith('/') ? pathname : `${pathname}/`;
    return `${base}${rest.join('')}`;
}

/** Strip trailing slashes except for root. */
export function withoutTrailingSlash(path: string): string {
    if (!path || path === '/') return '/';
    const [pathname, ...rest] = path.split(/(?=[?#])/);
    const base = pathname.replace(/\/+$/, '') || '/';
    return base === '/' ? '/' : `${base}${rest.join('')}`;
}

/** Canonical pathname for SEO (trailing slash on all non-root routes). */
export function toCanonicalPath(pathname: string): string {
    return withTrailingSlash(withoutTrailingSlash(pathname));
}

/** Absolute canonical URL for a pathname or relative path. */
export function toAbsoluteUrl(path: string, baseUrl = BrandConfig.baseUrl): string {
    const base = baseUrl.replace(/\/$/, '');
    if (path.startsWith('http://') || path.startsWith('https://')) {
        try {
            const url = new URL(path);
            return `${url.origin}${toCanonicalPath(url.pathname)}`;
        } catch {
            return path;
        }
    }
    const normalized = toCanonicalPath(path.startsWith('/') ? path : `/${path}`);
    return `${base}${normalized}`;
}

/** Normalize react-router `to` values (string or partial path object). */
export function normalizeTo(
    to: string | { pathname?: string; search?: string; hash?: string }
): string | { pathname?: string; search?: string; hash?: string } {
    if (typeof to === 'string') {
        if (to.startsWith('http') || to.startsWith('mailto:') || to.startsWith('#')) return to;
        return withTrailingSlash(to);
    }
    if (to.pathname) {
        return { ...to, pathname: withTrailingSlash(to.pathname) };
    }
    return to;
}