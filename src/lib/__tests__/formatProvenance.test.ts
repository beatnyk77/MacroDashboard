import { describe, it, expect } from 'vitest';
import { formatProvenanceTag, formatSourceRef } from '@/lib/formatProvenance';

describe('formatSourceRef', () => {
    it('formats live_api tags', () => {
        expect(formatSourceRef('live_api:ingest-fred')).toBe('Live API · ingest-fred');
    });

    it('formats fallback tags', () => {
        expect(formatSourceRef('fallback:trade-gravity-2023')).toBe('Fallback dataset · trade-gravity-2023');
    });

    it('returns unverified for empty input', () => {
        expect(formatSourceRef(null)).toBe('Source unverified');
    });
});

describe('formatProvenanceTag', () => {
    it('maps legacy provenance enums', () => {
        expect(formatProvenanceTag('api_live')).toBe('Verified live API');
        expect(formatProvenanceTag('fallback_snapshot')).toBe('Fallback snapshot');
    });
});