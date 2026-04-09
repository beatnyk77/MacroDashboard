import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReserveSellerData } from '../useReserveSellerData';
import React from 'react';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

import { supabase } from '@/lib/supabase';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,

      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useReserveSellerData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transforms data correctly from database response', async () => {
    // Setup mock data
    const mockTic = [
      { country_name: 'Japan', as_of_date: '2023-01-01', holdings_usd_bn: 1000 },
      { country_name: 'Japan', as_of_date: '2024-01-01', holdings_usd_bn: 1100 },
    ];
    const mockFx = [
      { country_code: 'JP', as_of_date: '2023-01-01', fx_reserves_usd: 1200e9 },
      { country_code: 'JP', as_of_date: '2024-01-01', fx_reserves_usd: 1300e9 },
    ];
    const mockOil = [
      { as_of_date: '2024-01-01', price: 80 },
    ];

    (supabase.from as any).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => {
        if (table === 'tic_foreign_holders') return Promise.resolve({ data: mockTic, error: null });
        if (table === 'country_reserves') return Promise.resolve({ data: mockFx, error: null });
        if (table === 'commodity_prices') return Promise.resolve({ data: mockOil, error: null });
        return Promise.resolve({ data: [], error: null });
      }),
    }));

    const { result } = renderHook(() => useReserveSellerData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const japan = result.current.data?.countries.find(c => c.country_code === 'JP');
    expect(japan).toBeDefined();
    expect(japan?.latest_tic).toBe(1100);
    expect(japan?.latest_fx).toBe(1300); // 1300e9 / 1e9
    expect(result.current.data?.latestOil).toBe(80);
  });

  it('handles empty data gracefully', async () => {
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => Promise.resolve({ data: [], error: null })),
    }));

    const { result } = renderHook(() => useReserveSellerData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.latestOil).toBe(0);
    expect(result.current.data?.countries[0].latest_tic).toBe(0);
  });
});
