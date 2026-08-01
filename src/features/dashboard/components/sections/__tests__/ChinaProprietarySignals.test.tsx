import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChinaProprietarySignals } from '../ChinaProprietarySignals';

vi.mock('@/hooks/useChinaMacro', () => ({
    useChinaMacroPulse: () => ({ data: [] }),
    usePBOCOps: () => ({ data: [] }),
}));

describe('ChinaProprietarySignals', () => {
    it('does not render a confident bullish/bearish interpretation when the metric is missing', () => {
        render(<ChinaProprietarySignals />);
        expect(screen.queryByText(/Rising impulse/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/USD dominance stable/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/No data available/i).length).toBeGreaterThan(0);
    });
});
