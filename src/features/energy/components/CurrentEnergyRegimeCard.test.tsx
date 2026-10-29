import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { CurrentEnergyRegimeCard } from './CurrentEnergyRegimeCard';

const regimeState = vi.hoisted(() => ({
    current: {
        wtiSpread: 1.25 as number | null,
        wtiRegime: 'NORMAL' as string | null,
        brentPrice: 82.5 as number | null,
        brentChangePct: -0.3 as number | null,
        refineryUtil: 91.2 as number | null,
        euGasStorage: 62.4 as number | null,
        isAnyStale: false,
        overallNarrative: 'Balanced physical flows with high refinery utilization.',
        lastUpdated: '2026-05-30T12:00:00Z' as string | null,
    },
}));

vi.mock('@/hooks/useEnergyRegime', () => ({
    useEnergyRegime: () => regimeState.current,
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
        expect(screen.getByText(/Brent Crude \(Front-Month\)/i)).toBeTruthy();
        // getAllByText because "Refinery Util" may appear in both the pillar label and the narrative
        expect(screen.getAllByText(/US Refinery Util/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/EU Gas Storage/i)).toBeTruthy();
    });

    it('renders the regime narrative', () => {
        render(React.createElement(CurrentEnergyRegimeCard), { wrapper });
        expect(screen.getByText(/Balanced physical flows/i)).toBeTruthy();
    });

    it('shows insufficient data, not NORMAL, when the spread is missing', () => {
        const original = regimeState.current;
        regimeState.current = {
            ...original,
            wtiSpread: null,
            wtiRegime: null,
            overallNarrative: 'Insufficient data — the WTI calendar spread is unavailable, so no regime is asserted.',
        };
        render(React.createElement(CurrentEnergyRegimeCard), { wrapper });
        expect(screen.getByText('INSUFFICIENT DATA')).toBeTruthy();
        expect(screen.queryByText('NORMAL')).toBeNull();
        regimeState.current = original;
    });

    it('renders an unavailable state for EU gas instead of a zero', () => {
        const original = regimeState.current;
        regimeState.current = { ...original, euGasStorage: null };
        render(React.createElement(CurrentEnergyRegimeCard), { wrapper });
        expect(screen.getAllByText('Unavailable').length).toBeGreaterThanOrEqual(1);
        regimeState.current = original;
    });
});
