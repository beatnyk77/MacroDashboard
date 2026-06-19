import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackScrollDepth, trackTimeOnPage } from '@/lib/analytics';
import { withoutTrailingSlash } from '@/lib/urlPath';

const SCROLL_MILESTONES = [25, 50, 75, 90] as const;
const TIME_MILESTONES = [15, 30, 60, 120] as const;

/**
 * Non-intrusive scroll-depth and time-on-page tracking for GA4.
 * Each milestone fires at most once per page view.
 */
export function useEngagementTracking(enabled = true) {
    const { pathname } = useLocation();
    const path = withoutTrailingSlash(pathname);
    const firedScroll = useRef(new Set<number>());
    const firedTime = useRef(new Set<number>());

    useEffect(() => {
        if (!enabled) return;
        firedScroll.current.clear();
        firedTime.current.clear();
    }, [path, enabled]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const onScroll = () => {
            const doc = document.documentElement;
            const scrollTop = window.scrollY || doc.scrollTop;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            if (scrollHeight <= 0) return;

            const pct = Math.round((scrollTop / scrollHeight) * 100);
            for (const milestone of SCROLL_MILESTONES) {
                if (pct >= milestone && !firedScroll.current.has(milestone)) {
                    firedScroll.current.add(milestone);
                    trackScrollDepth(milestone, path);
                }
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, [path, enabled]);

    useEffect(() => {
        if (!enabled) return;

        const start = Date.now();
        const interval = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - start) / 1000);
            for (const milestone of TIME_MILESTONES) {
                if (elapsed >= milestone && !firedTime.current.has(milestone)) {
                    firedTime.current.add(milestone);
                    trackTimeOnPage(milestone, path);
                }
            }
        }, 5000);

        return () => window.clearInterval(interval);
    }, [path, enabled]);
}