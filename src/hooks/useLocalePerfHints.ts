import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { withoutTrailingSlash } from '@/lib/urlPath';

const PREFETCH_ROUTES_ZH = ['/intel/china', '/glossary', '/methods/m2-gold-ratio'] as const;

/**
 * Lightweight locale-aware perf hints for China-dominant traffic:
 * - Prefetch high-intent routes when browser prefers zh*
 * - Mark document for CJK-friendly system font fallbacks
 */
export function useLocalePerfHints(enabled = true) {
    const { pathname } = useLocation();

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const lang = navigator.language?.toLowerCase() ?? '';
        const prefersZh = lang.startsWith('zh');
        document.documentElement.dataset.localeHint = prefersZh ? 'zh' : 'en';

        if (!prefersZh) return;

        for (const route of PREFETCH_ROUTES_ZH) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = `${route}/`;
            link.as = 'document';
            document.head.appendChild(link);
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;
        const path = withoutTrailingSlash(pathname);
        if (path === '/intel/china') {
            document.documentElement.dataset.chinaHub = 'true';
        } else {
            delete document.documentElement.dataset.chinaHub;
        }
    }, [pathname, enabled]);
}