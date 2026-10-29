import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { WeeklyBalanceDesk } from './WeeklyBalanceDesk';
import type { WeeklyBalanceData } from '@/features/energy/hooks/useWeeklyBalance';

const hookState = vi.hoisted(() => ({
    value: { data: undefined, isLoading: false, isError: false, refetch: () => {} } as {
        data: unknown;
        isLoading: boolean;
        isError: boolean;
        refetch: () => void;
    },
}));

vi.mock('@/features/energy/hooks/useWeeklyBalance', () => ({
    useWeeklyBalance: () => hookState.value,
}));

/** Synthetic weekly Friday series, 2020-10-02 .. 2026-10-23. Test data only. */
function synthetic(base: number, amplitude: number, offset = 0) {
    const out: Array<{ date: string; value: number }> = [];
    const d = new Date('2020-10-02T00:00:00Z');
    const end = new Date('2026-10-23T00:00:00Z');
    let i = 0;
    while (d <= end) {
        out.push({ date: d.toISOString().slice(0, 10), value: base + amplitude * Math.sin(i / 8) + offset });
        d.setUTCDate(d.getUTCDate() + 7);
        i += 1;
    }
    return out;
}

const empty: WeeklyBalanceData = {
    crude: [], cushing: [], gasoline: [], distillate: [], jet: [], spr: [],
    utilization: [], productSupplied: [], production: [], netImports: [],
};

const full: WeeklyBalanceData = {
    crude: synthetic(430, 25),
    cushing: synthetic(30, 5),
    gasoline: synthetic(220, 12),
    distillate: synthetic(115, 9),
    jet: synthetic(42, 3),
    spr: synthetic(300, 40),
    utilization: synthetic(90, 3),
    productSupplied: synthetic(20000, 800),
    production: [],
    netImports: [],
};

describe('WeeklyBalanceDesk', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-30T12:00:00Z'));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows an explicit empty state, never estimates, when nothing is stored', () => {
        hookState.value = { data: empty, isLoading: false, isError: false, refetch: () => {} };
        render(React.createElement(WeeklyBalanceDesk));
        expect(screen.getByText(/No EIA weekly data stored yet/i)).toBeTruthy();
    });

    it('renders every stock row with its 5-year comparison and the source line', () => {
        hookState.value = { data: full, isLoading: false, isError: false, refetch: () => {} };
        render(React.createElement(WeeklyBalanceDesk));
        for (const label of ['Commercial crude (ex-SPR)', 'Cushing crude', 'Total gasoline', 'Distillate fuel oil', 'Jet fuel', 'Strategic Petroleum Reserve']) {
            // Four of the six labels also appear as chart selector buttons, so allow more than one match.
            expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
        }
        expect(screen.getByText(/Week ending 2026-10-23/)).toBeTruthy();
        expect(screen.getByText('ON SCHEDULE')).toBeTruthy();
        expect(screen.getByRole('region', { name: /against its 5-year range/i })).toBeTruthy();
    });

    it('flags a missing release rather than showing stale data as current', () => {
        vi.setSystemTime(new Date('2026-11-06T09:00:00Z'));
        hookState.value = { data: full, isLoading: false, isError: false, refetch: () => {} };
        render(React.createElement(WeeklyBalanceDesk));
        expect(screen.getByText('OVERDUE')).toBeTruthy();
    });

    it('says awaiting release inside the Wednesday-to-Thursday window', () => {
        vi.setSystemTime(new Date('2026-11-04T16:00:00Z'));
        hookState.value = { data: full, isLoading: false, isError: false, refetch: () => {} };
        render(React.createElement(WeeklyBalanceDesk));
        expect(screen.getByText('AWAITING RELEASE')).toBeTruthy();
    });

    it('shows dashes for supply series that are not stored instead of zeros', () => {
        hookState.value = { data: full, isLoading: false, isError: false, refetch: () => {} };
        render(React.createElement(WeeklyBalanceDesk));
        expect(screen.getAllByText('Series not yet stored')).toHaveLength(2);
    });

    it('shows the unavailable row for a stock with no data', () => {
        hookState.value = { data: { ...full, jet: [] }, isLoading: false, isError: false, refetch: () => {} };
        render(React.createElement(WeeklyBalanceDesk));
        expect(screen.getByText(/Unavailable — no weekly data stored yet/)).toBeTruthy();
    });
});
