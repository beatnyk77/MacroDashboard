import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDataIntegrity } from '../useDataIntegrity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useDataIntegrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('returns critical status when no metrics data available', async () => {
        const mockSelect = vi.fn().mockResolvedValue({ data: null });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useDataIntegrity(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe('critical');
    });

    it('returns healthy status when every metric has staleness_flag fresh, regardless of cadence', async () => {
        const mockSelect = vi.fn().mockResolvedValue({
            data: [
                { metric_id: 'CAPITAL_FROM_XYZ', staleness_flag: 'fresh', as_of_date: '2026-07-30' },
                // A quarterly metric that's 60 days old is 'fresh' per its own expected_interval_days —
                // this is exactly the case the old flat-7-day threshold got wrong.
                { metric_id: 'BOP_CURRENT_ACCOUNT_GDP', staleness_flag: 'fresh', as_of_date: '2026-06-01' },
            ]
        });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useDataIntegrity(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe('healthy');
        expect(result.current.data?.staleCount).toBe(0);
        expect(result.current.data?.totalHighFrequency).toBe(2);
    });

    it('returns degraded status when some metrics are lagged (below critical threshold)', async () => {
        const mockSelect = vi.fn().mockResolvedValue({
            data: [
                { metric_id: 'CAPITAL_FROM_XYZ', staleness_flag: 'lagged', as_of_date: '2026-06-01' },
                { metric_id: 'PMI_MANUFACTURING', staleness_flag: 'fresh', as_of_date: '2026-07-30' },
                { metric_id: 'USD_GBP', staleness_flag: 'fresh', as_of_date: '2026-07-30' },
                { metric_id: 'GOLD_PRICE', staleness_flag: 'fresh', as_of_date: '2026-07-30' },
            ]
        });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useDataIntegrity(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe('degraded');
        expect(result.current.data?.staleCount).toBe(1);
    });

    it('returns critical status when >25% are stale and >10 are very_lagged', async () => {
        const metrics = [
            ...Array.from({ length: 11 }, (_, i) => ({ metric_id: `USD_${i}`, staleness_flag: 'very_lagged', as_of_date: '2024-01-01' })),
            ...Array.from({ length: 9 }, (_, i) => ({ metric_id: `PMI_${i}`, staleness_flag: 'fresh', as_of_date: '2026-07-30' })),
        ];
        const mockSelect = vi.fn().mockResolvedValue({ data: metrics });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useDataIntegrity(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.status).toBe('critical');
        expect(result.current.data?.staleCount).toBe(11);
    });
});
