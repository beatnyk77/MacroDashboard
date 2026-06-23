import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopRefinersTable } from '@/features/dashboard/components/refining/TopRefinersTable';

vi.mock('@/hooks/useGlobalRefiningData', () => ({
    useGlobalRefiningData: vi.fn(),
}));

import { useGlobalRefiningData } from '@/hooks/useGlobalRefiningData';

const mockUseGlobalRefiningData = vi.mocked(useGlobalRefiningData);

describe('TopRefinersTable', () => {
    it('renders ranked facilities from refining data', () => {
        mockUseGlobalRefiningData.mockReturnValue({
            data: {
                facilities: [
                    {
                        id: 'b',
                        as_of_date: '2026-06-01',
                        country: 'USA',
                        region: 'West',
                        facility_name: 'Baytown',
                        capacity_mbpd: 520,
                        utilization_pct: 92,
                        historical_median_pct: 88,
                        status: 'Operating',
                        latitude: 0,
                        longitude: 0,
                        import_dependency_correlation: 0,
                        is_top_10: true,
                    },
                    {
                        id: 'a',
                        as_of_date: '2026-06-01',
                        country: 'KSA',
                        region: 'Middle East',
                        facility_name: 'Ras Tanura',
                        capacity_mbpd: 550,
                        utilization_pct: 85,
                        historical_median_pct: 82,
                        status: 'Operating',
                        latitude: 0,
                        longitude: 0,
                        import_dependency_correlation: 0,
                        is_top_10: true,
                    },
                ],
                regionalImbalance: [],
                lastUpdated: '2026-06-01',
            },
        });

        render(<TopRefinersTable />);

        expect(screen.getByText('Refining Alpha Ranking')).toBeInTheDocument();
        expect(screen.getByText('Ras Tanura')).toBeInTheDocument();
        expect(screen.getByText('Baytown')).toBeInTheDocument();
        expect(screen.getByText('01')).toBeInTheDocument();
    });

    it('renders empty state when no facilities are available', () => {
        mockUseGlobalRefiningData.mockReturnValue({
            data: {
                facilities: [],
                regionalImbalance: [],
                lastUpdated: '2026-06-01',
            },
        });

        render(<TopRefinersTable />);

        expect(screen.getByText('No refining facilities available')).toBeInTheDocument();
    });
});