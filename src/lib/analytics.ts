/**
 * Analytics utility for Google Analytics 4 (gtag.js)
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
