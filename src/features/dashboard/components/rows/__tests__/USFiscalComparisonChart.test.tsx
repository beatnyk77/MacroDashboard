import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import USFiscalComparisonChart from '@/features/dashboard/components/rows/USFiscalComparisonChart';

const mockRefetch = vi.fn();

vi.mock('@/hooks/useUSMacroPulse', () => ({
    useUSMacroPulse: vi.fn(),
}));

import { useUSMacroPulse } from '@/hooks/useUSMacroPulse';

const mockedUseUSMacroPulse = vi.mocked(useUSMacroPulse);

describe('USFiscalComparisonChart', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when fiscal series are missing', () => {
        mockedUseUSMacroPulse.mockReturnValue({
            data: [
                { metric_id: 'US_DEFENSE_SPENDING', history: [], current_value: 0, isStale: false },
            ],
            isError: false,
            refetch: mockRefetch,
        } as ReturnType<typeof useUSMacroPulse>);

        render(<USFiscalComparisonChart />);

        expect(screen.getByText('No fiscal comparison data')).toBeInTheDocument();
    });

    it('renders error state with retry when query fails', () => {
        mockedUseUSMacroPulse.mockReturnValue({
            data: undefined,
            isError: true,
            refetch: mockRefetch,
        } as ReturnType<typeof useUSMacroPulse>);

        render(<USFiscalComparisonChart />);

        expect(screen.getByText('Fiscal comparison unavailable')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
});