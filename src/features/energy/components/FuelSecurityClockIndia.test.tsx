import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../hooks/useFuelSecurityIndia', () => ({
    useFuelSecurityIndia: () => ({
        data: {
            as_of_date: '2026-05-30',
            reserves_days_coverage: 8.4,
            reserves_days_official: 9.5,
            reserves_days_actual: 7.4,
            deviation_pct: -22.1,
            daily_consumption_mbpd: 5300,
            brent_price_usd: 82.5,
            inr_per_barrel: 6930,
            active_tankers_count: 0,
            tanker_pipeline_json: [],
            geopolitical_risk_score: 55,
            scenario_baseline_days: 8.4,
            scenario_disruption_days: 10.9,
            scenario_rationing_days: 12.6,
            last_updated_at: '2026-05-30T12:00:00Z',
            metadata: { source_reliability: 'medium', notes: '', ingestion_version: 3 },
        },
        isError: false,
    }),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('FuelSecurityClockIndia', () => {
    it('renders without crashing', async () => {
        const { default: FuelSecurityClockIndia } = await import('./FuelSecurityClockIndia');
        render(React.createElement(FuelSecurityClockIndia), { wrapper });
        expect(screen.getByText(/Fuel Security Clock/i)).toBeTruthy();
    });

    it('does NOT render any tanker table', async () => {
        const { default: FuelSecurityClockIndia } = await import('./FuelSecurityClockIndia');
        render(React.createElement(FuelSecurityClockIndia), { wrapper });
        expect(screen.queryByText(/Vessel/i)).toBeNull();
        expect(screen.queryByText(/Tanker Pipeline/i)).toBeNull();
    });

    it('shows Brent-INR cost panel', async () => {
        const { default: FuelSecurityClockIndia } = await import('./FuelSecurityClockIndia');
        render(React.createElement(FuelSecurityClockIndia), { wrapper });
        // Label and footnote both contain "INR/barrel" — getAllByText asserts at least one
        expect(screen.getAllByText(/INR\/barrel/i).length).toBeGreaterThanOrEqual(1);
    });
});
