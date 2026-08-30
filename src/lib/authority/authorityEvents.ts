import { trackEvent } from '@/lib/analytics';
import { recordSiteEvent } from '@/lib/siteAnalytics';

export type AuthorityEventType =
    | 'citation_copy'
    | 'data_download'
    | 'snapshot_view'
    | 'embed_view'
    | 'provenance_view';

export interface AuthorityEventPayload {
    metricId: string;
    snapshotId?: string;
    format?: 'bibtex' | 'apa' | 'chicago' | 'csv' | 'json';
    isHistorical?: boolean;
    referrer?: string;
}

/**
 * Track an authority-related interaction (citations, downloads, snapshot exploration).
 * Emits to Google Analytics (gtag) and the first-party site_analytics_events ledger.
 */
export function trackAuthorityEvent(
    eventType: AuthorityEventType,
    payload: AuthorityEventPayload
): void {
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    // 1. Google Analytics event
    trackEvent(`authority_${eventType}`, {
        metric_id: payload.metricId,
        snapshot_id: payload.snapshotId,
        format: payload.format,
        is_historical: payload.isHistorical ? 1 : 0,
        event_category: 'authority_engine',
        event_label: `${payload.metricId}:${eventType}`,
    });

    // 2. First-party DB event ledger
    recordSiteEvent(
        `authority_${eventType}`,
        pagePath,
        1,
        {
            metric_id: payload.metricId,
            snapshot_id: payload.snapshotId ?? null,
            format: payload.format ?? null,
            is_historical: payload.isHistorical ?? false,
            referrer: payload.referrer || referrer || null,
            timestamp: new Date().toISOString(),
        }
    );
}

export function trackAuthorityCitationCopy(
    metricId: string,
    format: 'bibtex' | 'apa' | 'chicago',
    snapshotId?: string
): void {
    trackAuthorityEvent('citation_copy', { metricId, format, snapshotId });
}

export function trackAuthorityDownload(
    metricId: string,
    format: 'csv' | 'json',
    snapshotId?: string
): void {
    trackAuthorityEvent('data_download', { metricId, format, snapshotId });
}

export function trackAuthoritySnapshotView(
    metricId: string,
    snapshotId?: string,
    isHistorical?: boolean
): void {
    trackAuthorityEvent('snapshot_view', { metricId, snapshotId, isHistorical });
}
