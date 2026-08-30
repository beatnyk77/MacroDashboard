import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackAuthorityEvent, trackAuthorityCitationCopy, trackAuthorityDownload } from './authorityEvents';
import * as analytics from '../analytics';
import * as siteAnalytics from '../siteAnalytics';

vi.mock('../analytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('../siteAnalytics', () => ({
    recordSiteEvent: vi.fn(),
}));

describe('authorityEvents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('emits trackAuthorityEvent with structured payload', () => {
        trackAuthorityEvent('citation_copy', {
            metricId: 'net-liquidity',
            format: 'bibtex',
            snapshotId: 'snap-123',
        });

        expect(analytics.trackEvent).toHaveBeenCalledWith('authority_citation_copy', {
            metric_id: 'net-liquidity',
            snapshot_id: 'snap-123',
            format: 'bibtex',
            is_historical: 0,
            event_category: 'authority_engine',
            event_label: 'net-liquidity:citation_copy',
        });

        expect(siteAnalytics.recordSiteEvent).toHaveBeenCalledWith(
            'authority_citation_copy',
            expect.any(String),
            1,
            expect.objectContaining({
                metric_id: 'net-liquidity',
                snapshot_id: 'snap-123',
                format: 'bibtex',
            })
        );
    });

    it('tracks citation copy convenience wrapper', () => {
        trackAuthorityCitationCopy('china-iceberg-ratio', 'apa');

        expect(analytics.trackEvent).toHaveBeenCalledWith('authority_citation_copy', expect.objectContaining({
            metric_id: 'china-iceberg-ratio',
            format: 'apa',
        }));
    });

    it('tracks download convenience wrapper', () => {
        trackAuthorityDownload('fed-monetization-ratio', 'csv', 'snap-456');

        expect(analytics.trackEvent).toHaveBeenCalledWith('authority_data_download', expect.objectContaining({
            metric_id: 'fed-monetization-ratio',
            format: 'csv',
            snapshot_id: 'snap-456',
        }));
    });
});
