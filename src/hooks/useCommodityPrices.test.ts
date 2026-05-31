import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCommodityPrices } from './useCommodityPrices';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({
                            data: [
                                { metric_id: 'WTI_CRUDE_PRICE', as_of_date: '2026-05-30', value: '78.50' },
                                { metric_id: 'WTI_CRUDE_PRICE', as_of_date: '2026-05-29', value: '77.80' },
                                { metric_id: 'BRENT_CRUDE_PRICE', as_of_date: '2026-05-30', value: '82.10' },
                                { metric_id: 'COPPER_PRICE_USD', as_of_date: '2026-05-30', value: '9200.00' },
                                { metric_id: 'NICKEL_PRICE_USD', as_of_date: '2026-05-30', value: '18500.00' },
                            ],
                            error: null,
                        }),
                    }),
                }),
            }),
        }),
    },
}));

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCommodityPrices', () => {
    it('maps metric_observations rows to CommodityPrice shape with human-readable symbols', async () => {
        const { result } = renderHook(() => useCommodityPrices(), { wrapper });
        await waitFor(() => expect(result.current.data).toBeDefined());

        const symbols = result.current.data!.map(p => p.symbol);
        expect(symbols).toContain('WTI Crude');
        expect(symbols).toContain('Brent Crude');
        expect(symbols).toContain('Copper ($/t)');
        expect(symbols).toContain('Nickel ($/t)');
    });

    it('coerces value to number in price field', async () => {
        const { result } = renderHook(() => useCommodityPrices(), { wrapper });
        await waitFor(() => expect(result.current.data).toBeDefined());

        const wti = result.current.data!.find(p => p.symbol === 'WTI Crude');
        expect(typeof wti!.price).toBe('number');
        expect(wti!.price).toBe(78.50);
    });

    it('returns multiple rows per symbol so PriceTerminalCard can compute % change', async () => {
        const { result } = renderHook(() => useCommodityPrices(), { wrapper });
        await waitFor(() => expect(result.current.data).toBeDefined());

        const wtiRows = result.current.data!.filter(p => p.symbol === 'WTI Crude');
        expect(wtiRows.length).toBeGreaterThanOrEqual(2);
    });
});
