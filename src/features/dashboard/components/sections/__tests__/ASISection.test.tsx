import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ASISection } from '../ASISection';

vi.mock('@/hooks/useIndiaASI', () => ({
    useIndiaASI: () => ({ data: [], isLoading: false, error: null }),
}));
vi.mock('@/hooks/useGeopoliticalExposure', () => ({
    useGeopoliticalExposure: () => ({ data: [] }),
}));

describe('ASISection', () => {
    it('shows an empty state instead of a blank map when india_asi has no rows', () => {
        render(<ASISection />);
        expect(screen.getByText(/ASI industrial data unavailable/i)).toBeInTheDocument();
    });
});
