import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TreasuryHoldersChart } from '@/features/dashboard/components/charts/TreasuryHoldersChart';

describe('TreasuryHoldersChart', () => {
    it('renders empty state when data is empty', () => {
        render(<TreasuryHoldersChart data={[]} height={400} />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('No holder data')).toBeInTheDocument();
        expect(screen.getByText(/Treasury foreign holdings are not available for charting/)).toBeInTheDocument();
    });
});