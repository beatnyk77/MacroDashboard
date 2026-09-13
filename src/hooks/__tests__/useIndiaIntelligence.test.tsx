import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIndiaIntelligence } from '../useIndiaIntelligence';
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

describe('useIndiaIntelligence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('evaluates overall regime and all domains cleanly with authentic observations', async () => {
        const mockLatest = [
            {
                metric_id: 'IN_IIP_YOY',
                metric_name: 'India IIP YoY',
                value: 7.8,
                as_of_date: '2026-07-31',
                last_updated_at: new Date().toISOString(),
                source_name: 'MoSPI',
                source_ref: 'live_api:fred:INDPROINDMISMEI',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'monthly',
                display_frequency: 'monthly',
                percentile: 0.72,
                z_score: 0.8,
            },
            {
                metric_id: 'IN_GDP_GROWTH_YOY',
                metric_name: 'India GDP Growth YoY',
                value: 7.5,
                as_of_date: '2026-06-30',
                last_updated_at: new Date().toISOString(),
                source_name: 'MoSPI',
                source_ref: 'live_api:fred:NAEXKP01INA657S',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'quarterly',
                display_frequency: 'quarterly',
                percentile: 0.65,
                z_score: 0.5,
            },
            {
                metric_id: 'IN_CPI_YOY',
                metric_name: 'India CPI YoY',
                value: 5.1,
                as_of_date: '2026-08-15',
                last_updated_at: new Date().toISOString(),
                source_name: 'MoSPI',
                source_ref: 'live_api:fred:CPALTT01INM657N',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'monthly',
                display_frequency: 'monthly',
                percentile: 0.45,
                z_score: -0.2,
            },
            {
                metric_id: 'IN_WPI_YOY',
                metric_name: 'India WPI YoY',
                value: 0.83,
                as_of_date: '2026-07-31',
                last_updated_at: new Date().toISOString(),
                source_name: 'Office of Economic Adviser / FRED',
                source_ref: 'live_api:fred:WPIATT01INM661N',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'monthly',
                display_frequency: 'monthly',
                percentile: 0.40,
                z_score: -0.3,
            },
            {
                metric_id: 'IN_REPO_RATE',
                metric_name: 'RBI Repo Rate',
                value: 6.5,
                as_of_date: '2026-08-10',
                last_updated_at: new Date().toISOString(),
                source_name: 'RBI / FRED',
                source_ref: 'live_api:fred:IRSTCB01INM156N',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'monthly',
                display_frequency: 'monthly',
                percentile: 0.55,
                z_score: 0.1,
            },
            {
                metric_id: 'IN_FX_RESERVES',
                metric_name: 'India FX Reserves',
                value: 650.5,
                as_of_date: '2026-08-01',
                last_updated_at: new Date().toISOString(),
                source_name: 'RBI / FRED',
                source_ref: 'live_api:fred:TRESEGINM052N',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'monthly',
                display_frequency: 'monthly',
                percentile: 0.80,
                z_score: 1.1,
            },
            {
                metric_id: 'IN_DEBT_GDP_PCT',
                metric_name: 'India Debt / GDP %',
                value: 81.2,
                as_of_date: '2023-01-01',
                last_updated_at: new Date().toISOString(),
                source_name: 'MoSPI / FRED',
                source_ref: 'live_api:fred:GGGDTAINA188N',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'annual',
                display_frequency: 'annual',
                percentile: 0.60,
                z_score: 0.3,
            },
            {
                metric_id: 'IN_BANK_CREDIT_GROWTH_YOY',
                metric_name: 'India Bank Credit Growth YoY',
                value: 12.1,
                as_of_date: '2026-03-31',
                last_updated_at: new Date().toISOString(),
                source_name: 'RBI DBIE',
                source_ref: 'live_api:rbi:dbie_bsc1',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'monthly',
                display_frequency: 'monthly',
                percentile: 0.68,
                z_score: 0.6,
            },
            {
                metric_id: 'USD_INR_RATE',
                metric_name: 'USD / INR',
                value: 84.5,
                as_of_date: '2026-09-10',
                last_updated_at: new Date().toISOString(),
                source_name: 'Yahoo Finance / RBI Ref',
                source_ref: 'live_api:direct:yahoo',
                provenance: 'api_live',
                is_provisional: false,
                native_frequency: 'daily',
                display_frequency: 'daily',
                percentile: 0.50,
                z_score: 0.0,
            },
        ];

        const mockHistory = mockLatest.flatMap(m => [
            { metric_id: m.metric_id, as_of_date: '2025-01-01', value: 10 },
            { metric_id: m.metric_id, as_of_date: '2025-02-01', value: 11 },
            { metric_id: m.metric_id, as_of_date: '2025-03-01', value: 12 },
            { metric_id: m.metric_id, as_of_date: '2025-04-01', value: 13 },
            { metric_id: m.metric_id, as_of_date: '2025-05-01', value: 14 },
        ]);

        const mockFrom = vi.fn().mockImplementation((table: string) => {
            if (table === 'vw_latest_metrics') {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockResolvedValue({ data: mockLatest, error: null }),
                    }),
                };
            }
            if (table === 'metric_observations') {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
                        }),
                    }),
                };
            }
            return { select: vi.fn() };
        });

        (supabase.from as any) = mockFrom;

        const { result } = renderHook(() => useIndiaIntelligence(), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const data = result.current.data!;
        expect(data).toBeDefined();

        // 1. Overall regime must not be INSUFFICIENT COVERAGE
        expect(data.overallRegime).not.toBe('INSUFFICIENT COVERAGE');
        expect(['IMPROVING', 'MIXED', 'DETERIORATING']).toContain(data.overallRegime);

        // 2. All 9 metrics must be populated with non-null values
        expect(data.metrics).toHaveLength(9);
        data.metrics.forEach(metric => {
            expect(metric.value).not.toBeNull();
            expect(metric.state).not.toBe('unavailable');
            expect(metric.score).not.toBeNull();
        });

        // 3. Credit domain must be scored and not unavailable
        const creditDomain = data.domains.find(d => d.key === 'credit');
        expect(creditDomain).toBeDefined();
        expect(creditDomain?.score).not.toBeNull();
        expect(creditDomain?.state).not.toBe('unavailable');

        // 4. Fiscal domain (Debt/GDP) must be scored and not unavailable
        const fiscalDomain = data.domains.find(d => d.key === 'fiscal');
        expect(fiscalDomain).toBeDefined();
        expect(fiscalDomain?.score).not.toBeNull();
        expect(fiscalDomain?.state).not.toBe('unavailable');

        // 5. Market domain (USD/INR with live_api:direct:yahoo) must be accepted
        const marketDomain = data.domains.find(d => d.key === 'market');
        expect(marketDomain).toBeDefined();
        expect(marketDomain?.metrics[0].state).not.toBe('unavailable');

        // 6. Unavailable count must be 0
        expect(data.unavailable).toBe(0);
    });
});
