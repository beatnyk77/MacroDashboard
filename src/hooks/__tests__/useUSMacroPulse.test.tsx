import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUSMacroPulse } from '../useUSMacroPulse';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
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

describe('useUSMacroPulse', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('should format macro data correctly on successful fetch', async () => {
        // Setup mock responses
        const mockHistoryData = [
            { metric_id: 'INFLATION_HEADLINE_YOY', as_of_date: '2023-01-01', value: 6.5 },
            { metric_id: 'INFLATION_HEADLINE_YOY', as_of_date: '2023-02-01', value: 6.0 },
        ];

        const mockLatestData = [
            { 
                metric_id: 'INFLATION_HEADLINE_YOY', 
                value: 6.0, 
                delta_yoy: -1.5, 
                z_score: 2.1, 
                percentile: 85,
                last_updated_at: new Date().toISOString() // Not stale
            }
        ];

        // Setup the specific call chain for history
        const mockOrder = vi.fn().mockResolvedValue({ data: mockHistoryData, error: null });
        const mockInHistory = vi.fn().mockReturnValue({ order: mockOrder });
        const mockSelectHistory = vi.fn().mockReturnValue({ in: mockInHistory });

        // Setup the specific call chain for latest
        const mockInLatest = vi.fn().mockResolvedValue({ data: mockLatestData, error: null });
        const mockSelectLatest = vi.fn().mockReturnValue({ in: mockInLatest });

        // Implement the 'from' mock to return different chains based on table
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'metric_observations') {
                return { select: mockSelectHistory };
            }
            if (table === 'vw_latest_metrics') {
                return { select: mockSelectLatest };
            }
            return { select: vi.fn() };
        });

        const { result } = renderHook(() => useUSMacroPulse(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        if (result.current.isSuccess) {
           const data = result.current.data;
           expect(data).toBeDefined();
           expect(data.length).toBeGreaterThan(0);
           
           const inflationMetric = data.find(d => d.metric_id === 'INFLATION_HEADLINE_YOY');
           expect(inflationMetric).toBeDefined();
           expect(inflationMetric?.current_value).toBe(6.0);
           expect(inflationMetric?.delta_yoy).toBe(-1.5);
           expect(inflationMetric?.history).toHaveLength(2);
           expect(inflationMetric?.isStale).toBe(false);
        }
    });

});
