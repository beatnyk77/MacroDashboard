import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { buildNarrative, useEnergyRegime } from './useEnergyRegime';

const rowsByMetric = vi.hoisted(() => ({
    BRENT_CRUDE_PRICE: [{ as_of_date: '2026-10-29', value: 110 }, { as_of_date: '2026-10-28', value: 115 }],
    OIL_REFINERY_UTILIZATION_US: [{ as_of_date: '2026-10-23', value: 92.8 }],
    EU_GAS_STORAGE_PCT: [{ as_of_date: '2026-09-01', value: 65.6 }],
} as Record<string, Array<{ as_of_date: string; value: number }>>));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: (_col: string, id: string) => ({
                    order: () => ({ limit: () => Promise.resolve({ data: rowsByMetric[id] ?? [], error: null }) }),
                }),
            }),
        }),
    },
}));

vi.mock('./useOilSpread', () => ({
    useLatestOilSpread: () => ({
        data: { spread: 1.7, regime: 'NORMAL', is_stale: false, date: '2026-10-29', computed_at: '2026-10-29T03:15:00Z' },
    }),
}));

describe('buildNarrative', () => {
    it('returns acute stress narrative for EXTREME regime', () => {
        const result = buildNarrative('EXTREME', 92);
        expect(result).toContain('acute stress');
    });

    it('returns acute stress narrative for STRESSED regime', () => {
        const result = buildNarrative('STRESSED', 88);
        expect(result).toContain('acute stress');
    });

    it('returns capacity ceiling narrative for TIGHTENING + high utilization', () => {
        const result = buildNarrative('TIGHTENING', 91);
        expect(result).toContain('capacity ceiling');
    });

    it('returns oversupply narrative for OVERSUPPLY regime', () => {
        const result = buildNarrative('OVERSUPPLY', 85);
        expect(result).toContain('Oversupply');
    });

    it('returns refinery slack narrative when utilization < 80', () => {
        const result = buildNarrative('NORMAL', 75);
        expect(result).toContain('slack');
    });

    it('returns balanced narrative for NORMAL regime with adequate utilization', () => {
        const result = buildNarrative('NORMAL', 85);
        expect(result).toContain('Balanced');
    });

    it('returns tightening narrative for TIGHTENING with utilization <= 90', () => {
        const result = buildNarrative('TIGHTENING', 85);
        expect(result).toContain('tightening');
    });

    it('asserts no regime when the spread is missing', () => {
        expect(buildNarrative(null, 92)).toContain('Insufficient data');
    });

    it('does not invent a utilization claim when utilization is missing', () => {
        const result = buildNarrative('NORMAL', null);
        expect(result).toContain('unavailable');
        expect(result).not.toContain('high refinery utilization');
    });
});

describe('useEnergyRegime feed staleness', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps a fresh daily feed fresh when a monthly feed is stale', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));

        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client }, children);
        const { result } = renderHook(() => useEnergyRegime(), { wrapper });
        await waitFor(() => expect(result.current.brentPrice).toBe(110));

        expect(result.current.feeds.brent).toBe('fresh');
        expect(result.current.feeds.spread).toBe('fresh');
        expect(result.current.feeds.gas).not.toBe('fresh');
        expect(result.current.isAnyStale).toBe(true);
    });
});
