import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AfricaMacroSnapshot } from '../AfricaMacroSnapshot';

vi.mock('@/hooks/useAfricaMacroSnapshot', () => ({
    useAfricaMacroSnapshot: () => ({ data: null, isLoading: false }),
}));

describe('AfricaMacroSnapshot', () => {
    it('renders a visible empty state instead of vanishing when no snapshot exists', () => {
        const { container } = render(<AfricaMacroSnapshot />);
        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getByText(/Africa macro snapshot unavailable/i)).toBeInTheDocument();
    });
});
