import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChinaRealEconomyPanel } from '../ChinaRealEconomyPanel';

vi.mock('@/hooks/useChinaMacro', () => ({
    useChinaMacroPulse: () => ({ data: [], isLoading: false }),
    useLatestChinaMetric: () => ({ data: undefined }),
}));

describe('ChinaRealEconomyPanel', () => {
    it('shows a no-data state instead of a fabricated PMI reading when history is empty', () => {
        render(<ChinaRealEconomyPanel />);

        expect(screen.queryByText('50.1')).not.toBeInTheDocument();
        expect(screen.queryByText('50.5')).not.toBeInTheDocument();
        expect(screen.queryByText(/Expanding/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/PMI data unavailable/i).length).toBeGreaterThan(0);
    });
});
