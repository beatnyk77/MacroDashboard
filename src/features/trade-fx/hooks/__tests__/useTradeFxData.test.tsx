import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import { useTradeFxData } from '../useTradeFxData';

vi.mock('@/hooks/useCurrencyWars', () => ({
    useCurrencyWars: () => ({
        data: [
            { date: '2026-06-01', usd_inr: 85.5, divergence: 80, tension: 35, composite_pressure: 40, pressure: 40 },
        ],
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('@/hooks/useLatestMetric', () => ({
    useLatestMetric: () => ({
        data: {
            value: 85.5,
            history: [{ date: '2026-06-01', value: 85.5 }],
            lastUpdated: '2026-06-01',
        },
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('@/hooks/useIndiaMacro', () => ({
    useIndiaMacro: () => ({
        data: { metrics: [{ last_updated_at: '2026-06-01' }], history: {} },
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('@/hooks/useRBIFXDefense', () => ({
    useRBIFXDefense: () => ({
        data: [{ date: '2026-06-01', fx_reserves_bn: 680 }],
        loading: false,
        error: null,
    }),
}));

vi.mock('@/hooks/useUSMacroPulse', () => ({
    useUSMacroPulse: () => ({
        data: [
            { metric_id: 'US_10Y_YIELD', current_value: 4.2, history: [{ date: '2026-06-01', value: 4.2 }] },
        ],
    }),
}));

vi.mock('@/hooks/useDeDollarization', () => ({
    useDeDollarization: () => ({
        data: {
            usdShare: { value: 58, delta_yoy_pct: -0.3, last_updated_at: '2026-03-01' },
            goldShare: null,
            rmbShare: null,
            eurShare: null,
            goldHoldings: null,
            otherShare: null,
        },
    }),
}));

vi.mock('@/hooks/useCommodities', () => ({
    useCommodities: () => ({
        data: {
            brent: {
                current: { value: 78 },
                history: [{ date: '2026-05-30', value: 76 }, { date: '2026-06-01', value: 78 }],
            },
            wti: { current: null, history: [] },
            copper: { current: null, history: [] },
            nickel: { current: null, history: [] },
        },
    }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return (
        <QueryClientProvider client={qc}>
            <Suspense fallback={<div>loading</div>}>{children}</Suspense>
        </QueryClientProvider>
    );
}

describe('useTradeFxData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('composes hooks into unified TradeFxData with regime signals', async () => {
        const { result } = renderHook(() => useTradeFxData(), { wrapper });

        await waitFor(() => {
            expect(result.current.spot).toBe(85.5);
            expect(result.current.macroSignals).toHaveLength(5);
            expect(result.current.volatilityRegime).toBeDefined();
            expect(result.current.regimeNote).toContain('volatility regime');
            expect(result.current.isLoading).toBe(false);
            expect(result.current.hasError).toBe(false);
        });
    });
});