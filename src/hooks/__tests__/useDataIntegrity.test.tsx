import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDataIntegrity } from '../useDataIntegrity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '@/lib/supabase';

// Mock Supabase
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

    it('returns healthy status when no high frequency metrics are stale', async () => {
        const now = Date.now();
        const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
        const mockSelect = vi.fn().mockResolvedValue({ 
            // Mock returned data, within the week limit
            data: [
                { metric_id: 'CAPITAL_FROM_XYZ', as_of_date: twoDaysAgo },
                { metric_id: 'PMI_MANUFACTURING', as_of_date: twoDaysAgo }
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

    it('returns degraded status when some high frequency metrics are stale (< 25% or count < 10)', async () => {
        const now = Date.now();
        const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
        const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
        const mockSelect = vi.fn().mockResolvedValue({ 
            data: [
                // One stale
                { metric_id: 'CAPITAL_FROM_XYZ', as_of_date: tenDaysAgo },
                // 3 Not stale
                { metric_id: 'PMI_MANUFACTURING', as_of_date: twoDaysAgo },
                { metric_id: 'USD_GBP', as_of_date: twoDaysAgo },
                { metric_id: 'GOLD_PRICE', as_of_date: twoDaysAgo }
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

    it('returns critical status when >25% and >10 high frequency metrics are stale', async () => {
        const now = Date.now();
        const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
        const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

        // Create 20 metrics, where 11 are stale (11/20 > 25% and 11 > 10)
        let metrics = [];
        for (let i = 0; i < 11; i++) {
            metrics.push({ metric_id: `USD_${i}`, as_of_date: tenDaysAgo });
        }
        for (let i = 0; i < 9; i++) {
            metrics.push({ metric_id: `PMI_${i}`, as_of_date: twoDaysAgo });
        }

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
