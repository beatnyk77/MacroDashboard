import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataStatePanel } from '@/components/DataStatePanel';

describe('DataStatePanel', () => {
    it('renders compact empty state copy', () => {
        render(
            <DataStatePanel
                variant="empty"
                title="No data available"
                description="Awaiting next observation"
                compact
            />
        );

        expect(screen.getByText('No data available')).toBeInTheDocument();
        expect(screen.getByText(/Awaiting next observation/)).toBeInTheDocument();
    });

    it('renders full empty panel with title and description', () => {
        render(
            <DataStatePanel
                variant="empty"
                title="No liquidity history available"
                description="Historical observations are not yet populated."
            />
        );

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('No liquidity history available')).toBeInTheDocument();
        expect(screen.getByText('Historical observations are not yet populated.')).toBeInTheDocument();
    });

    it('calls onRetry for error variant', () => {
        const onRetry = vi.fn();

        render(
            <DataStatePanel
                variant="error"
                title="Failed to load module"
                description="The data feed returned an error."
                onRetry={onRetry}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /retry/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});