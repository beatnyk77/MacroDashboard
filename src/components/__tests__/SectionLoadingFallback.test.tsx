import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionLoadingFallback } from '@/components/SectionLoadingFallback';

describe('SectionLoadingFallback', () => {
    it('renders with default accessible label', () => {
        render(<SectionLoadingFallback />);

        expect(screen.getByRole('status', { name: 'Loading module' })).toBeInTheDocument();
    });

    it('accepts a custom label and min height', () => {
        render(
            <SectionLoadingFallback
                label="Loading sovereign risk matrix"
                minHeight={400}
            />
        );

        const status = screen.getByRole('status', { name: 'Loading sovereign risk matrix' });
        expect(status).toBeInTheDocument();
        expect(status).toHaveStyle({ minHeight: 400 });
    });
});