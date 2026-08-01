import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoldPositioningMonitor } from '../GoldPositioningMonitor';

vi.mock('@/hooks/useGoldPositioning', () => ({
    useGoldPositioning: () => ({ data: [], isLoading: false }),
}));

describe('GoldPositioningMonitor', () => {
    it('renders a visible empty state instead of vanishing when history is empty', () => {
        const { container } = render(<GoldPositioningMonitor />);
        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getByText(/Gold positioning data unavailable/i)).toBeInTheDocument();
    });
});
