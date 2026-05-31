import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { CurrentEnergyRegimeCard } from './CurrentEnergyRegimeCard';

vi.mock('@/hooks/useEnergyRegime', () => ({
    useEnergyRegime: () => ({
        wtiSpread: 1.25,
        wtiRegime: 'NORMAL',
        brentPrice: 82.5,
        brentChangePct: -0.3,
        refineryUtil: 91.2,
        euGasStorage: 62.4,
        isAnyStale: false,
        overallNarrative: 'Balanced physical flows with high refinery utilization.',
        lastUpdated: '2026-05-30T12:00:00Z',
    }),
}));

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('CurrentEnergyRegimeCard', () => {
    it('renders without crashing', () => {
        render(React.createElement(CurrentEnergyRegimeCard), { wrapper });
        expect(screen.getByText(/Energy Market Regime/i)).toBeTruthy();
    });

    it('shows all four metric pillar labels', () => {
        render(React.createElement(CurrentEnergyRegimeCard), { wrapper });
        expect(screen.getByText(/WTI Spread/i)).toBeTruthy();
        expect(screen.getByText(/Brent Crude/i)).toBeTruthy();
        // getAllByText because "Refinery Util" may appear in both the pillar label and the narrative
        expect(screen.getAllByText(/US Refinery Util/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/EU Gas Storage/i)).toBeTruthy();
    });

    it('renders the regime narrative', () => {
        render(React.createElement(CurrentEnergyRegimeCard), { wrapper });
        expect(screen.getByText(/Balanced physical flows/i)).toBeTruthy();
    });
});
