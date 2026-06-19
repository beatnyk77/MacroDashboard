import { recordSiteEvent } from '@/lib/siteAnalytics';

/**
 * Analytics utility for Google Analytics 4 (gtag.js) + first-party admin aggregates.
 */

type GAEventParams = {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
};

export const trackEvent = (eventName: string, params?: GAEventParams) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, params);

        if (import.meta.env.DEV) {
            console.log(`[Analytics] Event: ${eventName}`, params);
        }
    }
};

export const trackSectionView = (sectionId: string) => {
    trackEvent('section_view', {
        section_id: sectionId,
        event_category: 'engagement',
    });
};

export const trackClick = (elementId: string, location: string) => {
    trackEvent('click', {
        element_id: elementId,
        location: location,
        event_category: 'interaction',
    });
};

export const trackScrollDepth = (depth: number, path: string) => {
    trackEvent('scroll_depth', {
        depth_percent: depth,
        page_path: path,
        event_category: 'engagement',
    });
};

export const trackTimeOnPage = (seconds: number, path: string) => {
    trackEvent('time_on_page', {
        elapsed_seconds: seconds,
        page_path: path,
        event_category: 'engagement',
    });
    recordSiteEvent('time_on_page', path, seconds, { elapsed_seconds: seconds });
};

export const trackEngagementPrompt = (action: 'shown' | 'dismissed' | 'subscribed', trigger: string) => {
    trackEvent('engagement_prompt', {
        action,
        trigger,
        event_category: 'retention',
    });
};

export const trackExplorerUse = (explorerId: string, action: string) => {
    trackEvent('metric_explorer', {
        explorer_id: explorerId,
        action,
        event_category: 'interaction',
    });
};
